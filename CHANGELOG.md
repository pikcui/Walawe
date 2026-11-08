# Changelog

## [3.0.0-alpha] - 2026-11-07
### Added
- **Cloud Deployment:** Fully deployed to Vercel, SnapDeploy, Neon, and Upstash.
- **RBAC (Role-Based Access Control):** JWT claims now include roles (admin/viewer). Admin endpoints are protected.
- **User Management:** Admins can create new users via the Dashboard.
- **Persistent Anomaly Detection:** Replaced in-memory maps with Redis for tracking spam and spending rates.
- **Accurate Cost Calculation:** Ledger usage aggregation now excludes active holds.

### Fixed
- **Redis Connection:** Fixed Upstash connection parsing by stripping quotes and using `redis.ParseURL`.
- **CI/CD:** Resolved `gitleaks` token requirement and branch protection bypass.

## [2.0.0-beta] - 2026-11-06
### Added
- **Base Sepolia Deployment:** Deployed `WalaweAccount.sol` to Testnet.
- **Smart Contract ECDSA:** Implemented real signature verification.
- **Dashboard Charts:** Recharts integration for spending trends.
- **Docker Secrets:** `.env` management.

## [v4 Alpha] - 2026-11-08
### Added
- **Zero Mock Policy Engine:** Policy Engine now reads rules dynamically from PostgreSQL and is fully fail-closed.
- **Web3 On-Chain Deposits:** Users can now top up their agent's balance using USDC on Base Sepolia via WalletConnect.
- **Bilingual Support:** Full English and Indonesian localization for the entire platform.
- **Professional Landing Page:** Replaced the initial design with a structured Bento-grid layout.

### Changed
- **UI/UX Overhaul:** Replaced mobile bottom navbar with a smooth slide-in hamburger menu.
- **Payment Flow:** Clarified Web3 Wallet connection as a payment method, not a secondary login.
- **Mobile Responsiveness:** Optimized dashboard cards and buttons for smaller screens.

### Fixed
- **Transaction Stuck State:** Resolved an issue where the "Check Wallet..." state persisted after a successful Web3 deposit.
- **Missing Modals:** Restored Add Funds and Add User modals that were accidentally removed during UI refactoring.
- **Go Version:** Hard-pinned backend `go.mod` to 1.23.0 to ensure Docker CI compatibility.

## [v4.1.0] - 2026-11-08
### Added
- **Agent Playground:** Interactive UI to test AI agents using BYOK.
- **New Providers:** Direct support for Google Gemini and Groq.
- **Modern Dashboard:** Replaced rigid cards with a seamless layout and Area Charts.
- **API Key Management:** UI to generate, list, and revoke API keys.

### Fixed
- **Create User Logic:** Fixed hardcoded `agent_id` in Add User feature.
- **Layout Overflow:** Fixed chart clipping on the left side and locked Playground scrolling.
- **Currency Formatting:** Improved display of Micro-USD balances (2-4 decimals).
- **Redis Connectivity:** Added robust error handling for Redis connections.
