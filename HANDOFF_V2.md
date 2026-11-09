# PROJECT HANDOFF: WALAWE (AI Agent Wallet & Gateway)

Halo, kamu adalah Senior Software Engineer yang akan melanjutkan proyek open-source **Walawe**. Proyek ini adalah infrastruktur wallet & API gateway untuk AI Agent. Saat ini kita sudah live di Cloud (v4 Alpha) dan sedang memasuki tahap penyempurnaan.

Bacalah konteks, aturan, dan batasan di bawah ini dengan sangat teliti sebelum menulis kode.

## 1. TECH STACK & CLOUD ARCHITECTURE
- **Backend:** Go 1.23.0 (Hosted on Hostless.app via Docker)
- **Frontend:** Next.js 16 (Hosted on Vercel)
- **Database:** Neon (PostgreSQL)
- **Cache:** Upstash (Redis)
- **Blockchain:** Base Sepolia (Smart Contract ERC-4337)
- **UI/UX:** Tailwind CSS (Monochrome Theme, No AI Slop, Seamless Layout)

## 2. ATURAN MUTLAK (HARD PROHIBITIONS)
- **UANG DILARANG PAKAI FLOAT:** Gunakan `int64` / `MicroUSD` (1 USD = 1.000.000). Dilarang pakai `float`/`double`.
- **JANGAN UBAH LANGSUNG SALDO:** Saldo dihitung dari entri `ledger` (double-entry). Jangan pernah melakukan `UPDATE accounts SET balance = ...`.
- **JANGAN UBAH FILE SENSITIF:** `packages/ledger`, `packages/policy-engine`, `packages/contracts` tanpa diskusi ketat.
- **JANGAN PUSH KE `main`:** Selalu buat branch baru (`feat/...` atau `fix/...`), push, dan buat Pull Request (PR) di GitHub.
- **JANGAN COMMIT SECRET:** Jangan pernah menaruh API Key atau password di kode.
- **JANGAN HAPUS BRANDING:** Nama "by Galang", Link GitHub (pikcui/Walawe), dan Telegram Support harus tetap ada.

## 3. BATASAN ENVIRONMENT (SANGAT PENTING)
Saya (user) mengembangkan ini **100% dari HP Android menggunakan Termux**. Sesuaikan instruksimu:
- **No Docker Lokal:** Jangan menyuruh saya `docker build/up`. Testing Docker dilakukan di GitHub Actions (CI).
- **Go Version:** Termux punya Go versi bleeding-edge. Jangan biarkan `go.mod` berubah dari **1.23.0**. Selalu jalankan `sed -i 's/go 1\..*/go 1.23.0/g'` setelah `go mod tidy`.
- **Foundry:** Tidak bisa jalan native di Termux. Gunakan `proot-distro login ubuntu` untuk perintah Solidity.
- **Cara Edit File:** Termux sering gagal saat copy-paste kode panjang. **Selalu berikan kode secara utuh (timpa file)** atau gunakan perintah `sed -i`, jangan menyuruh saya mencari baris tertentu.

## 4. SKEMA DATABASE AKTUAL (Neon)
- **Hierarki:** `organizations` -> `agents` -> `users`.
- **Tabel `agents`:** `id` (UUID), `organization_id` (UUID), `name`, `status`, `webhook_url`.
- **Tabel `policies`:** `id` (UUID), `agent_id`, `rule_json` (JSONB). (Default policy: allowed_models, max_per_tx, daily_limit).
- **Tabel `api_keys`:** `key_hash` bertipe **TEXT** (hex SHA-256), bukan BYTEA.
- **Tabel `users`:** `id`, `email`, `password_hash`, `role`, `agent_id` (FK ke agents).
- **Tabel `accounts`:** `id` (TEXT), `balance` (BIGINT). ID Account = `agent_id` (untuk kredit) dan `hold_agent_id` (untuk hold).
- **Tabel `entries`:** Mencatat debit/credit. Saldo diturunkan dari tabel ini.

## 5. STATUS PROYEK SAAT INI (v4 Alpha Selesai)
- **Fase 1-3 (SELESAI):** Registrasi (Email, Org, Agent, API Key), Auth JWT, Ledger Ganda, Policy Engine (Fail-Closed), Manajemen API Key.
- **Fase 4 (SELESAI):** Web3 Deposit (USDC via WalletConnect), Agent Playground (BYOK: Gemini, Groq, OpenAI, Anthropic), UI Modern (Area Chart, Topbar Locked, Hamburger Menu), Full English.
- **Technical Debt (Perlu Diperbaiki):**
  1. **Redis Connection:** `REDIS_URL` di Hostless masih error `connection refused`. Perlu dipastikan format `rediss://` dari Upstash terpasang benar.
  2. **Grafik:** Garis fokus (kotak putih) pada Recharts sudah dihilangkan via CSS global, tapi perlu dipastikan stabil.
  3. **JWT_SECRET:** Masih ada fallback `"super_secret_dev_key"`. Harusnya crash jika tidak diset.

## 6. ROADMAP SELANJUTNYA (Fase 5)
1. **True On-Chain Settlement:** Integrasi Bundler (ERC-4337) & Paymaster agar AI bisa bayar transaksi langsung dari Smart Wallet.
2. **Session Keys:** UI untuk membuat "Kunci Sesi" (batas waktu & nominal) agar AI bisa transaksi on-chain otonom.
3. **Mainnet Deployment:** Migrasi Smart Contract ke Base Mainnet.
4. **Fiat On-Ramp:** Integrasi Stripe untuk top-up saldo.

## 7. PROMPT UNTUK AI BARU (COPY-PASTE INI KE CHAT AI BARU)

"Baca file `HANDOFF_V2.md` di repositori ini (atau teks di atas). Kamu adalah Senior Go & Next.js Developer yang akan melanjutkan proyek Walawe. Patuhi aturan mutlak: Dilarang pakai float untuk uang (harus int64 MicroUSD), dilarang update saldo langsung (harus via ledger), Go version wajib 1.23.0, dan jangan hapus branding 'by Galang'. Saya menggunakan Termux, jadi selalu berikan kode secara utuh (timpa file) atau perintah `sed -i`, jangan menyuruh saya edit manual atau pakai Docker lokal. Tugas pertama kita: Perbaiki koneksi Redis di Hostless dan pastikan semua environment variable (JWT_SECRET, DATABASE_URL, REDIS_URL) terbaca sempurna. Setelah itu, kita akan mulai merancang arsitektur 'Session Keys' untuk On-Chain Settlement. Konfirmasi pemahamanmu dan tunggu instruksi saya."
