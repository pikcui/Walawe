'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'id';

const translations = {
  en: {
    // Landing
    heroTitle: "The Financial Layer for AI Agents.",
    heroSubtitle: "Give your autonomous agents a wallet. Set hard limits. Watch them work.",
    getStarted: "Get Started",
    login: "Login",
    // Dashboard
    overview: "Overview",
    overviewDesc: "Manage your agent wallet and authorize pending actions.",
    totalBalance: "Total Balance",
    systemStatus: "System Status",
    operational: "All systems operational",
    policyActive: "Deterministic Policy Engine is actively monitoring traffic.",
    spendingTrend: "Spending Trend (7 Days)",
    noSpending: "No spending data available for the last 7 days.",
    pendingApprovals: "Pending Approvals",
    approvalDesc: "Agent requests that require your authorization.",
    noApprovals: "No pending approvals right now.",
    approve: "Approve",
    reject: "Reject",
    addFunds: "Add Funds",
    addUser: "Add User",
    logout: "Logout",
    topUp: "Top Up Balance",
    manual: "Manual",
    web3: "Web3 (USDC)",
    amount: "Amount",
    confirm: "Confirm Deposit",
    connectWallet: "Connect Wallet",
    walletConnected: "Wallet Connected",
    depositWeb3: "Deposit Web3",
    processing: "Processing...",
    success: "Success!",
    depositSuccess: "Web3 Deposit verified and recorded!",
    depositManual: "Funds will be recorded immutably in the ledger.",
    depositWeb3Desc: "Deposit USDC via Base Sepolia Testnet.",
  },
  id: {
    // Landing
    heroTitle: "Lapisan Finansial untuk AI Agent.",
    heroSubtitle: "Beri agen otonom Anda dompet. Tetapkan batas keras. Lihat mereka bekerja.",
    getStarted: "Mulai Sekarang",
    login: "Masuk",
    // Dashboard
    overview: "Ringkasan",
    overviewDesc: "Kelola dompet agen Anda dan setujui tindakan yang tertunda.",
    totalBalance: "Total Saldo",
    systemStatus: "Status Sistem",
    operational: "Semua sistem beroperasi",
    policyActive: "Policy Engine deterministik secara aktif memantau lalu lintas.",
    spendingTrend: "Tren Pengeluaran (7 Hari)",
    noSpending: "Tidak ada data pengeluaran selama 7 hari terakhir.",
    pendingApprovals: "Persetujuan Tertunda",
    approvalDesc: "Permintaan agen yang memerlukan otorisasi Anda.",
    noApprovals: "Tidak ada persetujuan tertunda saat ini.",
    approve: "Setujui",
    reject: "Tolak",
    addFunds: "Tambah Dana",
    addUser: "Tambah User",
    logout: "Keluar",
    topUp: "Isi Saldo",
    manual: "Manual",
    web3: "Web3 (USDC)",
    amount: "Jumlah",
    confirm: "Konfirmasi Deposit",
    connectWallet: "Hubungkan Dompet",
    walletConnected: "Dompet Terhubung",
    depositWeb3: "Deposit Web3",
    processing: "Memproses...",
    success: "Berhasil!",
    depositSuccess: "Deposit Web3 berhasil diverifikasi dan dicatat!",
    depositManual: "Dana akan dicatat secara permanen di ledger.",
    depositWeb3Desc: "Deposit USDC via Base Sepolia Testnet.",
  }
};

const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.en;
}>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('walawe_lang') as Language;
    if (saved && (saved === 'en' || saved === 'id')) {
      setLang(saved);
    }
  }, []);

  const changeLang = (l: Language) => {
    setLang(l);
    localStorage.setItem('walawe_lang', l);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
