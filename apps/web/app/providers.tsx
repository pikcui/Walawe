'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
// 1. Impor konektor metaMask, bukan injected
import { metaMask } from 'wagmi/connectors'; 
import { useState } from 'react';

const config = createConfig({
  chains: [baseSepolia],
  // 2. Gunakan metaMask() yang mendukung deep link di mobile
  connectors: [metaMask()], 
  transports: {
    [baseSepolia.id]: http(),
  },
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
