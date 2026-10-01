# AI Talep Analizi

Yerel bir model ile müşteri taleplerini sınıflandıran ve destek ekibine hızlı bir özet ile cevap taslağı hazırlayan mini bir Python projesidir. Proje, ücretli API anahtarı kullanmadan, bilgisayarınızda çalışan Ollama modeli üzerinden çalışır.

## Nedir?

Bu proje, bir müşteri mesajını şu şekilde işler:

1. Mesajı alır
2. Yerel LLM modeliyle analiz eder
3. Mesajın türünü belirler: hata, özellik isteği, soru veya diğer
4. Kısa konu ve özet çıkarır
5. Kullanıcıya uygun bir yanıt taslağı hazırlar

Amaç, destek taleplerini daha hızlı sınıflandırmak ve operatörlerin iş yükünü hafifletmektir.

## Özellikler

- FastAPI tabanlı REST API
- Ollama ile yerel model entegrasyonu
- Pydantic doğrulaması ile güvenli JSON çıktısı
- Türkçe müşteri mesajlarına özel analiz akışı
- Web arayüzü ile hızlı test imkanı
- Hata, timeout, eksik model ve kötü JSON yanıtlarını yönetme

## Çalışma Mantığı

Projede mesaj akışı şu şekildedir:

Mesaj → FastAPI API → Ollama chat modeli → JSON doğrulama → web arayüzünde sonuç gösterimi

Model, sadece belirlenen şema içinde dönüt üretir:

- category
- topic
- summary
- reply

Bu yaklaşım, uygulamanın çıktısını tahmin edilebilir ve kullanılabilir hale getirir.

## Teknoloji Yığını

- Python
- FastAPI
- Pydantic
- Ollama
- HTTPX
- HTML / JavaScript

## Proje Yapısı

- `main.py` — FastAPI uygulaması, model çağrısı ve veri doğrulama
- `static/index.html` — arayüz ve istemci tarafı örnek kullanım
- `test_main.py` — API davranışlarını test eden senaryolar
- `requirements.txt` — proje bağımlılıkları

## Çalıştırma

Önce Ollama kurulu olmalı ve bir model indirilmeli; ardından proje başlatılabilir:

```bash
ollama pull qwen3:1.7b
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1
```

Sonrasında tarayıcıdan uygulamaya erişilebilir:

- http://127.0.0.1:8000
- http://127.0.0.1:8000/docs

## Notlar

- Bu proje, gerçek üretim seviyesi bir destek sistemi değil; öğrenme ve prototip geliştirme amacı taşır.
- Model yanıtları her zaman doğru olmayabilir; kullanıcı onayı ve kontroller önemlidir.
- Amaç, iş akışını göstermek ve kişisel veya küçük ölçekli otomasyon için temel bir yapı sunmaktır.
