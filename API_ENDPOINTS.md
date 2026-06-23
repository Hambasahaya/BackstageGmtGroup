# API Endpoints

Dokumen ini menjelaskan endpoint API yang tersedia dan fitur yang memakai endpoint tersebut.

Base URL lokal:

```text
http://localhost:8080
```

Untuk endpoint yang membutuhkan login, kirim header:

```text
Authorization: Bearer <token>
```

Akun default testing dibuat otomatis setelah migration jika email belum ada:

```text
Super Admin: superadmin@example.com / password123
Sales: sales@example.com / password123
```

## Health

### `GET /health`

Dipakai untuk mengecek apakah server API sedang hidup.

Response:

```json
{
  "status": "ok"
}
```

## Auth

### `POST /api/auth/register`

Dipakai untuk fitur registrasi akun baru.

Role yang tersedia:

- `user`
- `agent`
- `super_admin`
- `sales`
- `marketing`

Body:

```json
{
  "name": "Admin",
  "ttl": "Jakarta, 10 Januari 2000",
  "phone_number": "081234567890",
  "gender": "laki-laki",
  "email": "admin@example.com",
  "domicile": "Jakarta",
  "company_name": "PT Contoh Maju",
  "job": "Manager",
  "instagram": "admin.ig",
  "facebook": "Admin FB",
  "tiktok": "admin.tt",
  "photo": "uploads/users/photo.jpg",
  "ktp_photo": "uploads/users/ktp.jpg",
  "full_address": "Jl. Contoh No. 10, Jakarta",
  "bank_name": "BCA",
  "account_number": "1234567890",
  "status": "active",
  "password": "password123",
  "role": "user"
}
```

Catatan:

- Jika `role` kosong, otomatis menjadi `user`.
- Data utama masuk ke tabel `users`.
- Data tambahan masuk ke tabel `detail_users`.

### `POST /api/auth/login`

Dipakai untuk fitur login dan mendapatkan JWT token.

Body:

