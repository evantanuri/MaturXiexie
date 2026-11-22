# Panduan Kolaborasi (CONTRIBUTING)

Aturan kerja bersama proyek **StepSafe (Kelompok StepSafe, K01)** untuk **Evan Nathanael Tanuri (TST)** dan **Satria Guna Darma (PWAM)**.

---

## 1. Pembagian Kepemilikan Area Kerja
Untuk mencegah konflik merge saat bekerja paralel:
- **Evan (`18224019`, TST):** bertanggung jawab atas `backend/` (termasuk `backend/openapi.yaml`), `gateway/`, `docker-compose.yml`, `.env.example`, `integration/`, serta dokumentasi backend (`README.pdf`).
- **Satria (`18224011`, PWAM):** bertanggung jawab atas `frontend/` (React Native Expo), unit test Jest, laporan testing, aset branding, dan build `Aplikasi_Release.apk`.
- **Bersama:** perubahan pada `PLAN.md`, kontrak API (`backend/openapi.yaml`), entri API Registry, dan kesepakatan integrasi lintas kelompok.

> Jika ingin mengubah kontrak endpoint (request/response/auth) setelah M13, wajib diskusikan terlebih dahulu sebelum merge ke `develop` agar kode backend dan mobile tidak putus.

---

## 2. Workflow Git & Branching
Penilaian individu mempertimbangkan riwayat kontribusi di GitHub, sehingga setiap anggota wajib melakukan commit dari akun GitHub masing-masing.

1. **Branch utama:**
   - `main` : kode stabil yang siap untuk demo dan penilaian akhir.
   - `develop` : branch integrasi harian.
2. **Branch fitur:** selalu buat branch baru dari `develop`:
   - Backend (TST): `feat/backend-core`, `feat/backend-auth`, `chore/stb-deploy`
   - Integrasi (TST): `feat/integration-service`
   - Mobile (PWAM): `feat/frontend-init`, `feat/frontend-screens`, `feat/frontend-api`
   - Dokumentasi: `docs/ddd-update`, `docs/readme`
3. **Alur kerja standar:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/nama-fitur
   # kerjakan di folder masing-masing
   git add <file-yang-relevan>
   git commit -m "feat(frontend): tambah layar form laporan"
   git push -u origin feat/nama-fitur
   ```
   Setelah dicek dan lulus verifikasi, gabungkan (*Pull Request* / merge) ke `develop`. Merge ke `main` hanya dilakukan ketika fitur sudah teruji end-to-end.

---

## 3. Konvensi Pesan Commit
Gunakan format ringkas dan deskriptif:
- `feat(backend): ...` atau `feat(frontend): ...` atau `feat(integration): ...`
- `fix(backend): ...` atau `fix(frontend): ...`
- `docs: ...`
- `test(backend): ...` atau `test(frontend): ...`
- `chore: ...`

---

## 4. Aturan Keamanan & Kebersihan Repositori
**Dilarang keras melakukan commit atas file berikut:**
- File environment rahasia: `.env`, `.env.local`, `.env.production` (hanya `.env.example` yang boleh masuk Git).
- Token Cloudflare Tunnel (`TUNNEL_TOKEN`), `JWT_SECRET`, `X-API-Key` produksi/mitra, dan API key layanan AI eksternal.
- Data lokal & artefak build sementara: `*.db`, `*.sqlite`, `data/`, `node_modules/`, `dist/`, `.expo/`, log terminal.
- Data pribadi asli pengguna (selalu gunakan data uji/dummy).

---

## 5. Quality Gate Sebelum Merge ke `main`
- **Backend (TST):** `npm run typecheck` dan `npm run build` lulus; `docker-compose.yml` menyertakan `mem_limit`, `cpus`, dan `restart: unless-stopped`; `gateway/nginx.conf` menerapkan rate limiting; endpoint publik `/api/health` dan `/docs` merespons normal.
- **Mobile (PWAM):** unit test Jest lulus; seluruh state (`loading`, `error`, `empty`, serta simulasi API kelompok mitra mati) tertangani tanpa crash; APK release menggunakan URL HTTPS produksi (`https://stepsafe.stei.fun/api`).
