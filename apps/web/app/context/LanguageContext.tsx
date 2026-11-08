'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en';

const translations = {
  en: {
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
    depositWeb3Desc: "Connect your Web3 wallet to fund your agent's account.",
    paymentSource: "Payment Source",
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
    localStorage.setItem('walawe_lang', 'en');
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
