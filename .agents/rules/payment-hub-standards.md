# 🛡️ Standar Implementasi Payment Hub

Aturan (Rules) ini WAJIB diikuti oleh AI setiap kali melakukan modifikasi atau penambahan kode pada project **Payment SOSO Creative Hub**.

## 1. Standar Keamanan Webhook (Security Rule)
Setiap pembuatan atau modifikasi endpoint webhook pihak ketiga (terutama integrasi payment gateway seperti Mayar.id):
- **Wajib** memvalidasi *HMAC signature* menggunakan `crypto.timingSafeEqual()`.
- **Dilarang keras** menggunakan perbandingan string biasa (`===` atau `==`) untuk memvalidasi signature karena rentan terhadap serangan *timing attack*.

## 2. Standar Pemanggilan API Eksternal (Reliability Rule)
Setiap membuat *API Client* atau melakukan HTTP fetch ke layanan eksternal pihak ketiga (misal: Mayar.id, Resend):
- **Wajib menggunakan Timeout:** Implementasikan `AbortController` (misal 30 detik timeout) agar request tidak pernah *hanging* selamanya jika provider sedang *down*.
- **Wajib menggunakan Retry Mechanism:** Terapkan *exponential backoff retry* (misal max 3 percobaan) secara spesifik untuk mengatasi error server (HTTP 5xx) atau kegagalan jaringan (network error / fetch failed).

## 3. Standar Audit Trail (Audit Rule)
Setiap endpoint API internal yang melakukan operasi penulisan data (CREATE, UPDATE, CANCEL, DELETE) pada *resource* penting seperti Billing, Client, Catalog, dan Settings:
- **Dilarang keras** men-*hardcode* email admin (misal `admin@sosocreativehub.com`) ke dalam payload `logAdminAction`.
- **Wajib** mengambil email dari identitas JWT admin yang telah divalidasi (`auth.email` atau sejenisnya) agar setiap perubahan data memiliki akuntabilitas yang jelas dan sesuai dengan admin yang sedang beroperasi.
