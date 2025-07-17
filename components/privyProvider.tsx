'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base, baseSepolia, sepolia } from 'viem/chains';

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;
  const queryClient = new QueryClient();

  if (!appId || !clientId) {
    throw new Error(
      'Missing NEXT_PUBLIC_PRIVY_APP_ID or NEXT_PUBLIC_PRIVY_CLIENT_ID environment variables'
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        // Use viem's chain definitions for better type safety
        supportedChains: [sepolia, baseSepolia, base],
        defaultChain: sepolia,
        loginMethods: ['email', 'wallet', 'google'],
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
          logo: '/logo.png',
        },
        // Embedded wallets configuration
        embeddedWallets: {
          createOnLogin: 'off',
        },
        // Wallet Connect configuration
        walletConnectCloudProjectId:
          process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PrivyProvider>
  );
}
