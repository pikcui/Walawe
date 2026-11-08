# Security Policy

Walawe is a financial infrastructure project. We take security very seriously.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| v4.x    | :white_check_mark: |
| < v4.0  | :x:                |

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Instead, please report them via email to `security@walawe.io` (placeholder).

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information:
* Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting)
* Full paths of source file(s) related to the manifestation of the issue
* The location of the affected source code (tag/branch/commit or direct URL)
* Any special configuration required to reproduce the issue
* Step-by-step instructions to reproduce the issue
* Proof-of-concept or exploit code (if possible)
* Impact of the issue, including how an attacker might exploit the issue

## Security Best Practices (For Contributors)

* Never commit secrets (API keys, private keys, JWT secrets).
* Use integer math for money (micro-USD). Never use float or double.
* Never modify balances directly. Always use the Ledger.
* Always enforce the Policy Engine. Do not bypass it.
