"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "../context/LanguageContext";

export default function RegisterPage() {
  const [formData, setFormData] = useState({ email: "", password: "", org_name: "", agent_name: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState<{ api_key: string } | null>(null);
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8080";
      const res = await fetch(`${apiUrl}/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed.");
      setSuccessData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="max-w-md w-full border border-neutral-800 p-8 rounded-2xl bg-neutral-950 text-center space-y-6 shadow-2xl relative z-10">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 border border-green-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h2 className="text-2xl font-bold">{t.success}</h2>
          <p className="text-neutral-400 text-sm">Save this API Key securely. It <strong>will not be shown again</strong>.</p>
          <div className="bg-black border border-neutral-800 p-4 rounded-lg text-left break-all text-green-400 font-mono text-sm">{successData.api_key}</div>
          <button onClick={() => navigator.clipboard.writeText(successData.api_key)} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all">Copy API Key</button>
          <Link href="/login" className="block text-sm text-neutral-400 hover:text-white underline">{t.loginHere}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      
      <div className="max-w-md w-full border border-neutral-800 p-8 rounded-2xl bg-neutral-950 space-y-6 shadow-2xl relative z-10">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded bg-white text-black flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2L2 7l7 12 3-6 3 6 7-12-10-5zm0 3.5l5.5 2.5-3.5 6-2-4-2 4-3.5-6 5.5-2.5z"/></svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Walawe.</h1>
          <p className="text-neutral-400 text-sm">{t.registerTitle}</p>
        </div>

        {error && <div className="bg-red-950 border border-red-900 text-red-400 text-sm p-3 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{t.email}</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-600 transition-colors" placeholder="admin@company.com" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{t.password} (Min. 12)</label>
            <input type="password" name="password" required minLength={12} value={formData.password} onChange={handleChange} className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-600 transition-colors" placeholder="••••••••••••" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{t.orgName}</label>
            <input type="text" name="org_name" required value={formData.org_name} onChange={handleChange} className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-600 transition-colors" placeholder="Acme Corp" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{t.agentName}</label>
            <input type="text" name="agent_name" value={formData.agent_name} onChange={handleChange} className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-neutral-600 transition-colors" placeholder="Default Agent" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all disabled:opacity-50 mt-2">
            {loading ? t.creating : t.registerBtn}
          </button>
        </form>

        <div className="text-center text-sm text-neutral-500">
          {t.hasAccount} <Link href="/login" className="text-white hover:underline font-medium">{t.loginHere}</Link>
        </div>
      </div>
    </div>
  );
}
