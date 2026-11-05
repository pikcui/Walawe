// Package ledger implements the Walawe double-entry ledger.
//
// Money is always an integer number of micro-USD (see MicroUSD). Every ledger
// entry moves an amount from a debit account to a credit account, so the sum
// of all account balances is always zero. The balance of an account is the sum
// of its credits minus the sum of its debits.
//
// Spending an agent's funds follows a reserve, then settle flow:
//
//	Reserve: debit credit account, credit hold account (creates an open hold)
//	Settle:  debit hold account, credit revenue account (billed amount)
//	         debit hold account, credit credit account  (unused remainder)
//	Release: debit hold account, credit credit account  (cancel or expiry)
//
// All operations are idempotent. Persistence is abstracted by Store. MemStore
// is an in-memory implementation used for tests; a PostgreSQL store follows in
// stage 1b (see docs/adr/0003-ledger-store.md).
//
// This is a sensitive module: changes require human review (see AGENTS.md).
package ledger
