# Implementation Plan: StepSafe — Kelompok MaturXiexie (TST × PWAM · Tema 1)

## Ringkasan Proyek
- **Nama Aplikasi:** StepSafe (`https://stepsafe.stei.fun`)
- **Nama Kelompok:** MaturXiexie (Kelas K01)
- **Repositori GitHub:** `https://github.com/evantanuri/MaturXiexie.git`
- **Anggota A (TST — Backend & Bisnis):** Evan Nathanael Tanuri (`18224019`)
- **Anggota B (PWAM — Mobile Developer):** Satria Guna Darma (`18224011`)
- **Tema:** Tema 1 — Smart City & Mobility (*Walkability & Aksesibilitas Pejalan Kaki*, adaptasi *JalanKami*)

## Stack Teknologi
- **Backend Core Service (STB):** Node.js (Express + TypeScript) + SQLite (`node:sqlite`), autentikasi ganda **Bearer JWT** + **`X-API-Key`**, dokumentasi Swagger UI (`/docs`) dari `docs/openapi.yaml`.
- **Gateway & Tunnel (STB):** Nginx (`limit_req_zone` rate limiting) + Cloudflare Tunnel (`k01-stepsafe` → `https://stepsafe.stei.fun`).
- **Frontend Mobile (PWAM):** React Native (Expo) + TypeScript (`frontend/`).
- **Layanan Integrasi (Tugas 3 · Di Luar STB):** Node.js/TypeScript terpisah di laptop/VM (`integration/`) yang menggabungkan API StepSafe + API Publik (`Open-Meteo`, `Overpass OSM`, `OSRM`, opsional API AI eksternal) + minimal 2 API kelompok lain dengan timeout & cache fallback.

## Penyesuaian Aturan STB
1. **Tidak ada model AI lokal di STB:** Fitur analisis gambar/ringkasan naratif AI (opsional) hanya memanggil API AI eksternal dari layanan di luar STB dengan API key di `.env`.
2. **Resource Limit:** Setiap kontainer di `backend/docker-compose.yml` diberi `mem_limit`, `cpus`, dan `restart: unless-stopped`.
3. **API Publik Gratis:** Menggunakan Overpass OSM, OSRM (`foot`), dan Open-Meteo.

## Timeline & Milestone
| Minggu | Target | Anggota A (TST) | Anggota B (PWAM) |
| :--- | :--- | :--- | :--- |
| **M13** *(16–22 Nov)* | Makalah DDD + Kontrak API | Finalisasi Tugas 1 DDD (Google Docs + Gambar 1 & 2) & `openapi.yaml` | User story, kerangka app React Native TypeScript + navigasi |
| **M14** *(23–29 Nov)* | URL STB + API Registry | Selesaikan Node.js core service, Docker di STB, Cloudflare Tunnel, entri API Registry K01 | Layar utama, login JWT, integrasi API StepSafe |
| **M15** *(30 Nov–6 Des)* | Integrasi Lintas Kelompok | Bangun `integration/` (≥ 2 kelompok lain + resilience cache/timeout) | Integrasi API mitra, penanganan loading/error/offline, Jest test |
| **M16** *(7–13 Des)* | Final Edunex *(13 Des 23.59 WIB)* | Finalisasi `README.pdf`, `README.txt`, video YouTube (A+B) | Build `Aplikasi_Release.apk`, laporan testing `.pdf`, video YouTube (A+B) |
