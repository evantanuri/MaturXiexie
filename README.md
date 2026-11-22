# StepSafe (Kelompok MaturXiexie, Kelas K01)

**StepSafe** adalah sistem intelijen *walkability* dan aksesibilitas pejalan kaki perkotaan (Tema 1: Smart City & Mobility, adaptasi konsep *JalanKami*) untuk Tugas Besar gabungan mata kuliah **II3160 Teknologi Sistem Terintegrasi (TST)** dan **II3140 Pengembangan Aplikasi Web & Mobile (PWAM)** di STEI ITB.

> **Status saat ini:** Backend core microservice (Tugas 2) beserta PostgreSQL 16, Nginx rate limiting, dan Docker Compose sudah terimplementasi di branch `develop` dan siap di-deploy ke STB. Pengembangan `frontend/` (PWAM) dan `integration/` (Tugas 3) berjalan paralel mengacu pada [`backend/openapi.yaml`](backend/openapi.yaml).

## Ringkasan Sistem
StepSafe memadukan laporan kondisi trotoar berbasis komunitas dengan data lingkungan terkini untuk membantu pejalan kaki dan penyandang disabilitas menilai kelayakan jalur jalan kaki:
1. **Pelaporan & Validasi Komunitas:** warga melaporkan hambatan trotoar (`lat`, `lng`, kategori, tingkat keparahan `1-5`, penanda hambatan disabilitas), lalu komunitas melakukan validasi silang (`confirm` / `reject` / `resolve`) yang memperbarui reputasi pelapor dan menerapkan masa berlaku otomatis (TTL 7 hari).
2. **Walkability Index & Area Insight:** kalkulasi skor kelayakan jalan kaki (`0-100`) dengan penalti 1.5x untuk hambatan disabilitas serta integrasi cuaca dan kualitas udara dari Open-Meteo (via *Anti-Corruption Layer* dengan cache 15 menit dan fallback aman).
3. **Integrasi Lintas Kelompok:** menyediakan REST API berautentikasi `X-API-Key` untuk kelompok mitra dan mengonsumsi minimal 2 layanan kelompok lain di lapisan integrasi (Tugas 3).

- **Target URL Produksi (STB):** `https://stepsafe.stei.fun`
- **Base API:** `https://stepsafe.stei.fun/api`
- **Swagger UI:** `https://stepsafe.stei.fun/docs`
- **Repositori GitHub:** `https://github.com/evantanuri/MaturXiexie.git`

## Anggota Kelompok & Pembagian Peran
| Anggota | NIM | Peran | Tanggung Jawab Utama |
| :--- | :--- | :--- | :--- |
| **Evan Nathanael Tanuri** | `18224019` | **TST (Anggota A)** | Perancangan DDD (Tugas 1), `backend/`, `gateway/`, `docker-compose.yml` di STB via Cloudflare Tunnel (Tugas 2), `integration/` lintas kelompok (Tugas 3). |
| **Satria Guna Darma** | `18224011` | **PWAM (Anggota B)** | Aplikasi mobile `frontend/` React Native (Expo) + TypeScript, konsumsi API sendiri dan >= 2 kelompok lain, unit testing (Jest), branding, dan build `Aplikasi_Release.apk`. |

## Menjalankan Backend dengan Docker (Lokal)
```bash
cp .env.example .env
docker compose up -d --build db core-service gateway
```
Setelah berjalan, buka:
- Swagger UI: `http://localhost:8080/docs` (atau `http://localhost:8080/`)
- Health check: `http://localhost:8080/api/health`

## Deploy di STB (`/www/stepsafe`)
```bash
git clone -b develop https://github.com/evantanuri/MaturXiexie.git /www/stepsafe
cd /www/stepsafe
cp .env.example .env
# Edit .env: isi JWT_SECRET acak, password PostgreSQL, dan TUNNEL_TOKEN dari Cloudflare
docker compose up -d --build
docker compose logs tunnel | tail -5
```

## Cara Mendapatkan Akses & Akun Uji
- **Pengguna Mobile (`Bearer JWT`):** login ke `POST /api/auth/login` menggunakan akun demo seeded: `demo@stepsafe.test` / `demo123`.
- **Kelompok Mitra (`X-API-Key`):** gunakan header `X-API-Key`. Untuk pengujian awal tersedia kunci demo `stepsafe_key_mitra_health_2026` (untuk kunci produksi khusus kelompokmu, hubungi Anggota A melalui GitHub Issue atau kontak di API Registry kelas K01).

## Contoh Request
```bash
# Cek status layanan
curl https://stepsafe.stei.fun/api/health

# Ambil Walkability Index sebagai kelompok mitra (X-API-Key)
curl "https://stepsafe.stei.fun/api/walkability?lat=-6.8915&lng=107.6107&radius=500" \
  -H "X-API-Key: stepsafe_key_mitra_health_2026"
```

## Dokumen di Repositori Ini
- [`backend/openapi.yaml`](backend/openapi.yaml) : Kontrak API resmi OpenAPI 3.0.3 (sumber Swagger UI `/docs`).
- [`PLAN.md`](PLAN.md) : Arsitektur target, ringkasan DDD, kontrak API, batasan STB, timeline Minggu 13 sampai 16, dan checklist deliverable.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) : Aturan kolaborasi berdua, workflow Git (`main` / `develop` / feature branch), batas kepemilikan modul, dan aturan keamanan.
- [`AGENTS.md`](AGENTS.md) : Konteks proyek dan batasan teknis bagi AI coding agent agar pengembangan TST dan PWAM tetap sinkron.
