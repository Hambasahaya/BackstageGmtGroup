# GMT Group Central Dashboard

Dashboard operasional untuk mengelola website, SEO, artikel/CMS, event, peserta, notifikasi, role access, media library, workflow task, dan reporting GMT Group.

## Running the Code

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Migrasi Artikel Dari Website Lama

Script migrasi akan mencoba membaca artikel dari WordPress REST API (`/wp-json/wp/v2/posts`) lebih dulu. Jika tidak tersedia, script fallback ke sitemap (`post-sitemap.xml`, `sitemap.xml`, atau `sitemap_index.xml`). Jalankan dry-run dulu untuk memeriksa hasil scraping:

```bash
npm run articles:migrate -- --old-site=https://website-lama.com --dry-run=true
```

Kalau ingin dari link artikel langsung saja:

```bash
npm run articles:migrate -- --url=https://website-lama.com/artikel/contoh --dry-run=true
```

Untuk beberapa link:

```bash
npm run articles:migrate -- --urls=https://website-lama.com/a,https://website-lama.com/b --dry-run=true
```

Untuk menyimpan ke database lewat endpoint backend:

```bash
npm run articles:migrate -- --old-site=https://website-lama.com --api-base-url=http://localhost:8080 --endpoint=/api/articles --token=JWT_TOKEN --dry-run=false
```

Alternatif auth: isi `ARTICLE_IMPORT_EMAIL` dan `ARTICLE_IMPORT_PASSWORD`, lalu script akan login ke `/api/auth/login` dan memakai token dari response. Endpoint default yang dipakai adalah `/api/articles`; ubah `ARTICLE_IMPORT_ENDPOINT` jika backend memakai path lain.
