# Stage 1: Build
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Copy dependencies first
COPY packages/ledger /app/packages/ledger
COPY packages/policy-engine /app/packages/policy-engine
COPY packages/providers /app/packages/providers
COPY packages/crypto /app/packages/crypto
COPY apps/gateway /app/apps/gateway

WORKDIR /app/apps/gateway

# Download dependencies
RUN go mod download

# Build binary specifically for Linux AMD64 (standar cloud)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/gateway-bin

# Stage 2: Runtime
FROM alpine:3.19

# Install CA certificates (SANGAT PENTING untuk koneksi ke Neon & Upstash)
RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy binary dan beri izin eksekusi
COPY --from=builder /app/gateway-bin /app/gateway
RUN chmod +x /app/gateway

# Expose port (Hostless akan mengabaikan ini jika menggunakan env PORT, tapi ini standar)
EXPOSE 8080

CMD ["/app/gateway"]
