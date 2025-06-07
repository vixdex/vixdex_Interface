'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID;

  if (!appId || !clientId) {
    throw new Error('Missing PRIVY_APP_ID or PRIVY_CLIENT_ID env vars');
  }

  return (
    <PrivyProvider
      appId={appId}
      clientId={clientId}
      config={{
        supportedChains: [
          {
            id: 11155111,
            name: 'Sepolia',
            nativeCurrency: {
              name: 'Sepolia ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://ethereum-sepolia-rpc.publicnode.com'], // Replace with your RPC
              },
            },
            blockExplorers: {
              default: {
                name: 'Etherscan',
                url: 'https://sepolia.etherscan.io',
              },
            },
            testnet: true,
          },
          {
            id: 84532,
            name: 'Base Sepolia',
            nativeCurrency: {
              name: 'Base Sepolia ETH',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: {
              default: {
                http: ['https://sepolia.base.org'], // Base Sepolia RPC
              },
            },
            blockExplorers: {
              default: {
                name: 'BaseScan',
                url: 'https://sepolia.basescan.org',
              },
            },
            testnet: true,
          },
        ],
        defaultChain: {
          id: 11155111,
          name: 'Sepolia',
          nativeCurrency: {
            name: 'Sepolia ETH',
            symbol: 'ETH',
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ['https://ethereum-sepolia-rpc.publicnode.com'], // Replace with your RPC
            },
          },
          blockExplorers: {
            default: {
              name: 'Etherscan',
              url: 'https://sepolia.etherscan.io',
            },
          },
          testnet: true,
        },
        loginMethods: ['email', 'wallet', 'google'],
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: '/logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
