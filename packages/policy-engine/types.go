package policyengine

import "github.com/pikcui/Walawe/packages/ledger"

// Decision adalah hasil dari evaluasi policy.
type Decision struct {
	Allowed bool
	Reason  string
}

// Request adalah data yang masuk dari Gateway.
type Request struct {
	Model         string
	MaxTokens     int64
	EstimatedCost ledger.MicroUSD
}

// Usage adalah data pemakaian agen saat ini.
type Usage struct {
	SpentToday ledger.MicroUSD
	SpentMonth ledger.MicroUSD
}

// Policy adalah aturan yang di-set oleh manusia.
type Policy struct {
	MaxCostPerRequest ledger.MicroUSD
	MaxCostPerDay     ledger.MicroUSD
	MaxCostPerMonth   ledger.MicroUSD
	AllowedModels     []string
	Status            string
}
