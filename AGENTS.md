# AGENTS.md

Panduan konteks dan batasan teknis untuk setiap AI coding agent yang membantu pengerjaan di repositori **MaturXiexie (StepSafe)**.

---

## 1. Konteks Proyek & Fase Saat Ini
- **Proyek:** **StepSafe**, aplikasi intelijen *walkability* dan aksesibilitas pejalan kaki perkotaan (Tema 1: Smart City & Mobility) untuk Tugas Besar gabungan **II3160 (TST)** dan **II3140 (PWAM)** di STEI ITB (Kelas K01).
- **Fase saat ini:** **Planning**. Belum ada kode implementasi di repositori ini. Jangan membuat boilerplate, menginisialisasi proyek, atau men-deploy layanan sebelum pengguna secara eksplisit meminta masuk ke tahap implementasi.
- **Rujukan utama:** baca [`PLAN.md`](PLAN.md) untuk arsitektur, desain DDD, kontrak API, dan jadwal; baca [`CONTRIBUTING.md`](CONTRIBUTING.md) untuk batas peran TST vs PWAM.

---

## 2. Pembagian Peran (Wajib Dihormati)
- **Anggota A (Evan, `18224019`, TST):** `backend/` (core microservice + STB Docker + Nginx + Cloudflare Tunnel), `integration/` (layanan integrasi Tugas 3), dan dokumen backend (`docs/`).
- **Anggota B (Satria, `18224011`, PWAM):** `frontend/` (aplikasi React Native Expo TypeScript, Jest test, branding, EAS `Aplikasi_Release.apk`).

Saat membantu salah satu anggota, **jangan** memodifikasi folder milik anggota lainnya atau mengubah kontrak API secara sepihak tanpa konfirmasi pengguna.

---

## 3. Hard Constraints (Aturan Tugas Besar & STB)
Setiap rancangan maupun kode yang nanti dibuat harus mematuhi batasan berikut:

1. **Batasan Hardware & Aturan STB (`aml-s9xx-box`, `linux/arm64`):**
   - RAM STB sekitar `2 GB`; partisi `/` tersisa sekitar `505 MB`, sedangkan `/www` tersisa sekitar `7.8 GB`. Lokasi deploy di STB wajib di `/www/stepsafe`, bukan `/root` atau `/home`.
   - STB **hanya** boleh menjalankan container microservice inti (`core-service`, `gateway` Nginx, `tunnel` Cloudflared, serta database lokal jika terpisah).
   - **Dilarang** menjalankan frontend, build aplikasi mobile/EAS, layanan integrasi Tugas 3, atau model AI lokal di STB.
   - Setiap service di `docker-compose.yml` **wajib** memiliki `mem_limit`, `cpus`, dan `restart: unless-stopped`.
   - **Dilarang** membuka port database langsung ke internet.
   - Nginx `gateway` **wajib** menerapkan rate limiting (`limit_req_zone`).
2. **Keamanan & Rahasia:**
   - **Dilarang** menulis hardcode secret (`TUNNEL_TOKEN`, `JWT_SECRET`, API key mitra, API key AI) di kode atau men-commit `.env` dan `*.db`. Gunakan `.env.example` sebagai template.
   - Jangan gunakan data pribadi pengguna asli; gunakan data uji/demo.
3. **Aturan API & Integrasi:**
   - Autentikasi ganda: `Authorization: Bearer <JWT>` untuk pengguna mobile dan header `X-API-Key` untuk kelompok mitra (komponen bonus +10% TST).
   - Layanan integrasi (Tugas 3) dan aplikasi mobile wajib memanggil minimal 2 API kelompok lain + API publik, dan **wajib tahan gangguan** (timeout singkat, cache fallback, pesan error jelas, tidak boleh crash saat API mitra mati).
4. **Aturan PWAM (`frontend/`):**
   - Wajib memakai **React Native (Expo)**, minimal 4 layar dengan navigasi (stack + tab), form dengan validasi, unit test **Jest**, dan **EAS Build** (`Aplikasi_Release.apk`) mengarah ke URL `https://stepsafe.stei.fun/api`.

---

## 4. Standar Kerja Agent
- **Jujur & terverifikasi:** hanya laporkan hasil build, test, path file, dan perilaku kode yang benar-benar diamati di sesi berjalan.
- **Jangan menduplikasi logika atau dokumentasi:** jaga kontrak API (`openapi.yaml`) sebagai satu sumber kebenaran saat fase implementasi dimulai.
- **Penulisan dokumentasi & UI:** tulis teks yang ringkas, langsung ke inti, tanpa kalimat filler dan tanpa karakter em-dash (U+2014).
