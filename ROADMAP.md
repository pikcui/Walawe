# Walawe Roadmap

## ✅ Completed (v4 Alpha)
*   **Core:** Double-Entry Ledger, Deterministic Policy Engine (Fail-Closed), BYOK (OpenAI, Anthropic, Gemini, Groq).
*   **Auth:** JWT-based Login, Admin/Viewer RBAC, API Key Management (Rotate/Revoke).
*   **UI/UX:** Modern Seamless Dashboard, Agent Playground, Area Charts, Mobile-responsive Slide-in Menu, Bilingual (EN/ID).
*   **Web3:** On-Chain USDC Deposits via WalletConnect (Base Sepolia).

## 🚧 In Progress (v4 Beta) - Technical Debt & Fixes
*   **Redis Integration:** Memperbaiki koneksi `REDIS_URL` di Hostless agar fitur *Rate Limiting* dan *Anomaly Detection* berjalan penuh.
*   **UI/UX Polish:** Memperbaiki format angka (Micro-USD) pada grafik dan saldo agar lebih rapi (2 desimal).
*   **Security:** Menghapus *fallback* `JWT_SECRET` dan membatasi CORS hanya ke domain Vercel.

## 🔮 Future (v5+)
*   **True On-chain Settlement:** Menggunakan ERC-4337 Bundler & Paymaster agar AI bisa membayar transaksi langsung dari *Smart Wallet*.
*   **Session Keys:** Implementasi UI untuk membuat *Session Key* (kunci sementara) agar AI bisa bertransaksi on-chain secara otonom dengan batas aman.
*   **Mainnet Deployment:** Migrasi Smart Contract ke Base Mainnet.
*   **Fiat On-Ramp:** Integrasi Stripe untuk top-up saldo menggunakan kartu kredit.
