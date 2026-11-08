'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseUnits } from 'viem';
import { baseSepolia } from 'wagmi/chains';
import { useLanguage } from '../context/LanguageContext';

const Icons = {
  Wallet: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>),
  Clock: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  Check: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  X: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>),
  Plus: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>),
  Menu: () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>),
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Custom UI States for Popups
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

  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { data: hash, writeContract, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const router = useRouter();

  // Helper for Formatting Currency
  const formatCurrency = (microUsd: number) => {
    return (microUsd / 1000000).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  useEffect(() => {
    if (isConnected) setShowWalletModal(false);
  }, [isConnected]);

  // Toast Auto-hide
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

  const handleDisconnect = () => {
    setConfirmModal({
      title: "Putuskan Dompet?",
      desc: "Anda harus menghubungkan ulang dompet jika ingin melakukan deposit Web3 lagi.",
      onConfirm: () => disconnect()
    });
  };

  const handleLogout = () => { localStorage.clear(); router.push('/login'); };

  const fadeIn = `transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-white selection:text-black relative">
      
      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-2xl z-[200] font-medium text-sm animate-slide-down flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-500 text-black' : 'bg-red-600 text-white'}`}>
          {toast.type === 'success' ? <Icons.Check /> : <Icons.X />}
          {toast.msg}
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center space-y-6 animate-scale-in">
            <h3 className="text-xl font-bold text-white">{confirmModal.title}</h3>
            <p className="text-sm text-neutral-400">{confirmModal.desc}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 bg-neutral-800 text-white py-2.5 rounded-lg font-medium active:scale-95 transition-all">Batal</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium active:scale-95 transition-all">Ya, Putuskan</button>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-IN MOBILE MENU (KANAN KE KIRI) */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[120] flex justify-end">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}></div>
          <div className="relative w-72 bg-neutral-950 h-full border-l border-neutral-800 flex flex-col p-6 shadow-2xl animate-slide-in-right">
            <div className="flex justify-between items-center mb-8">
              <span className="font-bold text-white text-lg">Menu</span>
              <button onClick={() => setShowMobileMenu(false)} className="text-neutral-500 hover:text-white active:scale-90 transition-transform"><Icons.X /></button>
            </div>
            
            <div className="flex flex-col space-y-6 flex-grow">
              <button onClick={() => { setLang(lang === 'en' ? 'id' : 'en'); setShowMobileMenu(false); }} className="text-left text-sm text-neutral-300 hover:text-white transition-colors">
                {lang === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
              </button>
              
              {isConnected && (
                <div className="flex flex-col space-y-2">
                  <span className="text-xs text-neutral-500 uppercase tracking-wider font-bold">Connected Wallet</span>
                  <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span className="text-xs font-mono text-neutral-300">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                    </div>
                    <button onClick={() => { handleDisconnect(); setShowMobileMenu(false); }} className="text-xs text-red-400 font-medium hover:text-red-300 transition-colors">Putuskan</button>
                  </div>
                </div>
              )}

              {userRole === 'admin' && (
                <button onClick={() => { setShowAddUser(true); setShowMobileMenu(false); }} className="text-left text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                  {t.addUser}
                </button>
              )}
            </div>
            
            <div className="pt-6 border-t border-neutral-800 mt-auto">
              <button onClick={handleLogout} className="text-left text-sm text-red-400 font-medium hover:text-red-300 transition-colors">
                {t.logout}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS (ADD USER & ADD FUNDS) */}
      {showAddUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in">
            <button onClick={() => setShowAddUser(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><Icons.X /></button>
            <h2 className="text-xl font-bold text-white mb-6">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div><label className="block text-sm font-medium text-neutral-400 mb-1">{t.email}</label><input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neutral-500" /></div>
              <div><label className="block text-sm font-medium text-neutral-400 mb-1">{t.password}</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neutral-500" /></div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neutral-500 appearance-none">
                  <option value="viewer">Viewer</option><option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-white text-black font-medium py-2.5 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all mt-6">Create User</button>
            </form>
          </div>
        </div>
      )}

      {showAddFunds && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scale-in">
            <button onClick={() => setShowAddFunds(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white"><Icons.X /></button>
            <h2 className="text-xl font-bold text-white mb-2">{t.topUp}</h2>
            <div className="flex gap-2 mb-6 bg-black p-1 rounded-lg border border-neutral-800">
              <button onClick={() => setDepositMode('manual')} className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${depositMode === 'manual' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>{t.manual}</button>
              <button onClick={() => setDepositMode('web3')} className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${depositMode === 'web3' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>{t.web3}</button>
            </div>
            
            {depositMode === 'manual' ? (
              <form onSubmit={handleManualDeposit} className="space-y-4">
                <p className="text-sm text-neutral-500 mb-4">{t.depositManual}</p>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">{t.amount} (USD)</label>
                  <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span><input type="number" step="0.01" min="0.01" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} required placeholder="10.00" className="w-full bg-black border border-neutral-800 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:border-neutral-500" /></div>
                </div>
                <button type="submit" className="w-full bg-white text-black font-medium py-2.5 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all mt-6">{t.confirm}</button>
              </form>
            ) : (
              <form onSubmit={handleWeb3Deposit} className="space-y-4">
                <p className="text-sm text-neutral-500 mb-4">{t.depositWeb3Desc}</p>
                {!isConnected ? (
                  <button type="button" onClick={() => setShowWalletModal(true)} className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all">{t.connectWallet}</button>
                ) : (
                  <div className="bg-black border border-neutral-800 p-3 rounded-lg text-sm text-neutral-300 font-mono mb-4 flex justify-between items-center">
                    <span>{t.walletConnected}: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">{t.amount} (USDC)</label>
                  <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span><input type="number" step="0.01" min="0.01" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} required placeholder="10.00" disabled={!isConnected} className="w-full bg-black border border-neutral-800 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:border-neutral-500 disabled:opacity-50" /></div>
                </div>
                <button type="submit" disabled={!isConnected || isPending || isConfirming} className="w-full bg-white text-black font-medium py-2.5 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all mt-6 disabled:opacity-50">
                  {isPending ? "Check Wallet..." : isConfirming ? "Confirming..." : isConfirmed ? t.success : t.depositWeb3}
                </button>
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
            <button onClick={() => { const wc = connectors.find(c => c.id === 'walletConnect'); if (wc) connect({ connector: wc }); }} disabled={isConnecting} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-3 px-4 rounded-lg transition-all disabled:opacity-50">
              {isConnecting ? <span>Menghubungkan...</span> : <span>Connect with WalletConnect</span>}
            </button>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <nav className="border-b border-neutral-800 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-bold">W</div>
            <span className="text-lg font-semibold tracking-tight text-white hidden sm:block">Walawe</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => setLang(lang === 'en' ? 'id' : 'en')} className="text-xs font-medium text-neutral-400 hover:text-white border border-neutral-800 px-3 py-1.5 rounded-md transition-colors">{lang === 'en' ? '🇮🇩 ID' : '🇬🇧 EN'}</button>
            {isConnected && (
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-mono text-neutral-300">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                <button onClick={handleDisconnect} className="text-xs text-red-400 hover:text-red-300 ml-2" title="Disconnect Wallet">✕</button>
              </div>
            )}
            {userRole === 'admin' && <button onClick={() => setShowAddUser(true)} className="text-xs font-medium bg-neutral-800 text-white px-3 py-1.5 rounded-md hover:bg-neutral-700 active:scale-95 transition-all">{t.addUser}</button>}
            <button onClick={handleLogout} className="text-xs text-neutral-400 hover:text-white active:scale-95 transition-all">{t.logout}</button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-3">
            {isConnected && (
               <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 px-2 py-1 rounded-full">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                 <span className="text-[10px] font-mono text-neutral-300">{address?.slice(0, 4)}...{address?.slice(-3)}</span>
               </div>
            )}
            <button onClick={() => setShowMobileMenu(true)} className="text-white p-1.5 active:scale-75 transition-transform duration-200">
              <Icons.Menu />
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12 space-y-6 md:space-y-8">
        <div className={fadeIn}>
          <h1 className="text-3xl font-bold text-white tracking-tighter">{t.overview}</h1>
          <p className="text-neutral-500 text-sm mt-1">{t.overviewDesc}</p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 ${fadeIn}`}>
          <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800 hover:border-neutral-600 transition-colors duration-300 relative overflow-hidden flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-400 mb-2">{t.totalBalance}</p>
              {loading ? <div className="h-10 w-32 bg-neutral-800 animate-pulse rounded"></div> : <h3 className="text-4xl font-mono font-light text-white tracking-tighter">${formatCurrency(balance!)}</h3>}
            </div>
            {userRole === 'admin' && (
              <button onClick={() => setShowAddFunds(true)} className="mt-4 w-full flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-neutral-200 active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <Icons.Plus /> {t.addFunds}
              </button>
            )}
          </div>

          <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800 md:col-span-2 flex flex-col justify-center">
            <p className="text-sm font-medium text-neutral-400 mb-2">{t.systemStatus}</p>
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative rounded-full h-2.5 w-2.5 bg-green-500"></span></span>
              <span className="text-xl font-medium text-white tracking-tight">{t.operational}</span>
            </div>
            <p className="text-xs text-neutral-600 mt-2">{t.policyActive}</p>
          </div>
        </div>

        <div className={`bg-neutral-950 rounded-2xl border border-neutral-800 p-6 ${fadeIn}`}>
          <div className="mb-6"><h2 className="text-lg font-semibold text-white">{t.spendingTrend}</h2></div>
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

        <div className={`bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden ${fadeIn}`}>
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">{t.pendingApprovals}</h2>
              <p className="text-sm text-neutral-500 mt-1">{t.approvalDesc}</p>
            </div>
            {approvals.length > 0 && (
              <div className="flex items-center gap-2 text-neutral-400 text-sm"><Icons.Clock /><span>{approvals.length} waiting</span></div>
            )}
          </div>

          <div className="md:hidden divide-y divide-neutral-800">
            {approvals.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3"><div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800"><Icons.Check /></div><p className="text-neutral-500 text-sm">{t.noApprovals}</p></div>
            ) : (
              approvals.map((req) => (
                <div key={req.id} className="p-6 space-y-5 hover:bg-neutral-900/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1"><p className="text-xs text-neutral-500 font-mono">AGENT ID</p><p className="text-sm text-white font-mono">{req.agent_id.substring(0, 8)}...</p></div>
                    <div className="px-2.5 py-1 text-xs font-medium rounded border border-neutral-700 bg-neutral-900 text-neutral-300">{req.status}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-black p-4 rounded-lg border border-neutral-800">
                    <div><p className="text-xs text-neutral-500 mb-1">MODEL</p><p className="text-sm font-medium text-white">{req.model}</p></div>
                    <div><p className="text-xs text-neutral-500 mb-1">COST</p><p className="text-sm font-mono text-white">${(req.cost / 1000000).toFixed(4)}</p></div>
                  </div>
                  {userRole === 'admin' && (
                    <div className="flex gap-3">
                      <button onClick={() => resolveRequest(req.id, 'approve')} className="flex-1 bg-white text-black py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Icons.Check /> {t.approve}</button>
                      <button onClick={() => resolveRequest(req.id, 'reject')} className="flex-1 bg-transparent border border-neutral-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 hover:border-neutral-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"><Icons.X /> {t.reject}</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black text-neutral-500 text-xs uppercase tracking-wider font-medium border-b border-neutral-800">
                <tr>
                  <th className="px-6 py-4 font-normal">Agent ID</th><th className="px-6 py-4 font-normal">Model</th><th className="px-6 py-4 font-normal">Cost</th><th className="px-6 py-4 font-normal">Status</th>
                  {userRole === 'admin' && <th className="px-6 py-4 text-right font-normal">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {approvals.length === 0 ? (
                  <tr><td colSpan={userRole === 'admin' ? 5 : 4} className="px-6 py-16 text-center text-neutral-500">{t.noApprovals}</td></tr>
                ) : (
                  approvals.map((req) => (
                    <tr key={req.id} className="hover:bg-neutral-900/40 transition-colors group">
                      <td className="px-6 py-4 font-mono text-neutral-400 text-xs">{req.agent_id}</td>
                      <td className="px-6 py-4 font-medium text-white">{req.model}</td>
                      <td className="px-6 py-4 font-mono text-neutral-300">${(req.cost / 1000000).toFixed(4)}</td>
                      <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs rounded-md border border-neutral-700 bg-neutral-900 text-neutral-300 font-medium">{req.status}</span></td>
                      {userRole === 'admin' && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => resolveRequest(req.id, 'approve')} className="bg-white text-black px-4 py-1.5 rounded-md text-xs font-medium hover:bg-neutral-200 active:scale-95 transition-all">{t.approve}</button>
                            <button onClick={() => resolveRequest(req.id, 'reject')} className="bg-transparent border border-neutral-700 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-neutral-800 active:scale-95 transition-all">{t.reject}</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
