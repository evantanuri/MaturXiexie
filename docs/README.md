# StepSafe — Backend Microservice (Kelompok MaturXiexie · K01)

**Base URL Publik:** `https://stepsafe.stei.fun/api`  
**Dokumentasi Interaktif (Swagger UI):** `https://stepsafe.stei.fun/docs`  
**Tema:** Smart City & Mobility (Walkability & Aksesibilitas Pejalan Kaki)

## 1. Arsitektur Singkat
Microservice StepSafe berjalan di Set-Top Box (STB) menggunakan Docker Compose dengan tiga kontainer terisolasi (`mem_limit` dan `cpus` terkonfigurasi):
1. **`tunnel` (`cloudflare/cloudflared`)**: Mengekspos layanan secara aman melalui HTTPS tanpa membuka port publik STB.
2. **`gateway` (`nginx:1.28-alpine`)**: *Reverse proxy* dan *rate limiter* (`10 req/s` per IP dengan *burst* 20) sebelum meneruskan traffic ke layanan inti.
3. **`core-service` (`Node.js Express + TypeScript + SQLite`)**: Menangani pelaporan kondisi trotoar, verifikasi komunitas, reputasi pelapor, perhitungan *Walkability Score*, *Area Summarizer*, daftar pantauan, serta autentikasi ganda (**JWT** & **`X-API-Key`**).

## 2. Cara Mendapatkan Akses (Untuk Kelompok Mitra & Pengujian)
- **Kelompok Mitra (Server-to-Server):** Ajukan permintaan API Key ke Kelompok MaturXiexie (Evan / Satria). Sertakan header berikut pada request ke `/api/walkability/score`, `/api/areas/summary`, atau `/api/reports`:
  ```text
  X-API-Key: <api-key-kelompok-anda>
  ```
- **Akun Demo Pengguna Mobile (JWT):**
  - Email: `demo@stepsafe.id`
  - Password: `demo12345`

## 3. Daftar Endpoint Utama
| Method | Endpoint | Auth | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Publik | Cek status layanan dan koneksi database |
| `POST` | `/api/auth/register` | Publik | Registrasi pengguna baru |
| `POST` | `/api/auth/login` | Publik | Login dan mendapatkan JWT `access_token` |
| `GET` | `/api/auth/me` | `Bearer JWT` | Profil pengguna dan skor reputasi |
| `GET` | `/api/reports` | Publik | Daftar laporan trotoar aktif (filter `lat`, `lon`, `radius_m`, `category`, `status`) |
| `POST` | `/api/reports` | `Bearer JWT` | Kirim laporan kondisi trotoar baru |
| `POST` | `/api/reports/{id}/verify` | `Bearer JWT` | Konfirmasi (`confirm`) atau tandai selesai (`resolve`) laporan |
| `GET` | `/api/walkability/score` | `JWT` / `X-API-Key` | Hitung *Walkability Score* (0–100) pada titik & radius |
| `GET` | `/api/areas/summary` | `JWT` / `X-API-Key` | Ringkasan statistik masalah trotoar pada area terpilih |
| `GET/POST/DELETE` | `/api/watchlists` | `Bearer JWT` | Kelola koridor pantauan favorit pengguna |

## 4. Contoh Request (`curl`)
```bash
# 1. Health check
curl -i https://stepsafe.stei.fun/api/health

# 2. Login akun demo
curl -s -X POST https://stepsafe.stei.fun/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@stepsafe.id","password":"demo12345"}'

# 3. Ambil Walkability Score sebagai kelompok mitra (X-API-Key)
curl -s "https://stepsafe.stei.fun/api/walkability/score?lat=-6.89148&lon=107.61066&radius_m=500" \
  -H "X-API-Key: <API_KEY>"
```
