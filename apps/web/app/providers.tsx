'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';
import { useState } from 'react';

const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(), // Ini yang akan kita pakai di browser MetaMask
    metaMask(),
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true, // Sangat penting untuk Next.js
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
