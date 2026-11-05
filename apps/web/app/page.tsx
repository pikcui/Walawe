'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://127.0.0.1:8080/admin/balance')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setBalance(data.balance_micro_usd);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching balance:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-slate-800 pb-4">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Walawe Dashboard
          </h1>
          <p className="text-slate-400 mt-2">Infrastructure for autonomous AI agents</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
            <h2 className="text-lg font-medium text-slate-400 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Agent Wallet Balance
            </h2>
            
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="h-10 bg-slate-700 rounded w-3/4"></div>
              </div>
            ) : error ? (
              <p className="text-red-400">Error: {error}</p>
            ) : (
              <div>
                <p className="text-5xl font-mono text-emerald-400 tracking-tight">
                  ${(balance! / 1000000).toFixed(4)}
                </p>
                <p className="text-sm text-slate-500 mt-4 font-mono">
                  {balance?.toLocaleString()} micro-USD
                </p>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl flex flex-col justify-center items-center text-slate-500">
             <p>Usage Charts will appear here in v1.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
