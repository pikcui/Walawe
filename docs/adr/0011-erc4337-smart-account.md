# 0011. ERC-4337 Smart Account Implementation

- Status: Accepted
- Date: 2026-11-06

## Context
Our current `WalaweAccount.sol` is a basic contract that stores session keys. To process actual machine-to-machine payments on-chain (x402), it must comply with the ERC-4337 standard (Account Abstraction). This allows the account to validate `UserOperations` submitted by a Bundler.

## Decision
1. We will implement the core `IAccount` interface, specifically the `validateUserOp` function.
2. The `WalaweAccount` will hold a reference to the canonical `EntryPoint` contract (mocked for this stage).
3. When a `UserOperation` is received:
   - If the signer is the Owner (master key), it passes.
   - If the signer is a registered Session Key, it validates that the call target and amount are within the allowed limits.
4. We will mock the `UserOperation` struct to avoid importing the heavy `account-abstraction` NPM package for now, but keep the exact signature structure.

## Consequences
- The contract can now be deployed to Base/Ethereum Testnet.
- Session keys can be used by AI agents to sign transactions autonomously.