```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

Response berisi `token` yang dipakai untuk endpoint protected.

### `POST /api/auth/forgot-password`

Dipakai untuk fitur lupa password tahap pertama: cek email dan kirim token reset ke Gmail.

Body:

```json
{
  "email": "admin@example.com"
}
```

Jika email terdaftar, sistem membuat token 6 digit dan mengirimkannya lewat email.

### `POST /api/auth/verify-reset-token`

Dipakai untuk fitur verifikasi token reset password.

Body:

```json
{
  "email": "admin@example.com",
  "token": "123456"
}
```

### `POST /api/auth/reset-password`

Dipakai untuk fitur mengganti password setelah token valid.

Body:

```json
{
  "email": "admin@example.com",
  "token": "123456",
  "new_password": "passwordbaru123"
}
```

### `GET /api/auth/me`

Dipakai untuk mengambil data user yang sedang login.

Auth: wajib login.

### `POST /api/auth/apply-agent`

Dipakai untuk fitur user mengajukan diri menjadi agent.

Auth: wajib login sebagai `user`.

Body:

```json
{
  "job": "Sales Executive",
  "instagram": "user.ig",
  "facebook": "User FB",
  "tiktok": "user.tt",
  "photo": "uploads/users/photo.jpg",
  "ktp_photo": "uploads/users/ktp.jpg",
  "full_address": "Jl. Contoh No. 10, Jakarta",
  "bank_name": "BCA",
  "account_number": "1234567890"
}
```

Efek:

- Mengisi/update data `detail_users`.
- Set `detail_users.status = "not_verif"`.
- Role tetap `user` sampai admin memverifikasi.

## Products

### `GET /api/products`

Dipakai untuk fitur list product.

Query opsional:

```text
?search=keyword
```

Contoh:

```http
GET /api/products?search=rumah
```

### `GET /api/products/:id`

Dipakai untuk fitur detail product.

Contoh:

```http
GET /api/products/1
```

### `POST /api/products`

Dipakai untuk fitur tambah product.

Untuk sementara endpoint ini belum dibatasi role.

Body:

```json
{
  "namaproduct": "Produk A",
  "foto": "uploads/products/produk-a.jpg",
  "deskripsi": "Deskripsi produk A",
  "unit": "unit",
  "price": 20000000
}
```

### `PUT /api/products/:id`

Dipakai untuk fitur edit product.

Untuk sementara endpoint ini belum dibatasi role.

Body:

```json
{
  "namaproduct": "Produk A Update",
  "foto": "uploads/products/produk-a.jpg",
  "deskripsi": "Deskripsi produk A update",
  "unit": "unit",
  "price": 21000000
}
```

### `DELETE /api/products/:id`

Dipakai untuk fitur hapus product.

Untuk sementara endpoint ini belum dibatasi role.

## Preorders

### `GET /api/preorders`

Dipakai untuk fitur list PO.

Query opsional:

```text
?search=keyword
?status=draft
?search=keyword&status=in_review
```

Search mencari:

- nama product
- nama customer
- email customer
- nomor HP customer

### `GET /api/preorders/:id`

Dipakai untuk fitur detail PO.

### `POST /api/preorders`

Dipakai untuk fitur membuat PO baru.

Body:

```json
{
  "id_product": 1,
  "id_agent": 2,
  "qty": 3,
  "nama_customer": "Customer A",
  "email": "customer@example.com",
  "alamat": "Jl. Customer No. 1",
  "no_hp": "081234567890",
  "catatan": "Catatan tambahan"
}
```

Efek:

- Status awal `draft`.
- Sistem menghitung `subtotal`, `total_komisi`, dan `total`.
- Komisi belum masuk wallet saat status masih `draft`.

### `PUT /api/preorders/:id`

Dipakai untuk fitur edit PO.

Hanya PO dengan status `draft` yang bisa diubah.

Body sama seperti create PO:

```json
{
  "id_product": 1,
  "id_agent": 2,
  "qty": 3,
  "nama_customer": "Customer A",
  "email": "customer@example.com",
  "alamat": "Jl. Customer No. 1",
  "no_hp": "081234567890",
  "catatan": "Catatan tambahan"
}
```

### `DELETE /api/preorders/:id`

Dipakai untuk fitur hapus PO.

### `POST /api/preorders/:id/submit`

Dipakai untuk fitur submit PO ke sales.

Efek:

- Status berubah dari `draft` menjadi `in_review`.
- Membuat notifikasi untuk role `sales`.
- Mengirim realtime event ke endpoint SSE sales.
- Komisi belum masuk wallet saat status `in_review`.

### Status PO

Status yang tersedia:

- `draft`
- `in_review`
- `approve`
- `invalid`

Rule komisi:

- `draft`: belum masuk wallet agent.
- `in_review`: belum masuk wallet agent.
- `invalid`: tidak masuk wallet agent.
- `approve`: `total_komisi` masuk ke wallet agent.

## Sales

### `GET /api/sales/notifications/stream`

Dipakai untuk fitur realtime notification sales.

Auth: wajib login sebagai `sales`.

Endpoint ini memakai Server-Sent Events.

### `PUT /api/sales/preorders/:id/status`

Dipakai sales untuk approve atau invalid PO.

Auth: wajib login sebagai `sales`.

Approve:

```json
{
  "status": "approve"
}
```

Invalid:

```json
{
  "status": "invalid",
  "invalid_reason": "Data customer tidak valid"
}
```

Efek:

- Jika `approve`, komisi PO masuk ke wallet agent.
- Jika `invalid`, komisi tidak masuk wallet agent.

## Notifications

### `GET /api/notifications`

Dipakai untuk fitur list notifikasi user berdasarkan role login.

Auth: wajib login.

Filter status:

```http
GET /api/notifications?status=belum_terbaca
GET /api/notifications?status=terbaca
```

Status dihitung dari field `read_at`:

- `read_at = NULL`: `belum_terbaca`
- `read_at != NULL`: `terbaca`

### `GET /api/notifications/:id`

Dipakai untuk fitur detail notifikasi.

Auth: wajib login.

### `PUT /api/notifications/:id/read`

Dipakai untuk fitur tandai satu notifikasi sebagai terbaca.

Auth: wajib login.

### `PUT /api/notifications/read-all`

Dipakai untuk fitur tandai semua notifikasi role user login sebagai terbaca.

Auth: wajib login.

## Agent

### `GET /api/agent/wallet`

Dipakai untuk fitur melihat wallet agent.

Auth: wajib login sebagai `agent`.

Response wallet berisi:

- `total_commission`
- `available_balance`
- `pending_withdraw`
- `withdrawn_balance`

### `POST /api/agent/commissions`

Dipakai untuk fitur simulasi/hitung komisi product secara langsung.

Auth: wajib login sebagai `agent`.

Body:

```json
{
  "product_name": "Produk A",
  "product_price": 20000000,
  "discount_amount": 1000000
}
```

Rumus:

```text
final_price = product_price - discount_amount
commission_amount = final_price * AGENT_COMMISSION_PERCENT / 100
```

Efek:

- Komisi langsung masuk ke wallet agent.
- Tercatat di tabel `agent_commissions`.

### `POST /api/agent/withdraws`

Dipakai untuk fitur pengajuan withdraw agent.

Auth: wajib login sebagai `agent`.

Body:

```json
{
  "amount": 500000
}
```

Efek:

- Status withdraw awal `on_progress`.
- `available_balance` berkurang.
- `pending_withdraw` bertambah.

### `GET /api/agent/withdraws`

Dipakai untuk fitur list pengajuan withdraw milik agent yang login.

Auth: wajib login sebagai `agent`.

## Super Admin

### `GET /api/super-admin/dashboard`

Dipakai untuk fitur dashboard super admin sementara.

Auth: wajib login sebagai `super_admin`.

### `GET /api/super-admin/withdraws`

Dipakai untuk fitur list semua pengajuan withdraw.

Auth: wajib login sebagai `super_admin`.

Filter status:

```http
GET /api/super-admin/withdraws?status=on_progress
```

### `PUT /api/super-admin/withdraws/:id/approve`

Dipakai untuk fitur approve withdraw agent.

Auth: wajib login sebagai `super_admin`.

Efek:

- Status withdraw berubah menjadi `approval`.
- `pending_withdraw` berkurang.
- `withdrawn_balance` bertambah.

## Marketing AI Caching

### `GET /api/marketing/content-brief-cache`

Dipakai untuk mengambil data cached Content Brief 7 Hari dan Reference Insights.

Auth: wajib login (role `marketing` atau `super_admin`).

Query Parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ig_user_id` | string | ✅ | Instagram User ID |

