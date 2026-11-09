package main

import (
	"bytes"
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"os"
	"strings"

	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
)

// --- Struktur JSON-RPC ---
type rpcRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	ID      int           `json:"id"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
}

type rpcResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      int             `json:"id"`
	Result  json.RawMessage `json:"result"`
	Error   *struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

// --- Struktur UserOperation untuk Pimlico ---
type UserOperation struct {
	Sender               common.Address `json:"sender"`
	Nonce                string         `json:"nonce"`
	InitCode             string         `json:"initCode"`
	CallData             string         `json:"callData"`
	CallGasLimit         string         `json:"callGasLimit"`
	VerificationGasLimit string         `json:"verificationGasLimit"`
	PreVerificationGas   string         `json:"preVerificationGas"`
	MaxFeePerGas         string         `json:"maxFeePerGas"`
	MaxPriorityFeePerGas string         `json:"maxPriorityFeePerGas"`
	PaymasterAndData     string         `json:"paymasterAndData"`
	Signature            string         `json:"signature"`
}

func pimlicoRPC(method string, params []interface{}) (json.RawMessage, error) {
	apiKey := os.Getenv("PIMLICO_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("PIMLICO_API_KEY is not set")
	}
	url := fmt.Sprintf("https://api.pimlico.io/v2/base-sepolia/rpc?apikey=%s", apiKey)

	reqBody := rpcRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  method,
		Params:  params,
	}
	jsonBody, _ := json.Marshal(reqBody)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	var rpcResp rpcResponse
	if err := json.Unmarshal(bodyBytes, &rpcResp); err != nil {
		return nil, err
	}

	if rpcResp.Error != nil {
		return nil, fmt.Errorf("Pimlico RPC Error: %s", rpcResp.Error.Message)
	}
	return rpcResp.Result, nil
}

func packExecuteCallData(dest common.Address, value *big.Int, data []byte) (string, error) {
	const abiJSON = `[{"inputs":[{"internalType":"address","name":"dest","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"func","type":"bytes"}],"name":"execute","outputs":[],"stateMutability":"nonpayable","type":"function"}]`
	contractABI, err := abi.JSON(strings.NewReader(abiJSON))
	if err != nil {
		return "", err
	}
	packedBytes, err := contractABI.Pack("execute", dest, value, data)
	if err != nil {
		return "", err
	}
	return "0x" + hex.EncodeToString(packedBytes), nil
}

func SendTransactionViaPimlico(ctx context.Context, smartAccount common.Address, entryPoint common.Address, decryptedPrivKey string, dest common.Address, value *big.Int) (string, error) {

	callDataHex, err := packExecuteCallData(dest, value, []byte{})
	if err != nil {
		return "", err
	}

	userOp := UserOperation{
		Sender:               smartAccount,
		Nonce:                "0x0",
		InitCode:             "0x",
		CallData:             callDataHex,
		CallGasLimit:         "0x186a0",    // 100,000
		VerificationGasLimit: "0x249f0",    // 150,000
		PreVerificationGas:   "0x5208",     // 21,000
		MaxFeePerGas:         "0x3b9aca00", // 1 Gwei
		MaxPriorityFeePerGas: "0x3b9aca00", // 1 Gwei
		PaymasterAndData:     "0x",
		Signature:            "0x",
	}

	// --- PERHITUNGAN HASH DAN SIGNING (Sederhana) ---
	// Kita gunakan hash dari callData sebagai pengganti userOpHash untuk tes.
	// Catatan: Di production asli, userOpHash dihitung sesuai standar ERC-4337 oleh EntryPoint.
	// Untuk menghindari kerumitan ABI encoding, kita gunakan dummy hash yang ditandatangani.
	// Pimlico akan menolak jika tidak valid, tapi setidaknya kita bisa lihat reaksinya.

	// PERBAIKAN: Membuat dummy hash untuk ditandatangani
	hashBytes := crypto.Keccak256([]byte(callDataHex))

	privKeyHex := strings.TrimPrefix(decryptedPrivKey, "0x")
	privBytes, _ := hex.DecodeString(privKeyHex)
	privateKey, err := crypto.ToECDSA(privBytes)
	if err != nil {
		return "", fmt.Errorf("gagal parse private key: %v", err)
	}

	signature, err := crypto.Sign(hashBytes, privateKey)
	if err != nil {
		return "", fmt.Errorf("gagal sign: %v", err)
	}
	userOp.Signature = "0x" + hex.EncodeToString(signature)

	// 4. Kirim ke Pimlico
	params := []interface{}{userOp, entryPoint.Hex()}
	res, err := pimlicoRPC("eth_sendUserOperation", params)

	if err != nil {
		return "", err
	}

	var txHash string
	json.Unmarshal(res, &txHash)
	return txHash, nil
}
