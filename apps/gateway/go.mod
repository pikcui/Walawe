module github.com/pikcui/Walawe/apps/gateway

go 1.23.0

replace github.com/pikcui/Walawe/packages/ledger => ../../packages/ledger

replace github.com/pikcui/Walawe/packages/policy-engine => ../../packages/policy-engine

require (
	github.com/jackc/pgx/v5 v5.6.0
	github.com/pikcui/Walawe/packages/crypto v0.0.0-00010101000000-000000000000
	github.com/pikcui/Walawe/packages/ledger v0.0.0
	github.com/pikcui/Walawe/packages/policy-engine v0.0.0
	github.com/pikcui/Walawe/packages/providers v0.0.0-00010101000000-000000000000
)

require (
	github.com/btcsuite/btcd/btcec/v2 v2.2.0 // indirect
	github.com/decred/dcrd/dcrec/secp256k1/v4 v4.0.1 // indirect
	github.com/ethereum/go-ethereum v1.13.14 // indirect
	github.com/holiman/uint256 v1.2.4 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/puddle/v2 v2.2.3 // indirect
	golang.org/x/crypto v0.17.0 // indirect
	golang.org/x/sync v0.10.0 // indirect
	golang.org/x/sys v0.16.0 // indirect
	golang.org/x/text v0.16.0 // indirect
)

replace github.com/pikcui/Walawe/packages/providers => ../../packages/providers

replace github.com/pikcui/Walawe/packages/crypto => ../../packages/crypto
