FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy semua file yang dibutuhkan
COPY packages/ledger /app/packages/ledger
COPY packages/policy-engine /app/packages/policy-engine
COPY packages/providers /app/packages/providers
COPY packages/crypto /app/packages/crypto
COPY apps/gateway /app/apps/gateway

WORKDIR /app/apps/gateway
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /gateway

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /gateway .
EXPOSE 8080
CMD ["./gateway"]
