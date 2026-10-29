import httpx
import pytest
from fastapi.testclient import TestClient
import main

client = TestClient(main.app)
RESULT = {"category": "hata", "priority": "normal", "topic": "Video", "summary": "Video açılmıyor.", "reply": "Sahne bilgisini paylaşır mısınız?"}


def mock_ollama(monkeypatch, status=200, data=None, error=None):
    class FakeClient:
        def __init__(self, **kwargs): pass
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass
        async def aclose(self): pass
        async def post(self, url, json, timeout=None):
            assert json["stream"] is False
            assert json["format"]["properties"]["category"]
            assert json["format"]["properties"]["priority"]
            if error: raise error
            return httpx.Response(status, json=data, request=httpx.Request("POST", url))
    monkeypatch.setattr(main.httpx, "AsyncClient", FakeClient)


def test_page():
    response = client.get("/")
    assert response.status_code == 200
    assert "<app-root>" in response.text
    assert "AI Talep Analizi" in response.text


def test_additional_pages():
    dashboard = client.get("/dashboard")
    history = client.get("/history")
    assert dashboard.status_code == 200
    assert history.status_code == 200
    assert "<app-root>" in dashboard.text
    assert "<app-root>" in history.text


def test_success(monkeypatch):
    import json
    mock_ollama(monkeypatch, data={"message": {"content": json.dumps(RESULT)}})
    response = client.post("/api/analyze", json={"message": "Video açılmıyor."})
    assert response.status_code == 200
    assert response.json() == RESULT


def test_blank():
    assert client.post("/api/analyze", json={"message": "      "}).status_code == 422


def test_invalid_output(monkeypatch):
    mock_ollama(monkeypatch, data={"message": {"content": '{"category":"unknown"}'}})
    assert client.post("/api/analyze", json={"message": "Video açılmıyor."}).status_code == 502


def test_invalid_priority(monkeypatch):
    import json
    result = {**RESULT, "priority": "kritik"}
    mock_ollama(monkeypatch, data={"message": {"content": json.dumps(result)}})
    assert client.post("/api/analyze", json={"message": "Video açılmıyor."}).status_code == 502


def test_feedback_metrics_and_export(monkeypatch, tmp_path):
    import csv
    import io

    monkeypatch.setattr(main, "FEEDBACK_DB", tmp_path / "feedback.sqlite3")
    feedback = {
        "message": "=1+1 şeklinde hata oluşuyor.",
        "predicted_category": "soru",
        "corrected_category": "hata",
        "predicted_priority": "normal",
        "corrected_priority": "yuksek",
    }
    assert client.post("/api/feedback", json={**feedback, "message": "    "}).status_code == 422
    saved = client.post("/api/feedback", json=feedback)
    assert saved.status_code == 201
    assert saved.json() == {"saved": True}

    listed = client.get("/api/feedback").json()
    assert len(listed["items"]) == 1
    assert listed["items"][0]["message"] == feedback["message"]

    metrics = client.get("/api/feedback/metrics").json()
    assert metrics == {
        "evaluated_count": 1,
        "category_accuracy": 0,
        "priority_accuracy": 0,
        "exact_match_accuracy": 0,
        "category_counts": {"hata": 1},
        "priority_counts": {"yuksek": 1},
    }

    exported = client.get("/api/feedback/export")
    rows = list(csv.reader(io.StringIO(exported.text.lstrip("\ufeff"))))
    assert rows[1][0] == "'=1+1 şeklinde hata oluşuyor."
    assert rows[1][3] == "hata"


def test_feedback_search_filters_and_pagination(monkeypatch, tmp_path):
    monkeypatch.setattr(main, "FEEDBACK_DB", tmp_path / "feedback.sqlite3")
    entries = [
        ("Excel raporu nasıl alınır?", "soru", "dusuk"),
        ("Excel dışa aktarma özelliği", "ozellik_istegi", "dusuk"),
        ("Video yükleme hatası", "hata", "yuksek"),
    ]
    for message, category, priority in entries:
        response = client.post("/api/feedback", json={
            "message": message,
            "predicted_category": category,
            "corrected_category": category,
            "predicted_priority": priority,
            "corrected_priority": priority,
        })
        assert response.status_code == 201

    filtered = client.get(
        "/api/feedback",
        params={"search": "EXCEL", "category": "ozellik_istegi", "priority": "dusuk"},
    ).json()
    assert filtered["total"] == 1
    assert filtered["items"][0]["message"] == "Excel dışa aktarma özelliği"

    page = client.get("/api/feedback", params={"limit": 1, "offset": 1}).json()
    assert page["total"] == 3
    assert len(page["items"]) == 1
    assert page["items"][0]["message"] == "Excel dışa aktarma özelliği"
    assert client.get("/api/feedback", params={"limit": 101}).status_code == 422


@pytest.mark.parametrize("status,error,expected", [
    (404, None, 502),
    (200, httpx.ConnectError("offline"), 503),
    (200, httpx.ReadTimeout("timeout"), 504),
])
def test_errors(monkeypatch, status, error, expected):
    mock_ollama(monkeypatch, status=status, data={}, error=error)
    assert client.post("/api/analyze", json={"message": "Video açılmıyor."}).status_code == expected
