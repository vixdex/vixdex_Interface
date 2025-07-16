// utils/getPublicClient.ts

import { http, createPublicClient } from 'viem';
import { mainnet, sepolia, base, baseSepolia, arbitrumSepolia } from 'viem/chains';
import type { Chain } from 'viem';

// Map of supported chain IDs to viem Chain objects
const chains: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
  8453: base,
  84532: baseSepolia,
  421614: arbitrumSepolia,
};

export function getPublicClient(chainId: number) {
  const chain = chains[chainId];
  if (!chain) throw new Error(`Unsupported chain ID: ${chainId}`);

  return createPublicClient({
    chain,
    transport: http(),
  });
}
