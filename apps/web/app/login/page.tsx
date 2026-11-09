'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8080';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t, lang, setLang } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error('Invalid credentials');

      const data = await res.json();
      localStorage.setItem('walawe_token', data.token);
      localStorage.setItem('walawe_role', data.role);
      router.push('/dashboard');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 font-sans">
      <div className="absolute top-6 right-6">
        <button onClick={() => setLang(lang === 'en' ? 'id' : 'en')} className="text-xs font-medium text-neutral-400 hover:text-white border border-neutral-800 px-3 py-1.5 rounded-md transition-colors">
          {lang === 'en' ? '🇮🇩 ID' : '🇬🇧 EN'}
        </button>
      </div>

      <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2L2 7l7 12 3-6 3 6 7-12-10-5zm0 3.5l5.5 2.5-3.5 6-2-4-2 4-3.5-6 5.5-2.5z"/></svg></div>
          <h1 className="text-xl font-bold text-white tracking-tight">{t.loginTitle}</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">{t.email}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neutral-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-1">{t.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-black border border-neutral-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-neutral-500" />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-white text-black font-medium py-2.5 rounded-lg hover:bg-neutral-200 active:scale-95 transition-all mt-6 disabled:opacity-50">
            {loading ? t.signingIn : t.signIn}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-neutral-500">
          {t.noAccount}{' '}
          <Link href="/register" className="text-white hover:underline font-medium">{t.registerHere}</Link>
        </div>
      </div>
    </div>
  );
}
