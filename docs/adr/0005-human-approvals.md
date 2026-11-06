# 0005. Human Approvals for High-Value Requests

- Status: Accepted
- Date: 2026-11-06

## Context
AI agents can act autonomously, but they can also make mistakes or be hijacked. For high-value requests, a human must be able to review and approve the spend before it happens.

## Decision
1. We will add an `ApprovalThreshold` to the agent's Policy.
2. If the estimated cost of a request exceeds this threshold, the Policy Engine will return `require_approval`.
3. The Gateway will not place a hold on the funds yet. Instead, it will return a `402 Payment Required` with a specific header (`X-REQUIRE-APPROVAL: true`), instructing the agent to wait.
4. An Admin API endpoint `/admin/approvals` will be created to list pending approvals.
5. When a human approves via the Dashboard, the system will allow the request to proceed (or inform the agent to retry).

## Consequences
- We need a new database table `approval_requests` to store pending requests.
- The Gateway must handle this new state.
- The Dashboard needs a UI to approve/reject requests.
