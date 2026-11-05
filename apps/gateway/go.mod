module github.com/pikcui/Walawe/apps/gateway

go 1.25.0

replace github.com/pikcui/Walawe/packages/ledger => ../../packages/ledger

replace github.com/pikcui/Walawe/packages/policy-engine => ../../packages/policy-engine

require (
	github.com/jackc/pgx/v5 v5.12.0
	github.com/pikcui/Walawe/packages/ledger v0.0.0
	github.com/pikcui/Walawe/packages/policy-engine v0.0.0
	github.com/pikcui/Walawe/packages/providers v0.0.0-00010101000000-000000000000
)

require (
	github.com/jackc/pgpassfile v1.0.0 // indirect
	github.com/jackc/pgservicefile v0.0.0-20240606120523-5a60cdf6a761 // indirect
	github.com/jackc/puddle/v2 v2.2.3 // indirect
	golang.org/x/sync v0.22.0 // indirect
	golang.org/x/text v0.41.0 // indirect
)

replace github.com/pikcui/Walawe/packages/providers => ../../packages/providers
