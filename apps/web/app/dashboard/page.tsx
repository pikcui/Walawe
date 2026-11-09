'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { useLanguage } from '../context/LanguageContext';
import Playground from '../components/Playground';
import GenerateSessionKey from '../../src/components/GenerateSessionKey';

const Icons = {
  Wallet: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>),
  Clock: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  Check: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  X: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>),
  Plus: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>),
  Menu: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>),
  User: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>),
  Shield: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>),
  Key: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>),
  Trash: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>),
  Home: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  Message: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  Settings: () => (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>),
  Eye: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>),
  EyeOff: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>),
  Github: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>),
  Telegram: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>)
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const ERC20_ABI = [
  { "constant": false, "inputs": [{"name": "_to", "type": "address"}, { "name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function" }
];

const parseJwt = (token: string) => { try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; } };

export default function Home() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'api-keys' | 'session-keys' | 'policy' | 'playground' | 'settings'>('overview');
  
  const [balance, setBalance] = useState<number | null>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null); 
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Playground Config State
  const [pgWalaweKey, setPgWalaweKey] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pg_walawe_key') || '' : '');
  const [pgProvider, setPgProvider] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pg_provider') || 'gemini' : 'gemini');
  const [pgProviderKey, setPgProviderKey] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pg_provider_key') || '' : '');
  const [pgModel, setPgModel] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('pg_model') || 'gemini-3.5-flash-lite' : 'gemini-3.5-flash-lite');
  const [showPgWalaweKey, setShowPgWalaweKey] = useState(false);
  const [showPgProviderKey, setShowPgProviderKey] = useState(false);

  useEffect(() => { localStorage.setItem('pg_walawe_key', pgWalaweKey); }, [pgWalaweKey]);
  useEffect(() => { localStorage.setItem('pg_provider', pgProvider); }, [pgProvider]);
  useEffect(() => { localStorage.setItem('pg_provider_key', pgProviderKey); }, [pgProviderKey]);
  useEffect(() => { localStorage.setItem('pg_model', pgModel); }, [pgModel]);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  const [showAddFunds, setShowAddFunds] = useState(false);
  const [depositMode, setDepositMode] = useState<'manual' | 'web3'>('manual');
  const [depositAmount, setDepositAmount] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);

  const [newGeneratedKey, setNewGeneratedKey] = useState<string | null>(null);
  const [policyData, setPolicyData] = useState<any>(null);
  const [policyModels, setPolicyModels] = useState('');
  const [maxTx, setMaxTx] = useState('');
  const [dailyLimit, setDailyLimit] = useState('');
  const [savingPolicy, setSavingPolicy] = useState(false);

  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: hash, writeContract, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  const router = useRouter();

  const formatCurrency = (microUsd: number) => {
    const val = microUsd / 1000000;
    if (val === 0) return '0.00';
    const decimals = val >= 1 ? 2 : 4;
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: decimals });
  };

  useEffect(() => { if (isConnected) setShowWalletModal(false); }, [isConnected]);
  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(null), 4000); return () => clearTimeout(timer); } }, [toast]);

  const fetchData = async () => {
    const token = localStorage.getItem('walawe_token');
    const role = localStorage.getItem('walawe_role');
    if (!token) { router.push('/login'); return; }
    const decoded = parseJwt(token);
    if (decoded && decoded.sub) setUserEmail(decoded.sub);
    setUserRole(role);

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [balRes, appRes, usageRes, keysRes, policyRes] = await Promise.all([
        fetch(`${API_URL}/admin/balance`, { headers }),
        fetch(`${API_URL}/admin/approvals`, { headers }),
        fetch(`${API_URL}/admin/usage`, { headers }),
        fetch(`${API_URL}/admin/api-keys`, { headers }),
        fetch(`${API_URL}/admin/policy`, { headers })
      ]);
      if (balRes.status === 401) { localStorage.clear(); router.push('/login'); return; }
      const [balData, appData, usageData, keysData, policyJson] = await Promise.all([balRes.json(), appRes.json(), usageRes.json(), keysRes.json(), policyRes.json()]);
      
      setBalance(balData.balance_micro_usd);
      setApprovals(Array.isArray(appData) ? appData : []);
      
      // PROSES DATA GRAFIK AGAR GARIS MUNCUL
      const rawUsage = Array.isArray(usageData) ? usageData : [];
      const processedUsage = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const dayData = rawUsage.find((u: any) => u.date === dateStr);
        processedUsage.push({
          date: dateStr,
          total: dayData ? dayData.total : 0
        });
      }
      setChartData(processedUsage);

      setApiKeys(Array.isArray(keysData) ? keysData : []);
      if (policyJson && policyJson.allowed_models) {
        setPolicyData(policyJson);
        setPolicyModels(policyJson.allowed_models.join(', '));
        setMaxTx((policyJson.max_per_tx_micro_usd / 1000000).toString());
        setDailyLimit((policyJson.daily_limit_micro_usd / 1000000).toString());
      }
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  useEffect(() => { setMounted(true); fetchData(); }, []);
  useEffect(() => { if (activeTab === 'overview') fetchData(); }, [activeTab]);

  useEffect(() => {
    if (isConfirmed && hash) {
      const submit = async () => {
        const token = localStorage.getItem('walawe_token');
        try {
          const res = await fetch(`${API_URL}/admin/deposit-web3`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ tx_hash: hash }) });
          if (res.ok) { setToast({ msg: t.depositSuccess, type: 'success' }); setShowAddFunds(false); setDepositAmount(''); reset(); fetchData(); }
        } catch (err) { console.error(err); }
      };
      submit();
    }
  }, [isConfirmed, hash]);

  useEffect(() => { if (!showAddFunds) reset(); }, [showAddFunds]);

  const resolveRequest = async (id: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('walawe_token');
    try {
      setApprovals((prev) => prev.filter((req) => req.id !== id));
      const res = await fetch(`${API_URL}/admin/approvals/resolve`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ id, action }) });
      if (res.status === 403) { setToast({ msg: "Forbidden: You do not have permission.", type: 'error' }); fetchData(); return; }
      fetchData();
    } catch (err) { console.error(err); fetchData(); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('walawe_token');
    try {
      const res = await fetch(`${API_URL}/admin/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }) });
      if (res.ok) { setToast({ msg: "User created successfully!", type: 'success' }); setShowAddUser(false); setNewEmail(''); setNewPassword(''); } else { setToast({ msg: "Failed to create user.", type: 'error' }); }
    } catch (err) { console.error(err); }
  };

  const handleManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('walawe_token');
    const parsedAmount = parseFloat(depositAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    const microUsd = Math.round(parsedAmount * 1000000);
    try {
      const res = await fetch(`${API_URL}/admin/deposit`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ amount_micro_usd: microUsd }) });
      if (res.ok) { setShowAddFunds(false); setDepositAmount(''); fetchData(); setToast({ msg: "Deposit successful", type: 'success' }); } 
    } catch (err) { console.error(err); }
  };

  const handleWeb3Deposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) { setShowWalletModal(true); return; }
    if (chainId !== baseSepolia.id) { try { await switchChain({ chainId: baseSepolia.id }); } catch (err) { return; } }
    const parsedAmount = parseFloat(depositAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    const amountInUnits = parseUnits(depositAmount, 6);
    try { writeContract({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'transfer', args: [address as `0x${string}`, amountInUnits] }); } catch (err) { console.error(err); }
  };

  const handleGenerateKey = async () => {
    const token = localStorage.getItem('walawe_token');
    try {
      const res = await fetch(`${API_URL}/admin/api-keys/create`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setNewGeneratedKey(data.api_key); fetchData(); }
    } catch (err) { console.error(err); }
  };

  const handleRevokeKey = (id: string) => {
    setConfirmModal({
      title: "Revoke API Key?", desc: "Applications using this key will immediately lose access.",
      onConfirm: async () => {
        const token = localStorage.getItem('walawe_token');
        try {
          const res = await fetch(`${API_URL}/admin/api-keys/revoke`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ id }) });
          if (res.ok) { setToast({ msg: "API Key revoked", type: 'success' }); fetchData(); }
        } catch (err) { console.error(err); }
      }
    });
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    const token = localStorage.getItem('walawe_token');
    const modelsArray = policyModels.split(',').map(m => m.trim()).filter(m => m !== '');
    const newPolicy = { allowed_models: modelsArray, max_per_tx_micro_usd: Math.round(parseFloat(maxTx) * 1000000), daily_limit_micro_usd: Math.round(parseFloat(dailyLimit) * 1000000), monthly_limit_micro_usd: Math.round(parseFloat(dailyLimit) * 1000000 * 30) };
    try {
      const res = await fetch(`${API_URL}/admin/policy/update`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newPolicy) });
      if (res.ok) { setToast({ msg: "Policy updated successfully", type: 'success' }); fetchData(); } else { setToast({ msg: "Failed to update policy", type: 'error' }); }
    } catch (err) { console.error(err); setToast({ msg: "Network error", type: 'error' }); }
    finally { setSavingPolicy(false); }
  };

  const handleDisconnect = () => {
    setConfirmModal({ title: "Disconnect Wallet?", desc: "You must reconnect your wallet if you want to make a Web3 deposit again.", onConfirm: () => disconnect() });
  };

  const handleLogout = () => { localStorage.clear(); router.push('/login'); };
  const fadeIn = `transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  return (
    <div className="h-[100dvh] flex flex-col bg-black text-neutral-200 font-sans selection:bg-white selection:text-black overflow-hidden">
      
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl z-[200] font-medium text-sm animate-slide-down flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <Icons.Check /> : <Icons.X />}
          {toast.msg}
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center space-y-6 animate-scale-in">
            <h3 className="text-xl font-bold text-white">{confirmModal.title}</h3>
            <p className="text-sm text-neutral-400">{confirmModal.desc}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 bg-neutral-800 text-white py-2.5 rounded-lg font-medium active:scale-95 transition-all">Cancel</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium active:scale-95 transition-all">Yes, Continue</button>
            </div>
          </div>
        </div>
      )}

      {newGeneratedKey && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-center space-y-6 animate-scale-in">
            <h3 className="text-xl font-bold text-white">API Key Created</h3>
            <p className="text-sm text-neutral-400">Save this key now. You <strong>will not be able to see it again</strong>.</p>
            <div className="bg-black border border-neutral-700 p-4 rounded text-left break-all text-green-400 font-mono text-sm">{newGeneratedKey}</div>
            <button onClick={() => navigator.clipboard.writeText(newGeneratedKey)} className="w-full bg-white text-black font-bold py-2.5 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all">Copy API Key</button>
            <button onClick={() => setNewGeneratedKey(null)} className="w-full bg-transparent border border-neutral-700 text-white font-medium py-2.5 rounded-lg hover:bg-neutral-800 active:scale-95 transition-all">Close</button>
          </div>
        </div>
      )}

      {/* HAMBURGER MENU */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}></div>
          <div className="relative w-80 bg-neutral-950 h-full border-l border-neutral-900 flex flex-col p-6 shadow-2xl animate-slide-in-right">
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-1">Signed in as</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium truncate max-w-[150px]">{userEmail}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${userRole === 'admin' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'}`}>{userRole}</span>
                </div>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="text-neutral-500 hover:text-white active:scale-90 transition-transform"><Icons.X /></button>
            </div>

            <div className="flex flex-col space-y-2 border-t border-neutral-900 pt-6 flex-grow overflow-y-auto">
              <button onClick={() => { setActiveTab('overview'); setShowMobileMenu(false); }} className={`flex flex-col items-start gap-1 text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'}`}>
                <div className="flex items-center gap-3 text-sm font-medium"><Icons.Home /> Overview</div>
                <span className="text-[10px] text-neutral-500 ml-7 leading-tight">Manage agent wallet & pending actions</span>
              </button>
              
              <button onClick={() => { setActiveTab('api-keys'); setShowMobileMenu(false); }} className={`flex flex-col items-start gap-1 text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'api-keys' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'}`}>
                <div className="flex items-center gap-3 text-sm font-medium"><Icons.Key /> API Keys</div>
                <span className="text-[10px] text-neutral-500 ml-7 leading-tight">Generate & revoke agent access tokens</span>
              </button>

              <button onClick={() => { setActiveTab('session-keys'); setShowMobileMenu(false); }} className={`flex flex-col items-start gap-1 text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'session-keys' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'}`}>
                <div className="flex items-center gap-3 text-sm font-medium"><Icons.Shield /> Session Keys</div>
                <span className="text-[10px] text-neutral-500 ml-7 leading-tight">Generate Web3 keys for agent settlements</span>
              </button>
              
              <button onClick={() => { setActiveTab('policy'); setShowMobileMenu(false); }} className={`flex flex-col items-start gap-1 text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'policy' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'}`}>
                <div className="flex items-center gap-3 text-sm font-medium"><Icons.Shield /> Policy Engine</div>
                <span className="text-[10px] text-neutral-500 ml-7 leading-tight">Set strict spending limits & allowed models</span>
              </button>
              
              <button onClick={() => { setActiveTab('playground'); setShowMobileMenu(false); }} className={`flex flex-col items-start gap-1 text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'playground' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'}`}>
                <div className="flex items-center gap-3 text-sm font-medium"><Icons.Message /> Playground</div>
                <span className="text-[10px] text-neutral-500 ml-7 leading-tight">Test your AI agent with Bring Your Own Key</span>
              </button>

              <button onClick={() => { setActiveTab('settings'); setShowMobileMenu(false); }} className={`flex flex-col items-start gap-1 text-left px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'}`}>
                <div className="flex items-center gap-3 text-sm font-medium"><Icons.Settings /> Playground Settings</div>
                <span className="text-[10px] text-neutral-500 ml-7 leading-tight">Configure API Keys & Provider Models</span>
              </button>
            </div>
            
            <div className="flex flex-col space-y-4 shrink-0 border-t border-neutral-900 pt-4 mt-2">
              {/* TELEGRAM SUPPORT BUTTON */}
              <a href="https://t.me/+6282124643404" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              <div className="flex items-center gap-6"><a href="https://github.com/pikcui/Walawe.git" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"><Icons.Github /> GitHub</a><a href="https://t.me/+6282124643404" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"><Icons.Telegram /> Telegram</a></div>
              </a>

              {isConnected && (
                <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 px-4 py-2 rounded-xl">
                  <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-[10px] font-mono text-neutral-300">{address?.slice(0, 6)}...{address?.slice(-4)}</span></div>
                  <button onClick={() => { handleDisconnect(); setShowMobileMenu(false); }} className="text-[10px] text-red-400 font-medium hover:text-red-300 transition-colors">Disconnect</button>
                </div>
              )}
              {userRole === 'admin' && (
                <button onClick={() => { setShowAddUser(true); setShowMobileMenu(false); }} className="text-left text-xs font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-2"><Icons.User /> Add User</button>
              )}
              <button onClick={handleLogout} className="text-left text-xs text-red-400 font-medium hover:text-red-300 transition-colors">Logout</button>
            </div>

            <div className="absolute bottom-4 right-6 text-[9px] text-neutral-600/60 pointer-events-none select-none font-mono tracking-widest uppercase">by Galang</div>
          </div>
        </div>
      )}

      {/* Modals (Add User, Add Funds, Wallet) */}
      {showAddUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in">
            <button onClick={() => setShowAddUser(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><Icons.X /></button>
            <h2 className="text-xl font-bold text-white mb-6">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div><label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{t.email}</label><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-600" /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{t.password}</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-600" /></div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Role</label>
                <div className="flex gap-2 bg-black p-1 rounded-lg border border-neutral-800">
                  <button type="button" onClick={() => setNewRole('viewer')} className={`flex-1 py-2 text-sm rounded-md transition-colors font-medium ${newRole === 'viewer' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>Viewer</button>
                  <button type="button" onClick={() => setNewRole('admin')} className={`flex-1 py-2 text-sm rounded-md transition-colors font-medium ${newRole === 'admin' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>Admin</button>
                </div>
              </div>
              <button type="submit" className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all mt-4">Create User</button>
            </form>
          </div>
        </div>
      )}

      {showAddFunds && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in">
            <button onClick={() => setShowAddFunds(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><Icons.X /></button>
            <h2 className="text-xl font-bold text-white mb-6">{t.topUp}</h2>
            <div className="flex gap-2 mb-6 bg-black p-1 rounded-lg border border-neutral-800">
              <button onClick={() => setDepositMode('manual')} className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${depositMode === 'manual' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>{t.manual}</button>
              <button onClick={() => setDepositMode('web3')} className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${depositMode === 'web3' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>{t.web3}</button>
            </div>
            {depositMode === 'manual' ? (
              <form onSubmit={handleManualDeposit} className="space-y-4">
                <p className="text-sm text-neutral-500 mb-4">{t.depositManual}</p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{t.amount} (USD)</label>
                  <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span><input type="number" step="0.01" min="0.01" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} required placeholder="10.00" className="w-full bg-black border border-neutral-800 rounded-lg pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-600" /></div>
                </div>
                <button type="submit" className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all mt-4">{t.confirm}</button>
              </form>
            ) : (
              <form onSubmit={handleWeb3Deposit} className="space-y-4">
                <p className="text-sm text-neutral-500 mb-4">{t.depositWeb3Desc}</p>
                {!isConnected ? (
                  <button type="button" onClick={() => setShowWalletModal(true)} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 active:scale-95 transition-all">{t.connectWallet}</button>
                ) : (
                  <div className="bg-black border border-neutral-800 p-3 rounded-lg text-sm text-neutral-300 font-mono mb-4 flex justify-between items-center"><span>{t.walletConnected}: {address?.slice(0, 6)}...{address?.slice(-4)}</span></div>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{t.amount} (USDC)</label>
                  <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span><input type="number" step="0.01" min="0.01" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} required placeholder="10.00" disabled={!isConnected} className="w-full bg-black border border-neutral-800 rounded-lg pl-8 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-600 disabled:opacity-50" /></div>
                </div>
                <button type="submit" disabled={!isConnected || isPending || isConfirming} className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all mt-4 disabled:opacity-50">{isPending ? "Check Wallet..." : isConfirming ? "Confirming..." : isConfirmed ? t.success : t.depositWeb3}</button>
              </form>
            )}
          </div>
        </div>
      )}

      {showWalletModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in">
            <button onClick={() => setShowWalletModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><Icons.X /></button>
            <h2 className="text-xl font-bold text-white mb-2">{t.connectWallet}</h2>
            {connectError && <div className="bg-red-950 border border-red-900 text-red-400 text-xs p-3 rounded mb-4 break-words">Error: {connectError.message}</div>}
            <p className="text-sm text-neutral-500 mb-6">Use WalletConnect to connect from your mobile browser.</p>
            <button onClick={() => { const wc = connectors.find(c => c.id === 'walletConnect'); if (wc) connect({ connector: wc }); }} disabled={isConnecting} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50">{isConnecting ? <span>Connecting...</span> : <span>Connect with WalletConnect</span>}</button>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <nav className="shrink-0 border-b border-neutral-900 bg-black/90 backdrop-blur-xl z-40 w-full">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2L2 7l7 12 3-6 3 6 7-12-10-5zm0 3.5l5.5 2.5-3.5 6-2-4-2 4-3.5-6 5.5-2.5z"/></svg></div>
              <span className="text-lg font-semibold tracking-tight text-white hidden sm:block">Walawe</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => setActiveTab('overview')} className={`text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>Overview</button>
              <button onClick={() => setActiveTab('api-keys')} className={`text-sm font-medium transition-colors ${activeTab === 'api-keys' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>API Keys</button>
              <button onClick={() => setActiveTab('session-keys')} className={`text-sm font-medium transition-colors ${activeTab === 'session-keys' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>Session Keys</button>
              <button onClick={() => setActiveTab('policy')} className={`text-sm font-medium transition-colors ${activeTab === 'policy' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>Policy</button>
              <button onClick={() => setActiveTab('playground')} className={`text-sm font-medium transition-colors ${activeTab === 'playground' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>Playground</button>
              <button onClick={() => setActiveTab('settings')} className={`text-sm font-medium transition-colors ${activeTab === 'settings' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>Settings</button>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-neutral-400">{userEmail}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${userRole === 'admin' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'}`}>{userRole}</span>
            </div>
            {isConnected && (
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-mono text-neutral-300">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <button onClick={handleDisconnect} className="text-xs text-neutral-500 hover:text-red-400 ml-2 transition-colors" title="Disconnect Wallet">✕</button>
              </div>
            )}
            <button onClick={handleLogout} className="text-xs text-neutral-500 hover:text-white transition-colors">{t.logout}</button>
          </div>

          {/* Mobile Topbar */}
          <div className="flex md:hidden items-center gap-3">
            {isConnected && (
               <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span><span className="text-[10px] font-mono text-neutral-300">{address?.slice(0, 4)}...{address?.slice(-3)}</span></div>
            )}
            {userRole === 'admin' && (
              <button onClick={() => setShowAddFunds(true)} className="text-white p-1.5 active:scale-90 transition-transform bg-neutral-800 rounded-md" title="Add Funds">
                <Icons.Wallet />
              </button>
            )}
            <button onClick={() => setShowMobileMenu(true)} className="text-white p-1 active:scale-90 transition-transform"><Icons.Menu /></button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT (Scrollable area ONLY) */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'playground' ? (
          <div className="absolute inset-0 flex flex-col">
             <Playground />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
              
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-white tracking-tighter">{t.overview}</h1>
                      <p className="text-neutral-500 text-sm mt-1">{t.overviewDesc}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-6 border-y border-neutral-900">
                    <div className="flex flex-col justify-center">
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{t.totalBalance}</p>
                      {loading ? <div className="h-10 w-32 bg-neutral-900 animate-pulse rounded"></div> : <h3 className="text-4xl font-mono font-light text-white tracking-tighter">${formatCurrency(balance!)}</h3>}
                    </div>
                    <div className="md:col-span-2 flex flex-col justify-center md:border-l md:border-neutral-900 md:pl-8">
                      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{t.systemStatus}</p>
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative rounded-full h-2 w-2 bg-green-500"></span></span>
                        <span className="text-lg font-medium text-white tracking-tight">{t.operational}</span>
                      </div>
                      <p className="text-xs text-neutral-600 mt-1">{t.policyActive}</p>
                    </div>
                  </div>

                  <div className="py-2">
                    <div className="mb-6"><h2 className="text-lg font-semibold text-white">{t.spendingTrend}</h2></div>
                    <div className="h-72 w-full">
                      {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ outline: 'none' }}>
                            <defs>
                              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ffffff" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              stroke="#555" 
                              tick={{ fill: '#888', fontSize: 11 }} 
                              tickLine={false} 
                              axisLine={false} 
                              tickFormatter={(val) => {
                                const d = new Date(val);
                                return `${d.getDate()}/${d.getMonth() + 1}`;
                              }}
                              tickMargin={10}
                            />
                            <YAxis width={60} stroke="#555" tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(4)}`} />
                            <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => [`$${(value / 1000000).toFixed(5)}`, 'Spent']} />
                            <Area type="monotone" dataKey="total" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, fill: '#fff', stroke: '#000' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : <div className="h-full flex items-center justify-center text-neutral-600 text-sm">{t.noSpending}</div>}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-900">
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-white tracking-tight">{t.pendingApprovals}</h2>
                      <p className="text-sm text-neutral-500 mt-1">{t.approvalDesc}</p>
                    </div>
                    {approvals.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center gap-3">
                        <p className="text-neutral-500 text-sm">{t.noApprovals}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-900">
                        {approvals.map((req) => (
                          <div key={req.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-neutral-500 font-mono">AGENT ID:</span>
                                <span className="text-sm text-white font-mono">{req.agent_id.substring(0, 8)}...</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm mt-1">
                                <span className="text-neutral-300">Model: <strong className="text-white">{req.model}</strong></span>
                                <span className="text-neutral-300">Cost: <strong className="text-white font-mono">${(req.cost / 1000000).toFixed(4)}</strong></span>
                              </div>
                            </div>
                            {userRole === 'admin' && (
                              <div className="flex gap-2 w-full md:w-auto">
                                <button onClick={() => resolveRequest(req.id, 'approve')} className="flex-1 md:flex-none bg-white text-black px-5 py-2 rounded-lg text-sm font-medium hover:bg-neutral-200 active:scale-95 transition-all">Approve</button>
                                <button onClick={() => resolveRequest(req.id, 'reject')} className="flex-1 md:flex-none bg-neutral-900 text-white border border-neutral-800 px-5 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 active:scale-95 transition-all">Reject</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'api-keys' && (
                <div className="space-y-8 animate-fade-in max-w-4xl mx-auto w-full">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h1 className="text-3xl font-bold text-white tracking-tighter">API Keys</h1>
                      <p className="text-neutral-500 text-sm mt-1">Manage keys for your AI agents to access the API.</p>
                    </div>
                    <button onClick={handleGenerateKey} className="bg-white text-black px-5 py-2.5 rounded-lg font-bold hover:bg-neutral-200 active:scale-95 transition-all flex items-center gap-2">
                      <Icons.Plus /> Generate New Key
                    </button>
                  </div>

                  <div className="border-t border-neutral-900 pt-4">
                    {apiKeys.length === 0 ? (
                      <div className="p-12 text-center text-neutral-500">No active API keys found.</div>
                    ) : (
                      <div className="divide-y divide-neutral-900">
                        {apiKeys.map((key) => (
                          <div key={key.id} className="py-4 flex justify-between items-center">
                            <div>
                              <div className="font-mono text-green-400 font-medium">{key.masked_key}</div>
                              <div className="text-xs text-neutral-500 mt-1">Created: {new Date(key.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                            <button onClick={() => handleRevokeKey(key.id)} className="text-xs font-medium text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1">
                              <Icons.Trash /> Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'session-keys' && (
                <div className="space-y-8 animate-fade-in max-w-4xl mx-auto w-full">
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tighter">Session Keys</h1>
                    <p className="text-neutral-500 text-sm mt-1">Generate secure Web3 keys for AI agents to perform on-chain settlements.</p>
                  </div>
                  <div className="border-t border-neutral-900 pt-8 flex justify-center">
                    <GenerateSessionKey />
                  </div>
                </div>
              )}

              {activeTab === 'policy' && (
                <div className="space-y-8 animate-fade-in max-w-2xl mx-auto w-full">
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tighter">Policy Engine</h1>
                    <p className="text-neutral-500 text-sm mt-1">Set strict spending limits and allowed models for your agents.</p>
                  </div>

                  <form onSubmit={handleSavePolicy} className="space-y-6 pt-4 border-t border-neutral-900">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-2">
                        <Icons.Shield /> Allowed Models (Comma separated)
                      </label>
                      <input 
                        type="text" 
                        value={policyModels} 
                        onChange={e => setPolicyModels(e.target.value)} 
                        required 
                        placeholder="gpt-4o-mini, gemini-3.5-flash-lite"
                        className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-neutral-600" 
                      />
                      <p className="text-xs text-neutral-600 mt-2">If empty, all requests will be denied.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Max per Transaction (USD)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                          <input type="number" step="0.01" min="0.01" value={maxTx} onChange={e => setMaxTx(e.target.value)} required className="w-full bg-black border border-neutral-800 rounded-lg pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-neutral-600" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Daily Limit (USD)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                          <input type="number" step="0.01" min="0.01" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} required className="w-full bg-black border border-neutral-800 rounded-lg pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-neutral-600" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button type="submit" disabled={savingPolicy} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-50">
                        {savingPolicy ? "Saving..." : "Save Policy"}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8 animate-fade-in max-w-2xl mx-auto w-full">
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tighter">Playground Settings</h1>
                    <p className="text-neutral-500 text-sm mt-1">Configure your API keys and provider models for the Agent Playground.</p>
                  </div>

                  <div className="space-y-6 pt-4 border-t border-neutral-900">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Walawe API Key</label>
                      <div className="relative">
                        <input type="text" autoComplete="off" value={pgWalaweKey} onChange={e => setPgWalaweKey(e.target.value)} placeholder="wlw_..." className={`w-full bg-black border border-neutral-800 rounded-lg pl-4 pr-10 py-3 text-white text-sm focus:outline-none focus:border-neutral-600 ${!showPgWalaweKey ? '[-webkit-text-security:disc]' : ''}`} />
                        <button type="button" onClick={() => setShowPgWalaweKey(!showPgWalaweKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">{showPgWalaweKey ? <Icons.EyeOff /> : <Icons.Eye />}</button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">AI Provider</label>
                      <div className="flex gap-2 bg-black p-1 rounded-lg border border-neutral-800 w-full md:w-fit">
                        {['gemini', 'groq', 'openai', 'anthropic'].map(p => (
                          <button key={p} onClick={() => { setPgProvider(p); if(p==='openai') setPgModel('gpt-4o-mini'); if(p==='anthropic') setPgModel('claude-3-haiku-20240307'); if(p==='gemini') setPgModel('gemini-3.5-flash-lite'); if(p==='groq') setPgModel('llama3-8b-8192'); }} className={`flex-1 md:flex-none px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors ${pgProvider === p ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>{p}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{pgProvider} Provider Key (BYOK)</label>
                      <div className="relative">
                        <input type="text" autoComplete="off" value={pgProviderKey} onChange={e => setPgProviderKey(e.target.value)} placeholder="API Key..." className={`w-full bg-black border border-neutral-800 rounded-lg pl-4 pr-10 py-3 text-white text-sm focus:outline-none focus:border-neutral-600 ${!showPgProviderKey ? '[-webkit-text-security:disc]' : ''}`} />
                        <button type="button" onClick={() => setShowPgProviderKey(!showPgProviderKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">{showPgProviderKey ? <Icons.EyeOff /> : <Icons.Eye />}</button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Model Name</label>
                      <input type="text" value={pgModel} onChange={e => setPgModel(e.target.value)} className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-neutral-600" />
                    </div>

                    <div className="pt-6">
                      <button onClick={() => { setToast({ msg: "Settings saved successfully!", type: 'success' }); setActiveTab('playground'); }} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all">
                        Save & Go to Playground
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
