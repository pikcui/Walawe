'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { metaMask, walletConnect, injected } from 'wagmi/connectors';
import { useState } from 'react';

// GANTI BAGIAN INI DENGAN PROJECT ID DARI CLOUD.REOWN.COM
const projectId = 'f61deac30c7b0c093e9a6f11ff512faa';

const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ projectId }), // Ini yang akan membuat Chrome bisa terhubung
  ],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true, 
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