Response (Cache Hit):
```json
{
  "cached": true,
  "data": {
    "id": 1,
    "ig_user_id": "17841466229554456",
    "ig_username": "gmtgroup.id",
    "content_brief": {
      "source": "alibaba",
      "summary": "...",
      "items": [ ... ]
    },
    "content_references": [ ... ],
    "generated_at": "2026-06-23T10:00:00Z",
    "expires_at": "2026-06-30T10:00:00Z"
  }
}
```

Response (Cache Miss/Expired):
```json
{
  "cached": false,
  "data": null
}
```

### `POST /api/marketing/content-brief-cache`

Dipakai untuk menyimpan atau memperbarui cached Content Brief 7 Hari dan Reference Insights.

Auth: wajib login (role `marketing` atau `super_admin`).

Body:
```json
{
  "ig_user_id": "17841466229554456",
  "ig_username": "gmtgroup.id",
  "content_brief": {
    "source": "alibaba",
    "summary": "...",
    "items": [ ... ]
  },
  "content_references": [ ... ]
}
```

Response:
```json
{
  "message": "Content brief cache saved",
  "data": {
    "id": 1,
    "ig_user_id": "17841466229554456",
    "ig_username": "gmtgroup.id",
    "generated_at": "2026-06-23T17:05:00Z",
    "expires_at": "2026-06-30T17:05:00Z"
  }
}
```

### `DELETE /api/marketing/content-brief-cache`

Dipakai untuk menghapus/force invalidate cache.

Auth: wajib login (role `marketing` atau `super_admin`).

Query Parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ig_user_id` | string | ✅ | Instagram User ID |

Response:
```json
{
  "message": "Content brief cache deleted"
}
```
