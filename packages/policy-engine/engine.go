package policyengine

// Evaluate memeriksa apakah sebuah request diizinkan berdasarkan aturan yang berlaku.
func Evaluate(req Request, usage Usage, policy Policy) Decision {
	// 1. Cek Kill Switch (Status Agen)
	if policy.Status == "suspended" {
		return Decision{Allowed: false, Reason: "agent_suspended"}
	}

	// 2. Cek Allowlist Model (FAIL-CLOSED: Jika kosong, tolak!)
	if len(policy.AllowedModels) == 0 {
		return Decision{Allowed: false, Reason: "model_not_allowed_empty_policy"}
	}

	allowed := false
	for _, m := range policy.AllowedModels {
		if m == req.Model {
			allowed = true
			break
		}
	}
	if !allowed {
		return Decision{Allowed: false, Reason: "model_not_allowed"}
	}

	// 3. Cek Limit Per Request
	if policy.MaxCostPerRequest > 0 && req.EstimatedCost > policy.MaxCostPerRequest {
		return Decision{Allowed: false, Reason: "per_request_limit_exceeded"}
	}

	// 4. Cek Approval Threshold (Persetujuan Manusia)
	if policy.ApprovalThreshold > 0 && req.EstimatedCost > policy.ApprovalThreshold {
		return Decision{Allowed: false, Reason: "require_approval"}
	}

	// 5. Cek Limit Harian
	if policy.MaxCostPerDay > 0 && usage.SpentToday+req.EstimatedCost > policy.MaxCostPerDay {
		return Decision{Allowed: false, Reason: "daily_limit_exceeded"}
	}

	// 6. Cek Limit Bulanan
	if policy.MaxCostPerMonth > 0 && usage.SpentMonth+req.EstimatedCost > policy.MaxCostPerMonth {
		return Decision{Allowed: false, Reason: "monthly_limit_exceeded"}
	}

	// Jika semua lolos
	return Decision{Allowed: true, Reason: ""}
}
