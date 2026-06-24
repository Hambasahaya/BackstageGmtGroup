<!-- # Instagram Graph API Setup

Dashboard dapat berjalan hanya dengan environment variables. Token selalu dibaca di backend dan tidak pernah dikirim ke browser.

## Opsi A: Banyak Akun (Disarankan)

Gunakan long-lived Meta User Access Token. Backend otomatis mengambil semua Facebook Page yang dikelola beserta Instagram Business Account yang terhubung.

```env
META_ACCESS_TOKEN=your_long_lived_user_access_token
META_GRAPH_VERSION=v22.0
META_INSIGHT_DAYS=30
META_MEDIA_LIMIT=25
META_ACCOUNT_INSIGHT_METRICS=reach,profile_views,website_clicks,profile_links_taps,follower_count,follows_and_unfollows,views
```

Token membutuhkan permission berikut:

```text
pages_show_list
pages_read_engagement
instagram_basic
instagram_manage_insights
instagram_content_publish
```

Setiap Instagram harus berupa akun Business atau Creator dan terhubung ke Facebook Page yang dapat diakses token tersebut.

## Opsi B: Satu Akun Langsung

Gunakan Page Access Token dan Instagram Business User ID jika tidak membutuhkan auto-discovery.

```env
META_PAGE_ACCESS_TOKEN=your_page_access_token
META_PAGE_ID=your_facebook_page_id
META_IG_USER_ID=your_instagram_business_user_id
META_IG_USERNAME=optional_username
META_GRAPH_VERSION=v22.0
META_INSIGHT_DAYS=30
META_MEDIA_LIMIT=25
```

`META_PAGE_ID` bersifat opsional pada mode ini. `META_PAGE_ACCESS_TOKEN` dan `META_IG_USER_ID` wajib diisi.

## Opsi C: OAuth dari Dashboard

Isi konfigurasi aplikasi berikut agar tombol **Hubungkan Meta** dapat digunakan:

```env
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
META_REDIRECT_URI=https://your-domain.com/api/meta/callback
META_DASHBOARD_URL=https://your-domain.com/integrations
META_OAUTH_STATE=use_a_long_random_value
META_SCOPES=pages_show_list,pages_read_engagement,instagram_basic,instagram_manage_insights,instagram_content_publish
META_ENABLE_AUTO_POST=false
GOOGLE_DRIVE_ASSET_FOLDER_ID=your_drive_folder_id_for_instagram_assets
META_COMPETITOR_USERNAMES=kompetitor1,kompetitor2,kompetitor3
META_COMPETITOR_MEDIA_LIMIT=24
```

Tambahkan nilai `META_REDIRECT_URI` yang sama persis ke **Valid OAuth Redirect URIs** pada Meta Developer Dashboard.

OAuth menyimpan token ke `META_TOKEN_STORE_PATH`. File lokal cocok untuk development, tetapi deployment serverless sebaiknya memakai Opsi A/B atau mengganti token store dengan database/KV persisten.

## Pemeriksaan

Setelah env diterapkan dan server dijalankan ulang:

1. Buka `/api/meta/accounts`. Respons harus memiliki `connected: true` dan daftar `instagramAccounts`.
2. Buka `/api/meta/instagram-insights?igUserId=ID_AKUN`. Respons harus memiliki `profile`, `insights`, dan `media`.
3. Buka menu **Marketing Integrations** dan pilih akun melalui dropdown.

Metrik yang tidak tersedia karena jenis akun, jumlah followers, App Review, atau versi Graph API akan dikembalikan sebagai peringatan tanpa menggagalkan metrik lainnya. -->
