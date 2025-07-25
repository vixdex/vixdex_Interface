'use client';

import { usePrivy } from '@privy-io/react-auth';

export function useAuth() {
  const {
    authenticated,
    user,
    login,
    logout,
    ready,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
  } = usePrivy();

  return {
    isAuthenticated: authenticated,
    user,
    login,
    logout,
    isReady: ready,
    linkEmail,
    linkWallet,
    unlinkEmail,
    unlinkWallet,
  };
}

export function usePrivyWagmi() {
  const { user, getAccessToken } = usePrivy();
  
  // Get the first connected wallet from the user object
  const wallet = user?.wallet;
  
  // Helper function to get the wallet address
  const getWalletAddress = () => {
    return wallet?.address;
  };
  
  // Helper function to get the wallet provider
  const getWalletProvider = () => {
    return wallet?.walletClientType;
  };
  
  return {
    wallet,
    getWalletAddress,
    getWalletProvider,
    getAccessToken,
  };
}
