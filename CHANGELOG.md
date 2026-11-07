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
