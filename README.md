# StepSafe (Kelompok MaturXiexie, Kelas K01)

**StepSafe** adalah sistem intelijen *walkability* dan aksesibilitas pejalan kaki perkotaan (Tema 1: Smart City & Mobility, adaptasi konsep *JalanKami*) untuk Tugas Besar gabungan mata kuliah **II3160 Teknologi Sistem Terintegrasi (TST)** dan **II3140 Pengembangan Aplikasi Web & Mobile (PWAM)**.

> **Status saat ini:** Tahap *planning* dan penyelarasan konteks proyek. Belum ada kode implementasi di repositori ini sampai perencanaan disepakati bersama.

## Ringkasan Aplikasi
Banyak ruas trotoar di kota besar mengalami kerusakan permukaan, terhalang parkir liar atau pedagang, kurang penerangan, atau belum ramah disabilitas (*ramp* dan *tactile paving*). StepSafe menggabungkan:
1. **Laporan & Verifikasi Komunitas:** warga melaporkan kondisi trotoar (beserta koordinat dan tingkat keparahan), lalu komunitas melakukan verifikasi silang.
2. **Walkability Score & Rute Aman:** perhitungan kelayakan jalan kaki suatu titik/koridor berbasis laporan aktif, atribut jalur pejalan kaki terbuka (OpenStreetMap / OSRM), dan kondisi cuaca (Open-Meteo).
3. **Area Summarizer & Integrasi Lintas Kelompok:** ringkasan kondisi pejalan kaki pada radius tertentu yang terhubung dengan minimal dua layanan API kelompok lain.

- **Target URL Produksi (STB):** `https://stepsafe.stei.fun`
- **Repositori GitHub:** `https://github.com/evantanuri/MaturXiexie.git`

## Anggota Kelompok & Pembagian Peran
| Anggota | NIM | Peran | Tanggung Jawab Utama |
| :--- | :--- | :--- | :--- |
| **Evan Nathanael Tanuri** | `18224019` | **TST (Anggota A)** | Perancangan DDD (Tugas 1), Core Microservice + Auth + Docker STB via Cloudflare Tunnel (Tugas 2), Layanan Integrasi lintas kelompok (Tugas 3). |
| **Satria Guna Darma** | `18224011` | **PWAM (Anggota B)** | Aplikasi mobile React Native (Expo) + TypeScript, konsumsi API sendiri dan minimal 2 kelompok lain, unit testing (Jest), branding, dan build `Aplikasi_Release.apk`. |

## Dokumen di Repositori Ini
- [`PLAN.md`](PLAN.md) : Arsitektur target, ringkasan DDD, rencana kontrak API, batasan STB, timeline Minggu 13 sampai 16, dan checklist deliverable.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) : Aturan kolaborasi berdua, workflow Git (`main` / `develop` / feature branch), batas kepemilikan modul, dan aturan keamanan.
- [`AGENTS.md`](AGENTS.md) : Konteks proyek dan batasan teknis bagi AI coding agent agar pengembangan TST dan PWAM tetap sinkron.
