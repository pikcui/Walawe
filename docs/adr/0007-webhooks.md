# 0007. Webhooks for Asynchronous Approvals

- Status: Accepted
- Date: 2026-11-06

## Context
When an agent request requires human approval, the agent is blocked. Polling the Gateway for status updates is inefficient. The Gateway must actively notify the agent when the approval status changes (approved or rejected).

## Decision
1. Agents will register a `webhook_url` in their database profile.
2. When an Admin resolves an approval request (via the Dashboard), the Gateway will trigger an asynchronous HTTP POST to the agent's `webhook_url`.
3. The payload will contain the `request_id` and the `status` (approved/rejected).
4. To prevent spoofing, the payload will be signed with HMAC-SHA256 using a shared secret (Future v1 feature, for now, we just send the payload).

## Consequences
- We need to add a `webhook_url` column to the `agents` table.
- The Gateway needs a background worker (goroutine) to send these webhooks without blocking the HTTP response to the Admin.
