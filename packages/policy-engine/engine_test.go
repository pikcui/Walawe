package policyengine

import (
	"testing"

	"github.com/pikcui/Walawe/packages/ledger"
)

func TestEvaluate(t *testing.T) {
	tests := []struct {
		name     string
		req      Request
		usage    Usage
		policy   Policy
		expected Decision
	}{
		{
			name:     "Allowed under all limits",
			req:      Request{Model: "gpt-4", EstimatedCost: ledger.MicroUSD(100)},
			usage:    Usage{SpentToday: ledger.MicroUSD(500), SpentMonth: ledger.MicroUSD(1000)},
			policy:   Policy{Status: "active", MaxCostPerRequest: ledger.MicroUSD(200), MaxCostPerDay: ledger.MicroUSD(1000), MaxCostPerMonth: ledger.MicroUSD(5000), AllowedModels: []string{"gpt-4"}},
			expected: Decision{Allowed: true},
		},
		{
			name:     "Denied if suspended",
			req:      Request{Model: "gpt-4", EstimatedCost: ledger.MicroUSD(100)},
			usage:    Usage{SpentToday: 0, SpentMonth: 0},
			policy:   Policy{Status: "suspended"},
			expected: Decision{Allowed: false, Reason: "agent_suspended"},
		},
		{
			name:     "Denied if model not in allowlist",
			req:      Request{Model: "claude-3", EstimatedCost: ledger.MicroUSD(100)},
			usage:    Usage{SpentToday: 0, SpentMonth: 0},
			policy:   Policy{Status: "active", AllowedModels: []string{"gpt-4"}},
			expected: Decision{Allowed: false, Reason: "model_not_allowed"},
		},
		{
			name:     "Denied if exceeds per-request limit",
			req:      Request{Model: "gpt-4", EstimatedCost: ledger.MicroUSD(300)},
			usage:    Usage{SpentToday: 0, SpentMonth: 0},
			policy:   Policy{Status: "active", MaxCostPerRequest: ledger.MicroUSD(200)},
			expected: Decision{Allowed: false, Reason: "per_request_limit_exceeded"},
		},
		{
			name:     "Denied if exceeds daily limit",
			req:      Request{Model: "gpt-4", EstimatedCost: ledger.MicroUSD(100)},
			usage:    Usage{SpentToday: ledger.MicroUSD(950), SpentMonth: ledger.MicroUSD(2000)},
			policy:   Policy{Status: "active", MaxCostPerDay: ledger.MicroUSD(1000)},
			expected: Decision{Allowed: false, Reason: "daily_limit_exceeded"},
		},
		{
			name:     "Denied if exceeds monthly limit",
			req:      Request{Model: "gpt-4", EstimatedCost: ledger.MicroUSD(100)},
			usage:    Usage{SpentToday: ledger.MicroUSD(100), SpentMonth: ledger.MicroUSD(4950)},
			policy:   Policy{Status: "active", MaxCostPerMonth: ledger.MicroUSD(5000)},
			expected: Decision{Allowed: false, Reason: "monthly_limit_exceeded"},
		},
		{
			name:     "Require approval if exceeds threshold",
			req:      Request{Model: "gpt-4", EstimatedCost: ledger.MicroUSD(8000)},
			usage:    Usage{SpentToday: 0, SpentMonth: 0},
			policy:   Policy{Status: "active", ApprovalThreshold: ledger.MicroUSD(5000)},
			expected: Decision{Allowed: false, Reason: "require_approval"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := Evaluate(tt.req, tt.usage, tt.policy)
			if got.Allowed != tt.expected.Allowed {
				t.Errorf("Evaluate() Allowed = %v, want %v", got.Allowed, tt.expected.Allowed)
			}
			if got.Reason != tt.expected.Reason {
				t.Errorf("Evaluate() Reason = %v, want %v", got.Reason, tt.expected.Reason)
			}
		})
	}
}
