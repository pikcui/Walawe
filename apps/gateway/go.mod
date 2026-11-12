module github.com/pikcui/Walawe/apps/gateway

go 1.25.0

replace github.com/pikcui/Walawe/packages/ledger => ../../packages/ledger

replace github.com/pikcui/Walawe/packages/policy-engine => ../../packages/policy-engine

require (
	github.com/ethereum/go-ethereum v1.17.10
	github.com/golang-jwt/jwt/v5 v5.3.1
	github.com/jackc/pgx/v5 v5.6.0
	github.com/pikcui/Walawe/packages/crypto v0.0.0-00010101000000-000000000000
	github.com/pikcui/Walawe/packages/ledger v0.0.0
	github.com/pikcui/Walawe/packages/policy-engine v0.0.0
	github.com/pikcui/Walawe/packages/providers v0.0.0-00010101000000-000000000000
	github.com/redis/go-redis/v9 v9.7.0
	golang.org/x/crypto v0.55.0
)

require (
	github.com/Microsoft/go-winio v0.6.2 // indirect
	github.com/ProjectZKM/Ziren/crates/go-runtime/zkvm_runtime v0.0.0-20251001021608-1fe7b43fc4d6 // indirect
	github.com/StackExchange/wmi v1.2.1 // indirect
	github.com/bits-and-blooms/bitset v1.20.0 // indirect
	github.com/cespare/xxhash/v2 v2.3.0 // indirect
	github.com/consensys/gnark-crypto v0.18.1 // indirect
	github.com/crate-crypto/go-eth-kzg v1.5.0 // indirect
	github.com/deckarep/golang-set/v2 v2.6.0 // indirect
	github.com/decred/dcrd/dcrec/secp256k1/v4 v4.0.1 // indirect
	github.com/dgryski/go-rendezvous v0.0.0-20200823014737-9f7001d12a5f // indirect
	github.com/ethereum/c-kzg-4844/v2 v2.1.8 // indirect
	github.com/fjl/jsonw v0.1.0 // indirect
	github.com/go-logr/logr v1.4.4 // indirect
	github.com/go-logr/stdr v1.2.2 // indirect
	github.com/go-ole/go-ole v1.3.0 // indirect
	github.com/gorilla/websocket v1.4.2 // indirect
	github.com/holiman/uint256 v1.3.2 // indirect
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/puddle/v2 v2.2.3 // indirect
	github.com/shirou/gopsutil v3.21.4-0.20210419000835-c7a38de76ee5+incompatible // indirect
	github.com/supranational/blst v0.3.16 // indirect
	github.com/tklauser/go-sysconf v0.3.12 // indirect
	github.com/tklauser/numcpus v0.6.1 // indirect
	go.opentelemetry.io/auto/sdk v1.2.1 // indirect
	go.opentelemetry.io/otel v1.46.0 // indirect
	go.opentelemetry.io/otel/metric v1.46.0 // indirect
	go.opentelemetry.io/otel/trace v1.46.0 // indirect
	golang.org/x/sync v0.22.0 // indirect
	golang.org/x/sys v0.47.0 // indirect
	golang.org/x/text v0.41.0 // indirect
)

replace github.com/pikcui/Walawe/packages/providers => ../../packages/providers

replace github.com/pikcui/Walawe/packages/crypto => ../../packages/crypto

replace golang.org/x/crypto => golang.org/x/crypto v0.33.0

replace golang.org/x/sync => golang.org/x/sync v0.11.0

replace golang.org/x/sys => golang.org/x/sys v0.30.0

replace golang.org/x/text => golang.org/x/text v0.22.0

replace golang.org/x/net => golang.org/x/net v0.35.0
