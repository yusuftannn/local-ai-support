# AI Talep Analizi

Yerel Ollama modeli ile müşteri taleplerini sınıflandıran ve destek ekibine
özet ile yanıt taslağı hazırlayan bir FastAPI + Angular uygulamasıdır.

## Nedir?

Bu proje, bir müşteri mesajını şu şekilde işler:

1. Mesajı alır
2. Yerel LLM modeliyle analiz eder
3. Mesajın türünü belirler: hata, özellik isteği, soru veya diğer
4. Kısa konu ve özet çıkarır
5. Mesajın etkisine göre düşük, normal veya yüksek öncelik önerir
6. Kullanıcıya uygun bir yanıt taslağı hazırlar

Amaç, destek taleplerini daha hızlı sınıflandırmak ve operatörlerin iş yükünü hafifletmektir.

## Özellikler

- FastAPI tabanlı REST API
- Ollama ile yerel model entegrasyonu
- Pydantic doğrulaması ile güvenli JSON çıktısı
- Türkçe müşteri mesajlarına özel analiz akışı
- Mesaj etkisine göre LLM tabanlı öncelik önerisi
- Operatör düzeltmeleriyle yerel etiketli veri toplama ve CSV dışa aktarma
- Geri bildirimlerden kategori ve öncelik uyumunu ölçme
- Angular tabanlı web arayüzü
- Talep analiz ekranı, yönetim paneli ve geçmiş kayıtlar
- Hata, timeout, eksik model ve kötü JSON yanıtlarını yönetme

## Çalışma Mantığı

Projede mesaj akışı şu şekildedir:

Mesaj → Angular arayüzü → FastAPI API → Ollama chat modeli → JSON doğrulama → Angular arayüzünde sonuç

Model, sadece belirlenen şema içinde dönüt üretir:

- category
- topic
- summary
- reply
- priority

Bu yaklaşım, uygulamanın çıktısını tahmin edilebilir ve kullanılabilir hale getirir.

## Teknoloji Yığını

- Python
- FastAPI
- Pydantic
- Ollama
- HTTPX
- Angular / TypeScript

## Kurulum

Gereksinimler:

- Python 3.10+
- Node.js ve npm
- Ollama

Bağımlılıkları kurun ve modeli indirin:

```bash
ollama pull qwen3:1.7b
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
cd frontend
npm install
cd ..
```

## Geliştirme

Angular geliştirme sunucusu ve FastAPI için iki ayrı terminal kullanın.

Üretimde analiz uç noktası istemci IP'si başına varsayılan olarak 60 saniyede
30 istek kabul eder. Bu değerler ve model zaman aşımı ortam değişkenleriyle
ayarlanabilir:

```powershell
$env:ANALYZE_RATE_LIMIT_MAX = "60"
$env:ANALYZE_RATE_LIMIT_WINDOW = "60"
$env:OLLAMA_TIMEOUT_SECONDS = "180"
$env:FEEDBACK_DB_PATH = "D:\data\ai-talep\feedback.sqlite3"
```

Her API yanıtında `X-Request-ID` bulunur. Bu kimlik, uygulama loglarındaki
istek süresi ve HTTP durumuyla birlikte hata ayıklamayı kolaylaştırır. Yanıtlar
ayrıca temel tarayıcı güvenlik başlıklarıyla döner.

SQLite geri bildirim veritabanı eşzamanlı okuma/yazma için WAL modunda çalışır.
Üretimde `feedback.sqlite3` dosyasını düzenli olarak yedekleyin; bu dosya
müşteri mesajları içerebilir.

Terminal 1 — FastAPI:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2 — Angular:

```powershell
cd frontend
npm start
```

Uygulama:

- http://localhost:4200 — Angular arayüzü
- http://127.0.0.1:8000/docs — FastAPI API dokümantasyonu

Angular geliştirme sunucusundaki `/api` istekleri
`frontend/proxy.conf.json` ile FastAPI'nin `8000` portuna yönlendirilir.
FastAPI çalışmıyorsa `ECONNREFUSED` proxy hatası alınır.

## Production derlemesi

Angular çıktısını oluşturun:

```powershell
cd frontend
npm run build
cd ..
```

Ardından FastAPI'yi başlatın:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

FastAPI, `frontend/dist/frontend/browser` altındaki Angular çıktısını `/`,
`/dashboard` ve `/history` rotalarında sunar.

İzleme sistemleri için `/api/health` Ollama durumunu raporlar; yalnızca servis
ve model kullanıma hazır olduğunda `200` dönen `/api/ready` endpoint'i
deployment health check olarak kullanılabilir.

## Testler

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

## Üretim notları

- Model çıktıları destek ekibi tarafından gönderilmeden önce kontrol edilmelidir; yapay zeka önerileri otomatik olarak müşteriye iletilmez.
- Model yanıtları her zaman doğru olmayabilir; kullanıcı onayı ve kontroller önemlidir.
- Geri bildirim kaydı yalnızca onay kutusu işaretlendiğinde yapılır. Talep metinleri bu bilgisayardaki SQLite veritabanında saklanır; hassas veya kişisel verileri kaydetmeyin.
- Gösterilen uyum oranları, operatörün değerlendirdiği kayıtlar üzerindeki oranlardır; tüm taleplere genellenmiş doğruluk garantisi değildir.
- Üretimde `OLLAMA_URL`, `OLLAMA_MODEL`, rate limit değerleri ve veritabanı yedekleme politikasını ortamınıza göre belirleyin.

## İletişim

Sorularınız, geri bildirimleriniz veya iş birliği fırsatları için dilediğiniz zaman iletişime geçebilirsiniz.

🌐 **Website**  
https://www.yusuftan.com.tr

💼 **LinkedIn**  
https://www.linkedin.com/in/yusuftann/

📧 **Email**  
yusuftan41@hotmail.com