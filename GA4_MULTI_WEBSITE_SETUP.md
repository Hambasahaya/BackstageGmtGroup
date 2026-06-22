# GA4 Multi-Website Setup

Halaman **Websites** membaca data real dari Google Analytics Data API untuk beberapa GA4 property. Backend mendukung service account dan OAuth.

## Service Account (Disarankan)

Untuk development lokal:

```env
GOOGLE_APPLICATION_CREDENTIALS=C:/path/to/service-account.json
GA4_REPORT_DAYS=30
```

Tambahkan `client_email` dari file service account sebagai user dengan role **Viewer** pada GA4 Account atau setiap GA4 Property. Jika `GA4_PROPERTIES` dan `GA4_PROPERTY_IDS` dikosongkan, backend otomatis menemukan seluruh property yang dapat diakses service account. Auto-discovery membutuhkan **Google Analytics Admin API** aktif.

Jangan commit file service account. Untuk deployment, simpan seluruh isi JSON sebagai secret:

```env
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Jika platform bermasalah dengan multiline private key, encode file JSON ke base64 dan gunakan:

```env
GOOGLE_SERVICE_ACCOUNT_BASE64=base64_encoded_json
```

## OAuth Alternatif

Gunakan OAuth credential Google yang refresh token-nya memiliki scope `analytics.readonly`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_refresh_token

GA4_REPORT_DAYS=30
```

Property dapat ditemukan otomatis. Untuk membatasi atau memberi nama domain secara manual, isi `GA4_PROPERTIES`. `id` adalah numeric **GA4 Property ID**, bukan Measurement ID seperti `G-XXXXXXXXXX`.

Jika platform deployment menyulitkan nilai JSON, gunakan format alternatif:

```env
GA4_PROPERTY_IDS=123456789:gmtlighting.id,987654321:gmttraining.id
```

Aktifkan **Google Analytics Data API** pada Google Cloud project. Aktifkan juga **Google Analytics Admin API** bila memakai auto-discovery. Akun atau service account harus memiliki akses Viewer atau lebih tinggi ke seluruh GA4 property yang didaftarkan.

## Endpoint

```text
GET /api/analytics/websites?days=30
```

Endpoint mengambil overview, tren harian, source/medium, halaman teratas, serta new vs returning users untuk setiap property. Kegagalan satu property dikembalikan sebagai warning dan tidak menggagalkan website lainnya.
