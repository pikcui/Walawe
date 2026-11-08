'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { useLanguage } from '../context/LanguageContext';

const Icons = {
  Wallet: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>),
  Clock: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  Check: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  X: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>),
  Plus: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>),
  Home: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>),
  Activity: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>),
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const ERC20_ABI = [
  { "constant": false, "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}], "name": "transfer", "outputs": [{"name": "", "type": "bool"}], "type": "function" }
];

export default function Home() {
  const { t, lang, setLang } = useLanguage();
  const [balance, setBalance] = useState<number | null>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  const [showAddFunds, setShowAddFunds] = useState(false);
  const [depositMode, setDepositMode] = useState<'manual' | 'web3'>('manual');
  const [depositAmount, setDepositAmount] = useState('');
  
  const [showWalletModal, setShowWalletModal] = useState(false);

  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const router = useRouter();

  // 1. OTOMATIS TUTUP MODAL WALLET SAAT TERHUBUNG
  useEffect(() => {
    if (isConnected) {
      setShowWalletModal(false);
    }
  }, [isConnected]);

  const fetchData = async () => {
    const token = localStorage.getItem('walawe_token');
    const role = localStorage.getItem('walawe_role');
    if (!token) { router.push('/login'); return; }
    setUserRole(role);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [balRes, appRes, usageRes] = await Promise.all([
        fetch(`${API_URL}/admin/balance`, { headers }),
        fetch(`${API_URL}/admin/approvals`, { headers }),
        fetch(`${API_URL}/admin/usage`, { headers })
      ]);
      if (balRes.status === 401) { localStorage.clear(); router.push('/login'); return; }
      const balData = await balRes.json();
      const appData = await appRes.json();
      const usageData = await usageRes.json();
      setBalance(balData.balance_micro_usd);
      setApprovals(Array.isArray(appData) ? appData : []);
      setChartData(Array.isArray(usageData) ? usageData : []);
      setLoading(false);
    } catch (err) { console.error(err); setLoading(false); }
  };

  useEffect(() => { setMounted(true); fetchData(); }, []);

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
            alert(t.depositSuccess);
            setShowAddFunds(false);
            setDepositAmount('');
            fetchData();
          }
        } catch (err) { console.error(err); }
      };
      submit();
    }
  }, [isConfirmed, hash]);

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
      if (res.ok) { setShowAddFunds(false); setDepositAmount(''); fetchData(); } 
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

  const handleLogout = () => { localStorage.clear(); router.push('/login'); };

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-white selection:text-black relative pb-20 md:pb-0">
      
      {/* MODALS & NAVBAR (Disembunyikan demi keringkasan, logika modal sama seperti sebelumnya) */}
      {/* Topbar Desktop */}
      <nav className="border-b border-neutral-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-bold">W</div>
            <span className="text-lg font-semibold tracking-tight text-white hidden sm:block">Walawe</span>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Language Toggle */}
            <button onClick={() => setLang(lang === 'en' ? 'id' : 'en')} className="text-xs font-medium text-neutral-400 hover:text-white transition-colors border border-neutral-800 px-2 py-1.5 rounded-md">
              {lang === 'en' ? '🇮🇩 ID' : '🇬🇧 EN'}
            </button>

            {/* Wallet Address Display */}
            {isConnected && (
              <div className="hidden md:flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-mono text-neutral-300">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <button onClick={() => disconnect()} className="text-xs text-red-400 hover:text-red-300 ml-2">✕</button>
              </div>
            )}

            {userRole === 'admin' && (
              <button onClick={() => setShowAddUser(true)} className="hidden md:block text-xs font-medium bg-neutral-800 text-white border border-neutral-700 px-3 py-1.5 rounded-md hover:bg-neutral-700 active:scale-95 transition-all">
                {t.addUser}
              </button>
            )}
            
            <button onClick={handleLogout} className="text-xs text-neutral-400 hover:text-white transition-colors active:scale-95">
              {t.logout}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-6 md:space-y-8">
        
        {/* Header Title */}
        <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-3xl font-bold text-white tracking-tighter">{t.overview}</h1>
          <p className="text-neutral-500 text-sm mt-1">{t.overviewDesc}</p>
        </div>

        {/* Cards Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Balance Card with Add Funds Button */}
          <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800 hover:border-neutral-600 transition-colors duration-300 group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-neutral-400 mb-2">{t.totalBalance}</p>
                {loading ? <div className="h-10 w-32 bg-neutral-800 animate-pulse rounded"></div> : 
                  <h3 className="text-4xl font-mono font-light text-white tracking-tighter">
                    ${(balance! / 1000000).toFixed(4)}
                  </h3>
                }
              </div>
              {/* Tombol Add Funds di dalam Card */}
              {userRole === 'admin' && (
                <button 
                  onClick={() => setShowAddFunds(true)} 
                  className="flex items-center gap-1 bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-neutral-200 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  <Icons.Plus /> {t.addFunds}
                </button>
              )}
            </div>
          </div>

          {/* System Status Card */}
          <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800 md:col-span-2 flex flex-col justify-center">
            <p className="text-sm font-medium text-neutral-400 mb-2">{t.systemStatus}</p>
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xl font-medium text-white tracking-tight">{t.operational}</span>
            </div>
            <p className="text-xs text-neutral-600 mt-2">{t.policyActive}</p>
          </div>
        </div>

        {/* Chart Section */}
        <div className={`bg-neutral-950 rounded-2xl border border-neutral-800 p-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white tracking-tight">{t.spendingTrend}</h2>
          </div>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickLine={false} />
                  <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickLine={false} tickFormatter={(v) => `$${(v / 1000000).toFixed(3)}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="total" stroke="#ffffff" strokeWidth={2} dot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-neutral-500 text-sm">{t.noSpending}</div>}
          </div>
        </div>
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-neutral-950 border-t border-neutral-800 flex justify-around items-center h-16 z-50">
        <button className="flex flex-col items-center text-white">
          <Icons.Home />
          <span className="text-[10px] mt-1 font-medium">Home</span>
        </button>
        <button className="flex flex-col items-center text-neutral-500 hover:text-white transition-colors">
          <Icons.Activity />
          <span className="text-[10px] mt-1 font-medium">Activity</span>
        </button>
        {/* Wallet Indicator for Mobile */}
        {isConnected && (
          <div className="flex flex-col items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mb-1 animate-pulse"></span>
            <span className="text-[10px] font-mono text-neutral-400">{address?.slice(0,4)}...{address?.slice(-3)}</span>
          </div>
        )}
      </nav>

    </div>
  );
}
