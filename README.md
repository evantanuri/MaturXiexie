# StepSafe — Kelompok MaturXiexie (TST × PWAM · K01)

Sistem intelijen *walkability* dan aksesibilitas pejalan kaki perkotaan (**Tema 1: Smart City & Mobility**) untuk Tugas Besar **II3160 Teknologi Sistem Terintegrasi** & **II3140 Pengembangan Aplikasi Web & Mobile**.

## Anggota Kelompok
- **Evan Nathanael Tanuri (`18224019`)** — TST (Backend Node.js TypeScript, DDD, Docker STB, Layanan Integrasi)
- **Satria Guna Darma (`18224011`)** — PWAM (Frontend Mobile React Native TypeScript, Testing, APK Release)

## Struktur Repositori
- [`docs/`](docs/) — Rencana implementasi, naskah & diagram DDD (Tugas 1), kontrak API [`openapi.yaml`](docs/openapi.yaml), dan dokumentasi backend.
- [`backend/`](backend/) — Core microservice (**Node.js + Express + TypeScript + SQLite**), gateway Nginx (rate limit), dan `docker-compose.yml` untuk deployment di Set-Top Box (STB) via Cloudflare Tunnel (`https://stepsafe.stei.fun`).
- [`frontend/`](frontend/) — Aplikasi mobile **React Native (Expo) + TypeScript** *(dikerjakan pada modul PWAM)*.
- [`integration/`](integration/) — Layanan integrasi lintas ≥ 2 kelompok mitra & API publik (Tugas 3, berjalan di luar STB).

## Menjalankan Backend Secara Lokal
```bash
cd backend/core-service
npm install
npm test
npm run dev
```
Swagger UI tersedia di `http://localhost:8000/docs` (atau `http://localhost:8080/docs` via Docker gateway).
