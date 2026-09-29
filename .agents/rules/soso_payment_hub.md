# 🏦 Aturan Khusus Workspace: SOSO Payment Hub

Ketika bekerja di dalam proyek Payment SOSO Creative Hub, agen WAJIB mematuhi aturan arsitektur berikut tanpa pengecualian:

### 1. Integrasi Mayar.id API V2
- **Wajib menggunakan API V2** (prefix `/hl/v2/`). Jangan gunakan API V1 yang sudah deprecated (seperti `/invoice/create`).
- **Endpoint Pembuatan Tagihan:** Gunakan `POST /invoices` (bukan `/invoices/create`).
- Error handling dari Mayar API harus selalu me-retry 3x dengan *exponential backoff* hanya untuk error server (5xx) atau timeout, jangan retry untuk error client (4xx).
- Endpoint untuk request transactions/statistics harus menggunakan strict interface return types (jangan biarkan `unknown`).

### 2. Prinsip Source of Truth (Webhook)
- Webhook `payment.received` atau `transaction.paid` dari Mayar.id adalah **SATU-SATUNYA** source of truth untuk status pembayaran.
- DILARANG KERAS mengupdate status billing menjadi "paid" secara langsung melalui redirect URL sukses di frontend klien.
- Payload Webhook hanya disimpan secukupnya di `webhook_logs` tanpa mencatat data PII yang tidak perlu ke raw log.

### 3. Keamanan & Autentikasi
- **Portal Klien:** Semua link akses ke portal klien (`/portal/[clientId]`) wajib disematkan parameter JWT token (`?token=xxx`) yang ditandatangani dan berlaku 24 jam.
- DILARANG menggunakan URL ajaib tanpa signature karena berisiko mengekspos histori tagihan klien jika link tersebar.
- Admin portal selalu menggunakan Firebase Auth. Akses backend API harus diverifikasi melalui middleware atau utility Firebase Admin verify token.

### 4. Database (Firebase Firestore)
- Struktur data utama ada di collections: `clients`, `billings`, `payments`, `tax_allocations`, dan `webhook_logs`.
- Saat pembayaran lunas, alokasi pajak harus langsung dikalkulasi dan dicatat secara terpisah di `tax_allocations`.
