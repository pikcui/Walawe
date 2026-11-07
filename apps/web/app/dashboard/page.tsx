'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAccount, useConnect, useDisconnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits } from 'viem';

const Icons = {
  Wallet: () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>),
  Clock: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>),
  Check: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  X: () => (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>)
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

// Base Sepolia USDC Address
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
// ABI minimal untuk transfer ERC20
const ERC20_ABI = [
  {
    "constant": false,
    "inputs": [{"name": "_to", "type": "address"}, {"name": "_value", "type": "uint256"}],
    "name": "transfer",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  }
];

export default function Home() {
  const [balance, setBalance] = useState<number | null>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // State Modal Add User
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  // State Modal Deposit (Manual & Web3)
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [depositMode, setDepositMode] = useState<'manual' | 'web3'>('manual');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositNote, setDepositNote] = useState('');

  // State Web3 (Wagmi)
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: hash, writeContract, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const router = useRouter();

  const fetchData = async () => {
    const token = localStorage.getItem('walawe_token');
    const role = localStorage.getItem('walawe_role');

    if (!token) {
      router.push('/login');
      return;
    }
    setUserRole(role);

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [balRes, appRes, usageRes] = await Promise.all([
        fetch(`${API_URL}/admin/balance`, { headers }),
        fetch(`${API_URL}/admin/approvals`, { headers }),
        fetch(`${API_URL}/admin/usage`, { headers })
      ]);

      if (balRes.status === 401 || appRes.status === 401 || usageRes.status === 401) {
        localStorage.removeItem('walawe_token');
        localStorage.removeItem('walawe_role');
        router.push('/login');
        return;
      }

      if (!balRes.ok || !appRes.ok || !usageRes.ok) {
        throw new Error("Failed to fetch data from server");
      }

      const balData = await balRes.json();
      const appData = await appRes.json();
      const usageData = await usageRes.json();

      setBalance(balData.balance_micro_usd);
      setApprovals(Array.isArray(appData) ? appData : []);
      setChartData(Array.isArray(usageData) ? usageData : []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  const resolveRequest = async (id: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('walawe_token');
    try {
      setApprovals((prev) => prev.filter((req) => req.id !== id));
      const res = await fetch(`${API_URL}/admin/approvals/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id, action })
      });

      if (res.status === 403) {
        alert("Forbidden: You do not have permission to approve requests.");
        fetchData();
        return;
      }
      fetchData();
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('walawe_token');

    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole })
      });

      if (res.ok) {
        alert("User created successfully!");
        setShowAddUser(false);
        setNewEmail('');
        setNewPassword('');
      } else {
        alert("Failed to create user. Email might already exist.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  const handleManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('walawe_token');
    const parsedAmount = parseFloat(depositAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    const microUsd = Math.round(parsedAmount * 1000000);

    try {
      const res = await fetch(`${API_URL}/admin/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount_micro_usd: microUsd, note: depositNote })
      });

      if (res.ok) {
        alert("Deposit successful!");
        setShowAddFunds(false);
        setDepositAmount('');
        setDepositNote('');
        fetchData();
      } else {
        const errorData = await res.json();
        alert(`Deposit failed: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error");
    }
  };

  // Fungsi untuk mengirim USDC On-Chain via Wagmi
  const handleWeb3Deposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      alert("Please connect your wallet first!");
      return;
    }
    
    // Tentukan alamat tujuan deposit (dalam kasus nyata, ini adalah alamat Smart Contract WalaweAccount milik agen)
    // Untuk testing, kita bisa hardcode alamat sementara atau mengambil dari state backend.
    // Di sini kita asumsikan kita mengirim ke alamat dompet yang sedang connect (mockup untuk demo).
    const targetAddress = address as `0x${string}`; 

    const parsedAmount = parseFloat(depositAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    // USDC di Base Sepolia menggunakan 6 desimal
    const amountInUnits = parseUnits(depositAmount, 6);

    try {
      writeContract({
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [targetAddress, amountInUnits],
      });
    } catch (err) {
      console.error("Web3 Error:", err);
      alert("Failed to initiate transaction");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('walawe_token');
    localStorage.removeItem('walawe_role');
    router.push('/login');
  };

  const fadeIn = `transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-white selection:text-black relative">
      
      {/* Modal Add User */}
      {showAddUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowAddUser(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
              <Icons.X />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Email</label>
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} required className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neutral-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neutral-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neutral-500 appearance-none">
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-white text-black font-medium py-2.5 rounded-lg hover:bg-neutral-200 transition-colors mt-6">
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Funds (Deposit) */}
      {showAddFunds && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowAddFunds(false)} className="absolute top-4 right-4 text-neutral-500 hover:text-white">
              <Icons.X />
            </button>
            <h2 className="text-xl font-bold text-white mb-2">Top Up Balance</h2>
            
            <div className="flex gap-2 mb-6 bg-black p-1 rounded-lg border border-neutral-800">
              <button onClick={() => setDepositMode('manual')} className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${depositMode === 'manual' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>Manual</button>
              <button onClick={() => setDepositMode('web3')} className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${depositMode === 'web3' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-white'}`}>Web3 (USDC)</button>
            </div>

            {depositMode === 'manual' ? (
              <form onSubmit={handleManualDeposit} className="space-y-4">
                <p className="text-sm text-neutral-500 mb-4">Funds will be recorded immutably in the ledger.</p>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Amount (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                    <input type="number" step="0.01" min="0.01" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} required placeholder="10.00" className="w-full bg-black border border-neutral-800 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:border-neutral-500" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-white text-black font-medium py-2.5 rounded-lg hover:bg-neutral-200 transition-colors mt-6">
                  Confirm Deposit
                </button>
              </form>
            ) : (
              <form onSubmit={handleWeb3Deposit} className="space-y-4">
                <p className="text-sm text-neutral-500 mb-4">Deposit USDC via Base Sepolia Testnet.</p>
                
                {!isConnected ? (
                  <button type="button" onClick={() => connect({ connector: connectors[0] })} className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                    Connect MetaMask
                  </button>
                ) : (
                  <div className="bg-black border border-neutral-800 p-3 rounded-lg text-sm text-neutral-300 font-mono mb-4">
                    Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Amount (USDC)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                    <input type="number" step="0.01" min="0.01" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} required placeholder="10.00" disabled={!isConnected} className="w-full bg-black border border-neutral-800 rounded-lg pl-8 pr-4 py-2 text-white focus:outline-none focus:border-neutral-500 disabled:opacity-50" />
                  </div>
                </div>
                
                <button type="submit" disabled={!isConnected || isPending || isConfirming} className="w-full bg-white text-black font-medium py-2.5 rounded-lg hover:bg-neutral-200 transition-colors mt-6 disabled:opacity-50">
                  {isPending ? "Check Wallet..." : isConfirming ? "Confirming..." : isConfirmed ? "Success!" : "Deposit Web3"}
                </button>
                {isConfirmed && <p className="text-green-500 text-xs text-center mt-2">Transaction confirmed! Hash: {hash?.slice(0,10)}...</p>}
              </form>
            )}
          </div>
        </div>
      )}

      <nav className="border-b border-neutral-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center font-bold text-sm tracking-tighter">
              W
            </div>
            <span className="text-lg font-semibold tracking-tight text-white hidden sm:block">Walawe</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {userRole === 'admin' && (
              <>
                <button onClick={() => setShowAddFunds(true)} className="whitespace-nowrap text-[10px] md:text-xs font-medium bg-neutral-800 text-white border border-neutral-700 px-2 md:px-3 py-1.5 rounded-md hover:bg-neutral-700 transition-colors">
                  + Funds
                </button>
                <button onClick={() => setShowAddUser(true)} className="whitespace-nowrap text-[10px] md:text-xs font-medium bg-white text-black px-2 md:px-3 py-1.5 rounded-md hover:bg-neutral-200 transition-colors">
                  + User
                </button>
              </>
            )}
            <button onClick={handleLogout} className="text-[10px] md:text-xs text-neutral-400 hover:text-white transition-colors ml-1 md:ml-0">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-8">
        <div className={fadeIn}>
          <h1 className="text-3xl font-bold text-white tracking-tighter">Overview</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage your agent wallet and authorize pending actions.</p>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${fadeIn}`}>
          <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800 hover:border-neutral-700 transition-colors duration-300 group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-neutral-400 mb-2">Total Balance</p>
                {loading ? (
                  <div className="h-10 w-32 bg-neutral-800 animate-pulse rounded"></div>
                ) : (
                  <h3 className="text-4xl font-mono font-light text-white tracking-tighter">
                    ${(balance! / 1000000).toFixed(4)}
                  </h3>
                )}
              </div>
              <div className="p-2 border border-neutral-800 rounded-lg text-neutral-400 group-hover:text-white transition-colors">
                <Icons.Wallet />
              </div>
            </div>
          </div>

          <div className="bg-neutral-950 rounded-2xl p-6 border border-neutral-800 md:col-span-2 flex flex-col justify-center relative overflow-hidden">
            <p className="text-sm font-medium text-neutral-400 mb-2">System Status</p>
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
              </span>
              <span className="text-xl font-medium text-white tracking-tight">All systems operational</span>
            </div>
            <p className="text-xs text-neutral-600 mt-2">Deterministic Policy Engine is actively monitoring traffic.</p>
          </div>
        </div>

        <div className={`bg-neutral-950 rounded-2xl border border-neutral-800 p-6 ${fadeIn}`}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white tracking-tight">Spending Trend (7 Days)</h2>
            <p className="text-sm text-neutral-500 mt-1">Overview of your agent's daily spending.</p>
          </div>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="date" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000000).toFixed(3)}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`$${(value / 1000000).toFixed(4)}`, 'Spent']}
                  />
                  <Line type="monotone" dataKey="total" stroke="#ffffff" strokeWidth={2} dot={{ r: 4, fill: '#000', stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-500 text-sm">
                No spending data available for the last 7 days.
              </div>
            )}
          </div>
        </div>

        <div className={`bg-neutral-950 rounded-2xl border border-neutral-800 overflow-hidden ${fadeIn}`}>
          <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">Pending Approvals</h2>
              <p className="text-sm text-neutral-500 mt-1">Agent requests that require your authorization.</p>
            </div>
            {approvals.length > 0 && (
              <div className="flex items-center gap-2 text-neutral-400 text-sm">
                <Icons.Clock />
                <span>{approvals.length} waiting</span>
              </div>
            )}
          </div>

          <div className="md:hidden divide-y divide-neutral-800">
            {approvals.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center border border-neutral-800">
                  <Icons.Check />
                </div>
                <p className="text-neutral-500 text-sm">No pending approvals</p>
              </div>
            ) : (
              approvals.map((req) => (
                <div key={req.id} className="p-6 space-y-5 hover:bg-neutral-900/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs text-neutral-500 font-mono">AGENT ID</p>
                      <p className="text-sm text-white font-mono">{req.agent_id.substring(0, 8)}...</p>
                    </div>
                    <div className="px-2.5 py-1 text-xs font-medium rounded border border-neutral-700 bg-neutral-900 text-neutral-300">
                      {req.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-black p-4 rounded-lg border border-neutral-800">
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">MODEL</p>
                      <p className="text-sm font-medium text-white">{req.model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500 mb-1">COST</p>
                      <p className="text-sm font-mono text-white">${(req.cost / 1000000).toFixed(4)}</p>
                    </div>
                  </div>

                  {userRole === 'admin' && (
                    <div className="flex gap-3">
                      <button onClick={() => resolveRequest(req.id, 'approve')} className="flex-1 bg-white text-black py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <Icons.Check /> Approve
                      </button>
                      <button onClick={() => resolveRequest(req.id, 'reject')} className="flex-1 bg-transparent border border-neutral-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 hover:border-neutral-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                        <Icons.X /> Reject
                      </button>
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
                  <th className="px-6 py-4 font-normal">Agent ID</th>
                  <th className="px-6 py-4 font-normal">Model</th>
                  <th className="px-6 py-4 font-normal">Cost</th>
                  <th className="px-6 py-4 font-normal">Status</th>
                  {userRole === 'admin' && <th className="px-6 py-4 text-right font-normal">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {approvals.length === 0 ? (
                  <tr>
                    <td colSpan={userRole === 'admin' ? 5 : 4} className="px-6 py-16 text-center text-neutral-500">
                      No pending approvals right now.
                    </td>
                  </tr>
                ) : (
                  approvals.map((req) => (
                    <tr key={req.id} className="hover:bg-neutral-900/40 transition-colors group">
                      <td className="px-6 py-4 font-mono text-neutral-400 text-xs">{req.agent_id}</td>
                      <td className="px-6 py-4 font-medium text-white">{req.model}</td>
                      <td className="px-6 py-4 font-mono text-neutral-300">${(req.cost / 1000000).toFixed(4)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 text-xs rounded-md border border-neutral-700 bg-neutral-900 text-neutral-300 font-medium">
                          {req.status}
                        </span>
                      </td>
                      {userRole === 'admin' && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => resolveRequest(req.id, 'approve')} className="bg-white text-black px-4 py-1.5 rounded-md text-xs font-medium hover:bg-neutral-200 active:scale-95 transition-all">
                              Approve
                            </button>
                            <button onClick={() => resolveRequest(req.id, 'reject')} className="bg-transparent border border-neutral-700 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-neutral-800 active:scale-95 transition-all">
                              Reject
                            </button>
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
