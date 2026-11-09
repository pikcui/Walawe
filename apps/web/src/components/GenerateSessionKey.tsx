"use client";

import { useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useWriteContract, useAccount } from "wagmi";
import { parseEther } from "viem";

const WALAWE_ACCOUNT_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "key", "type": "address" },
      { "internalType": "uint256", "name": "validUntil", "type": "uint256" },
      { "internalType": "uint256", "name": "maxAmountPerTx", "type": "uint256" },
      { "internalType": "address", "name": "allowedDestination", "type": "address" }
    ],
    "name": "addSessionKey",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

const WALAWE_ACCOUNT_ADDRESS = "0xb3e2d0a16bbc1d7b8c3543aeb458d22ddd961f68";
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

export default function GenerateSessionKey() {
  const { address: ownerAddress, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState("");

  async function encryptWithRSA(plainText: string, publicKeyPem: string): Promise<string> {
    // Perbaikan: Hapus header, footer, dan SEMUA spasi/enter menggunakan Regex
    const pemContents = publicKeyPem
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s/g, ''); 

    const binaryDerString = window.atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      binaryDer.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true,
      ["encrypt"]
    );

    const encodedText = new TextEncoder().encode(plainText);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encodedText
    );

    const bytes = new Uint8Array(encryptedBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  const handleGenerate = async () => {
    if (!isConnected || !ownerAddress) {
      setStatus("⚠️ Please connect your wallet first using the wallet icon in the top bar.");
      return;
    }

    const token = localStorage.getItem('walawe_token');
    if (!token) {
      setStatus("❌ You are not logged in. Please login again.");
      return;
    }

    setIsGenerating(true);
    setStatus("Generating Agent Key...");

    try {
      const agentPrivateKey = generatePrivateKey();
      const agentAccount = privateKeyToAccount(agentPrivateKey);

      const validUntil = Math.floor(Date.now() / 1000) + 86400;
      const maxAmountPerTx = parseEther("0.01"); 
      const allowedDestination = "0x61b811CE8AA07728066B50036FF47EaAa24a173E";

      setStatus("Waiting for wallet approval to add Session Key...");

      const txHash = await writeContractAsync({
        address: WALAWE_ACCOUNT_ADDRESS,
        abi: WALAWE_ACCOUNT_ABI,
        functionName: "addSessionKey",
        args: [agentAccount.address, BigInt(validUntil), maxAmountPerTx, allowedDestination],
      });

      setStatus("Transaction confirmed! Encrypting key...");

      const headers = { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      const res = await fetch(`${API_URL}/admin/rsa-public-key`, { headers });
      if (!res.ok) throw new Error("Failed to fetch RSA public key");
      const { publicKey } = await res.json();

      const encryptedKey = await encryptWithRSA(agentPrivateKey, publicKey);

      setStatus("Saving encrypted key to backend...");

      const saveRes = await fetch(`${API_URL}/admin/generate-session-key`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          encryptedPrivateKey: encryptedKey,
          agentPublicAddress: agentAccount.address,
          txHash: txHash,
          validUntil: validUntil
        })
      });

      if (!saveRes.ok) throw new Error("Failed to save key to backend");

      setStatus("✅ Session Key successfully generated and secured!");
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error: ${err.message || "Failed to generate"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 border border-neutral-800 rounded-2xl bg-neutral-950 text-white max-w-md w-full">
      <h3 className="text-lg font-semibold mb-2">Agent Session Key</h3>
      <p className="text-sm text-neutral-400 mb-6">
        Generate a secure key to allow your AI Agent to perform on-chain settlements within the limits you set.
      </p>
      
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-white text-black py-3 rounded-lg font-bold hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-50"
      >
        {isGenerating ? "Processing..." : "Generate Agent Key"}
      </button>

      {status && (
        <div className={`mt-4 p-4 border rounded-lg text-sm font-mono break-words transition-all animate-fade-in ${
          status.includes("⚠️") || status.includes("❌") 
            ? "bg-red-950/30 border-red-900/50 text-red-400" 
            : "bg-black border-neutral-800 text-neutral-300"
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}
