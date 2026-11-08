'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { useLanguage } from '../context/LanguageContext';
import Playground from '../components/Playground';

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
  Trash: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>)
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const ERC20_ABI = [
  { "constant": false, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function" }
];

const parseJwt = (token: string) => {
  try { return JSON.parse(atob(token.split('.')[1])); } catch (e) { return null; }
};

export default function Home() {
  const { t, lang, setLang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'api-keys' | 'policy' | 'playground'>('overview');
  
  const [balance, setBalance] = useState<number | null>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null); 
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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

  useEffect(() => {
    if (isConnected) setShowWalletModal(false);
  }, [isConnected]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
      
      const balData = await balRes.json();
      const appData = await appRes.json();
      const usageData = await usageRes.json();
      const keysData = await keysRes.json();
      const policyJson = await policyRes.json();

      setBalance(balData.balance_micro_usd);
      setApprovals(Array.isArray(appData) ? appData : []);
      setChartData(Array.isArray(usageData) ? usageData : []);
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

  // Refresh data setiap kali pindah ke tab Overview
  useEffect(() => {
    if (activeTab === 'overview') {
      fetchData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (isConfirmed && hash) {
      const submit = async () => {
        const token = localStorage.getItem('walawe_token');
        try {
          const res = await fetch(`${API_URL}/admin/deposit-web3`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ tx_hash: hash })
          });
          if (res.ok) {
            setToast({ msg: t.depositSuccess, type: 'success' });
            setShowAddFunds(false);
            setDepositAmount('');
            reset(); 
            fetchData();
          }
        } catch (err) { console.error(err); }
      };
      submit();
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    if (!showAddFunds) reset();
  }, [showAddFunds]);

  const resolveRequest = async (id: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('walawe_token');
    try {
      setApprovals((prev) => prev.filter((req) => req.id !== id));
      const res = await fetch(`${API_URL}/admin/approvals/resolve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ id, action })
      });
      if (res.status === 403) { setToast({ msg: "Forbidden: You do not have permission.", type: 'error' }); fetchData(); return; }
      fetchData();
    } catch (err) { console.error(err); fetchData(); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('walawe_token');
    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
      });
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
      const res = await fetch(`${API_URL}/admin/deposit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ amount_micro_usd: microUsd })
      });
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
    try {
      writeContract({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'transfer', args: [address as `0x${string}`, amountInUnits] });
    } catch (err) { console.error(err); }
  };

  const handleGenerateKey = async () => {
    const token = localStorage.getItem('walawe_token');
    try {
      const res = await fetch(`${API_URL}/admin/api-keys/create`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNewGeneratedKey(data.api_key);
        fetchData();
      }
    } catch (err) { console.error(err); }
  };

  const handleRevokeKey = (id: string) => {
    setConfirmModal({
      title: "Revoke API Key?",
      desc: "Aplikasi yang menggunakan key ini akan langsung kehilangan akses.",
      onConfirm: async () => {
        const token = localStorage.getItem('walawe_token');
        try {
          const res = await fetch(`${API_URL}/admin/api-keys/revoke`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ id })
          });
          if (res.ok) {
            setToast({ msg: "API Key revoked", type: 'success' });
            fetchData();
          }
        } catch (err) { console.error(err); }
      }
    });
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    const token = localStorage.getItem('walawe_token');
    
    const modelsArray = policyModels.split(',').map(m => m.trim()).filter(m => m !== '');
    const newPolicy = {
      allowed_models: modelsArray,
      max_per_tx_micro_usd: Math.round(parseFloat(maxTx) * 1000000),
      daily_limit_micro_usd: Math.round(parseFloat(dailyLimit) * 1000000),
      monthly_limit_micro_usd: Math.round(parseFloat(dailyLimit) * 1000000 * 30)
    };

    try {
      const res = await fetch(`${API_URL}/admin/policy/update`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newPolicy)
      });
      if (res.ok) {
        setToast({ msg: "Policy updated successfully", type: 'success' });
        fetchData();
      } else {
        setToast({ msg: "Failed to update policy", type: 'error' });
      }
    } catch (err) { console.error(err); setToast({ msg: "Network error", type: 'error' }); }
    finally { setSavingPolicy(false); }
  };

  const handleDisconnect = () => {
    setConfirmModal({
      title: "Putuskan Dompet?",
      desc: "Anda harus menghubungkan ulang dompet jika ingin melakukan deposit Web3 lagi.",
      onConfirm: () => disconnect()
    });
  };

  const handleLogout = () => { localStorage.clear(); router.push('/login'); };

  const fadeIn = `transition-all duration-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-white selection:text-black relative">
      
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
              <button onClick={() => setConfirmModal(null)} className="flex-1 bg-neutral-800 text-white py-2.5 rounded-lg font-medium active:scale-95 transition-all">Batal</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium active:scale-95 transition-all">Ya, Lanjutkan</button>
            </div>
          </div>
        </div>
      )}

      {newGeneratedKey && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl text-center space-y-6 animate-scale-in">
            <h3 className="text-xl font-bold text-white">API Key Berhasil Dibuat</h3>
            <p className="text-sm text-neutral-400">Simpan key ini sekarang. Anda <strong>tidak akan bisa melihatnya lagi</strong>.</p>
            <div className="bg-black border border-neutral-700 p-4 rounded text-left break-all text-green-400 font-mono text-sm">{newGeneratedKey}</div>
            <button onClick={() => navigator.clipboard.writeText(newGeneratedKey)} className="w-full bg-white text-black font-bold py-2.5 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all">Copy API Key</button>
            <button onClick={() => setNewGeneratedKey(null)} className="w-full bg-transparent border border-neutral-700 text-white font-medium py-2.5 rounded-lg hover:bg-neutral-800 active:scale-95 transition-all">Tutup</button>
          </div>
        </div>
      )}

      {showMobileMenu && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}></div>
          <div className="relative w-72 bg-neutral-950 h-full border-l border-neutral-900 flex flex-col p-6 shadow-2xl animate-slide-in-right">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-1">Signed in as</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium truncate max-w-[150px]">{userEmail}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${userRole === 'admin' ? 'bg-white text-black' : 'bg-neutral-800 text-neutral-400'}`}>{userRole}</span>
                </div>
              </div>
              <button onClick={() => setShowMobileMenu(false)} className="text-neutral-500 hover:text-white active:scale-90 transition-transform"><Icons.X /></button>
            </div>

            <div className="flex flex-col space-y-1 border-t border-neutral-900 pt-6 mb-6">
              <button onClick={() => { setActiveTab('overview'); setShowMobileMenu(false); }} className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'overview' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'}`}>Overview</button>
              <button onClick={() => { setActiveTab('api-keys'); setShowMobileMenu(false); }} className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'api-keys' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'}`}>API Keys</button>
              <button onClick={() => { setActiveTab('policy'); setShowMobileMenu(false); }} className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'policy' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'}`}>Policy Engine</button>
              <button onClick={() => { setActiveTab('playground'); setShowMobileMenu(false); }} className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === 'playground' ? 'bg-neutral-900 text-white' : 'text-neutral-400 hover:text-white'}`}>Playground</button>
            </div>
            
            <div className="flex flex-col space-y-6 flex-grow border-t border-neutral-900 pt-6">
              <button onClick={() => { setLang(lang === 'en' ? 'id' : 'en'); setShowMobileMenu(false); }} className="text-left text-sm text-neutral-300 hover:text-white transition-colors">
                {lang === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
              </button>
              {isConnected && (
                <div className="flex flex-col space-y-2">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">Connected Wallet</span>
                  <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-xs font-mono text-neutral-300">{address?.slice(0, 6)}...{address?.slice(-4)}</span></div>
                    <button onClick={() => { handleDisconnect(); setShowMobileMenu(false); }} className="text-xs text-red-400 font-medium hover:text-red-300 transition-colors">Putuskan</button>
                  </div>
                </div>
              )}
              {userRole === 'admin' && (
                <button onClick={() => { setShowAddUser(true); setShowMobileMenu(false); }} className="text-left text-sm font-medium text-neutral-300 hover:text-white transition-colors flex items-center gap-2"><Icons.User /> {t.addUser}</button>
              )}
            </div>
            <div className="pt-6 border-t border-neutral-900 mt-auto">
              <button onClick={handleLogout} className="text-left text-sm text-red-400 font-medium hover:text-red-300 transition-colors">{t.logout}</button>
            </div>
          </div>
        </div>
      )}

      {showAddUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in">
            <button onClick={() => setShowWalletModal(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><Icons.X /></button>
            <h2 className="text-xl font-bold text-white mb-2">{t.connectWallet}</h2>
            {connectError && <div className="bg-red-950 border border-red-900 text-red-400 text-xs p-3 rounded mb-4 break-words">Error: {connectError.message}</div>}
            <p className="text-sm text-neutral-500 mb-6">Gunakan WalletConnect untuk terhubung dari browser HP.</p>
            <button onClick={() => { const wc = connectors.find(c => c.id === 'walletConnect'); if (wc) connect({ connector: wc }); }} disabled={isConnecting} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50">{isConnecting ? <span>Menghubungkan...</span> : <span>Connect with WalletConnect</span>}</button>
          </div>
        </div>
      )}

      <nav className="border-b border-neutral-900 bg-black/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center font-bold text-sm">W</div>
              <span className="text-lg font-semibold tracking-tight text-white hidden sm:block">Walawe</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={() => setActiveTab('overview')} className={`text-sm font-medium transition-colors ${activeTab === 'overview' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>Overview</button>
              <button onClick={() => setActiveTab('api-keys')} className={`text-sm font-medium transition-colors ${activeTab === 'api-keys' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>API Keys</button>
              <button onClick={() => setActiveTab('policy')} className={`text-sm font-medium transition-colors ${activeTab === 'policy' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>Policy</button>
              <button onClick={() => setActiveTab('playground')} className={`text-sm font-medium transition-colors ${activeTab === 'playground' ? 'text-white' : 'text-neutral-500 hover:text-white'}`}>Playground</button>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => setLang(lang === 'en' ? 'id' : 'en')} className="text-xs font-medium text-neutral-400 hover:text-white transition-colors">{lang === 'en' ? '🇮🇩 ID' : '🇬🇧 EN'}</button>
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

          <div className="flex md:hidden items-center gap-3">
            {isConnected && (
               <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span><span className="text-[10px] font-mono text-neutral-300">{address?.slice(0, 4)}...{address?.slice(-3)}</span></div>
            )}
            <button onClick={() => setShowMobileMenu(true)} className="text-white p-1 active:scale-90 transition-transform"><Icons.Menu /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-8">
        
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tighter">{t.overview}</h1>
                <p className="text-neutral-500 text-sm mt-1">{t.overviewDesc}</p>
              </div>
              {userRole === 'admin' && (
                <button onClick={() => setShowAddFunds(true)} className="flex items-center justify-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-neutral-200 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <Icons.Plus /> {t.addFunds}
                </button>
              )}
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
                    <AreaChart data={chartData} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ffffff" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                      <XAxis dataKey="date" stroke="#555" tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis stroke="#555" tick={{ fill: '#888', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(4)}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => [`$${(value / 1000000).toFixed(5)}`, 'Spent']} />
                      <Area type="monotone" dataKey="total" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
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
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
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

        {activeTab === 'playground' && (
          <div className="animate-fade-in">
            <Playground />
          </div>
        )}

        {activeTab === 'policy' && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
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
      </main>
    </div>
  );
}
