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
	MaxCostPerRequest ledger.MicroUSD `json:"max_per_tx_micro_usd"`
	MaxCostPerDay     ledger.MicroUSD `json:"daily_limit_micro_usd"`
	MaxCostPerMonth   ledger.MicroUSD `json:"monthly_limit_micro_usd"`
	AllowedModels     []string        `json:"allowed_models"`
	Status            string          `json:"-"`
	ApprovalThreshold ledger.MicroUSD `json:"approval_threshold_micro_usd"`
}
