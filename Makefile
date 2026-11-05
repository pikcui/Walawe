MODULES := apps/gateway packages/ledger packages/policy-engine packages/providers

.PHONY: test vet fmt fmt-check lint up down logs

test:
	for m in $(MODULES); do echo "==> $$m"; (cd $$m && go test -race -count=1 ./...) || exit 1; done

vet:
	for m in $(MODULES); do echo "==> $$m"; (cd $$m && go vet ./...) || exit 1; done

fmt:
	gofmt -w apps packages

fmt-check:
	test -z "$$(gofmt -l apps packages)" || (echo "gofmt needed on:"; gofmt -l apps packages; exit 1)

lint: fmt-check vet

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f
