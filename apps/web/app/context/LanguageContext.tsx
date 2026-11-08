'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'id';

const translations = {
  en: {
    // Landing
    heroTitle: "Programmable Finance for Autonomous AI.",
    heroSubtitle: "Equip your AI agents with a wallet. Set strict spending limits. Let them pay for APIs and models independently.",
    feature1Title: "Hard Spending Limits",
    feature1Desc: "Never wake up to a drained bank account. Set daily and per-transaction limits.",
    feature2Title: "Bring Your Own Key (BYOK)",
    feature2Desc: "Your agents use your API keys. Walawe secures the payment flow.",
    feature3Title: "On-Chain Deposits",
    feature3Desc: "Top up your agent's wallet using USDC on Base Sepolia.",
    getStarted: "Start Building",
    login: "Sign In",
    
    // Auth
    loginTitle: "Admin Login",
    email: "Email",
    password: "Password",
    signIn: "Sign In",
    noAccount: "Don't have an account?",
    registerHere: "Register here",
    registerTitle: "Create Account",
    orgName: "Organization Name",
    agentName: "Agent Name (Optional)",
    registerBtn: "Create Account",
    hasAccount: "Already have an account?",
    loginHere: "Sign in here",
    creating: "Creating...",
    signingIn: "Signing in...",

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
    depositWeb3Desc: "Connect your Web3 wallet to fund your agent's account (Payment Method).",
    paymentSource: "Payment Source",
  },
  id: {
    // Landing
    heroTitle: "Keuangan Terprogram untuk AI Otonom.",
    heroSubtitle: "Bekali agen AI Anda dengan dompet. Tetapkan batas pengeluaran yang ketat. Biarkan mereka membayar API secara mandiri.",
    feature1Title: "Batas Pengeluaran Keras",
    feature1Desc: "Jangan pernah bangun dengan rekening kosong. Tetapkan batas harian dan per-transaksi.",
    feature2Title: "Bawa Kunci Anda Sendiri (BYOK)",
    feature2Desc: "Agen Anda menggunakan kunci API Anda. Walawe mengamankan alur pembayaran.",
    feature3Title: "Deposit On-Chain",
    feature3Desc: "Isi ulang dompet agen Anda menggunakan USDC di Base Sepolia.",
    getStarted: "Mulai Bangun",
    login: "Masuk",

    // Auth
    loginTitle: "Login Admin",
    email: "Email",
    password: "Password",
    signIn: "Masuk",
    noAccount: "Belum punya akun?",
    registerHere: "Daftar di sini",
    registerTitle: "Buat Akun",
    orgName: "Nama Organisasi",
    agentName: "Nama Agen (Opsional)",
    registerBtn: "Buat Akun",
    hasAccount: "Sudah punya akun?",
    loginHere: "Masuk di sini",
    creating: "Membuat...",
    signingIn: "Memproses...",

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
    depositWeb3Desc: "Hubungkan dompet Web3 Anda sebagai metode pembayaran untuk mengisi saldo.",
    paymentSource: "Sumber Dana",
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
