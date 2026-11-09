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

// Pimlico JSON-RPC Request Structure
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

// Standard ERC-4337 UserOperation (matching our Solidity struct)
type UserOperation struct {
	Sender               common.Address `json:"sender"`
	Nonce                *big.Int       `json:"nonce"`
	InitCode             []byte         `json:"initCode"`
	CallData             []byte         `json:"callData"`
	CallGasLimit         *big.Int       `json:"callGasLimit"`
	VerificationGasLimit *big.Int       `json:"verificationGasLimit"`
	PreVerificationGas   *big.Int       `json:"preVerificationGas"`
	MaxFeePerGas         *big.Int       `json:"maxFeePerGas"`
	MaxPriorityFeePerGas *big.Int       `json:"maxPriorityFeePerGas"`
	PaymasterAndData     []byte         `json:"paymasterAndData"`
	Signature            []byte         `json:"signature"`
}

// Fungsi untuk mengirim JSON-RPC ke Pimlico
func pimlicoRPC(method string, params []interface{}) (json.RawMessage, error) {
	apiKey := os.Getenv("PIMLICO_API_KEY")
	if apiKey == "" {
		return nil, fmt.Errorf("PIMLICO_API_KEY is not set")
	}
	// Endpoint Base Sepolia Pimlico
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

// SignUserOperation menandatangani UserOp menggunakan Session Key (Private Key Hex)
func signUserOp(privKeyHex string, userOpHash common.Hash) ([]byte, error) {
	privKeyHex = strings.TrimPrefix(privKeyHex, "0x")
	privBytes, err := hex.DecodeString(privKeyHex)
	if err != nil {
		return nil, err
	}

	privateKey, err := crypto.ToECDSA(privBytes)
	if err != nil {
		return nil, err
	}

	signature, err := crypto.Sign(userOpHash.Bytes(), privateKey)
	if err != nil {
		return nil, err
	}
	return signature, nil
}

// PackExecuteCallData membungkus panggilan transfer ke dalam fungsi 'execute' kontrak kita
func packExecuteCallData(dest common.Address, value *big.Int, data []byte) ([]byte, error) {
	// ABI Minimal untuk execute(address,uint256,bytes)
	const abiJSON = `[{"inputs":[{"internalType":"address","name":"dest","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"func","type":"bytes"}],"name":"execute","outputs":[],"stateMutability":"nonpayable","type":"function"}]`
	contractABI, err := abi.JSON(strings.NewReader(abiJSON))
	if err != nil {
		return nil, err
	}
	return contractABI.Pack("execute", dest, value, data)
}

// SendTransactionViaPimlico adalah fungsi utama untuk mengeksekusi settlement
func SendTransactionViaPimlico(ctx context.Context, smartAccount common.Address, entryPoint common.Address, decryptedPrivKey string, dest common.Address, value *big.Int) (string, error) {

	// 1. Susun CallData (Misal: memanggil fungsi execute untuk transfer)
	callData, err := packExecuteCallData(dest, value, []byte{})
	if err != nil {
		return "", err
	}

	// 2. Siapkan UserOperation (Dummy gas limits dulu, nanti Pimlico yang hitung)
	userOp := UserOperation{
		Sender:               smartAccount,
		Nonce:                big.NewInt(0), // Idealnya ambil dari EntryPoint nonce()
		InitCode:             []byte{},
		CallData:             callData,
		CallGasLimit:         big.NewInt(100000),
		VerificationGasLimit: big.NewInt(150000),
		PreVerificationGas:   big.NewInt(21000),
		MaxFeePerGas:         big.NewInt(1000000000),
		MaxPriorityFeePerGas: big.NewInt(1000000000),
		PaymasterAndData:     []byte{},
		Signature:            []byte{},
	}

	// 3. Minta Pimlico untuk menghitung UserOpHash
	params := []interface{}{userOp, entryPoint.Hex()}
	res, err := pimlicoRPC("eth_sendUserOperation", params)

	if err != nil {
		return "", err
	}

	var txHash string
	json.Unmarshal(res, &txHash)
	return txHash, nil
}
