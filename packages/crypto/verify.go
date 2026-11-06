package crypto

import (
	"encoding/hex"
	"fmt"

	"github.com/ethereum/go-ethereum/crypto"
)

// VerifySignature memverifikasi tanda tangan ECDSA Ethereum (EIP-191).
// Mengembalikan alamat wallet (hex string) jika valid.
func VerifySignature(message string, sigHex string) (string, error) {
	signature, err := hex.DecodeString(sigHex)
	if err != nil {
		return "", fmt.Errorf("invalid signature hex: %v", err)
	}

	// Ethereum signatures are 65 bytes (r, s, v)
	if len(signature) != 65 {
		return "", fmt.Errorf("invalid signature length")
	}

	// Ethereum requires V to be 0 or 1 (not 27 or 28 like Bitcoin)
	if signature[64] == 27 || signature[64] == 28 {
		signature[64] -= 27
	}

	// Tambahkan prefix EIP-191 (Personal Sign)
	msgHash := crypto.Keccak256Hash([]byte(fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)))

	pubKey, err := crypto.SigToPub(msgHash.Bytes(), signature)
	if err != nil {
		return "", fmt.Errorf("failed to recover pubkey: %v", err)
	}

	address := crypto.PubkeyToAddress(*pubKey)
	return address.Hex(), nil
}
