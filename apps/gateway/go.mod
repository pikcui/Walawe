module github.com/pikcui/Walawe/apps/gateway

go 1.26.0

replace github.com/pikcui/Walawe/packages/ledger => ../../packages/ledger

replace github.com/pikcui/Walawe/packages/policy-engine => ../../packages/policy-engine

require (
	github.com/golang-jwt/jwt/v5 v5.3.1
	github.com/jackc/pgx/v5 v5.6.0
	github.com/pikcui/Walawe/packages/crypto v0.0.0-00010101000000-000000000000
	github.com/pikcui/Walawe/packages/ledger v0.0.0
	github.com/pikcui/Walawe/packages/policy-engine v0.0.0
	github.com/pikcui/Walawe/packages/providers v0.0.0-00010101000000-000000000000
	github.com/redis/go-redis/v9 v9.7.0
)

require (
	github.com/btcsuite/btcd/btcec/v2 v2.2.0 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/decred/dcrd/dcrec/secp256k1/v4 v4.0.1 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/ethereum/go-ethereum v1.13.14 // indirect
	github.com/holiman/uint256 v1.2.4 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/puddle/v2 v2.2.3 // indirect
	github.com/stretchr/testify v1.12.1 // indirect
	golang.org/x/crypto v0.58.0 // indirect
	golang.org/x/sync v0.24.0 // indirect
	golang.org/x/sys v0.49.0 // indirect
	golang.org/x/text v0.43.0 // indirect
)

replace github.com/pikcui/Walawe/packages/providers => ../../packages/providers

replace github.com/pikcui/Walawe/packages/crypto => ../../packages/crypto
