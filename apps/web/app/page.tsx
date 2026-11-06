'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Icons = {
  Wallet: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
  ),
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  Check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
  )
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

export default function Home() {
  const [balance, setBalance] = useState<number | null>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const fetchData = async () => {
    const token = localStorage.getItem('walawe_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [balRes, appRes, usageRes] = await Promise.all([
        fetch(`${API_URL}/admin/balance`, { headers }),
        fetch(`${API_URL}/admin/approvals`, { headers }),
        fetch(`${API_URL}/admin/usage`, { headers })
      ]);

      if (balRes.status === 401 || appRes.status === 401 || usageRes.status === 401) {
        localStorage.removeItem('walawe_token');
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
      await fetch(`${API_URL}/admin/approvals/resolve`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, action })
      });
      fetchData();
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('walawe_token');
    router.push('/login');
  };

  const fadeIn = `transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  return (
    <div className="min-h-screen bg-black text-neutral-200 font-sans selection:bg-white selection:text-black">
      
      <nav className="border-b border-neutral-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-white text-black flex items-center justify-center font-bold text-sm tracking-tighter">
              W
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Walawe</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs font-medium text-neutral-400 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800">
              Admin Portal
            </div>
            <button onClick={handleLogout} className="text-xs text-neutral-400 hover:text-white transition-colors">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">
        
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

                  <div className="flex gap-3">
                    <button 
                      onClick={() => resolveRequest(req.id, 'approve')}
                      className="flex-1 bg-white text-black py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Icons.Check /> Approve
                    </button>
                    <button 
                      onClick={() => resolveRequest(req.id, 'reject')}
                      className="flex-1 bg-transparent border border-neutral-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 hover:border-neutral-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      <Icons.X /> Reject
                    </button>
                  </div>
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
                  <th className="px-6 py-4 text-right font-normal">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {approvals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-neutral-500">
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
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => resolveRequest(req.id, 'approve')}
                            className="bg-white text-black px-4 py-1.5 rounded-md text-xs font-medium hover:bg-neutral-200 active:scale-95 transition-all"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => resolveRequest(req.id, 'reject')}
                            className="bg-transparent border border-neutral-700 text-white px-4 py-1.5 rounded-md text-xs font-medium hover:bg-neutral-800 active:scale-95 transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
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
