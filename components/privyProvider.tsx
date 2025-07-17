'use client';

import {
  PrivyProvider as PrivyProviderBase,
  usePrivy,
} from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { base, baseSepolia, sepolia } from 'viem/chains';
import { useEffect } from 'react';

// Component to handle post-login redirects
function AuthHandler({ children }: { children: React.ReactNode }) {
  const { authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (authenticated) {
      // Redirect to dashboard after successful login
      router.push('/');
    }
  }, [authenticated, router]);

  return <>{children}</>;
}

export function PrivyProvider({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    throw new Error('Missing NEXT_PUBLIC_PRIVY_APP_ID environment variable');
  }

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        // Configure login methods for non-custodial users
        loginMethods: ['wallet', 'google', 'email'],
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
          logo: '/logo.png',
        },
        // Enable smart wallets for non-custodial users
        embeddedWallets: {
          createOnLogin: 'users-without-wallets', // Auto-create smart wallet for users without one
          requireUserPasswordOnCreate: true, // Require passkey for recovery
        },
        // Chain configuration
        supportedChains: [baseSepolia, sepolia],
        defaultChain: sepolia, // Using Base Sepolia for testing
        // Wallet Connect configuration
        walletConnectCloudProjectId:
          process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthHandler>{children}</AuthHandler>
      </QueryClientProvider>
    </PrivyProviderBase>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return <PrivyProvider>{children}</PrivyProvider>;
}
