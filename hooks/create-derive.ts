'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import axios from 'axios';
import { useCallback } from 'react';
const VIX_CONTRACT_ABI = [
  'function deploy2Currency(address deriveToken, string[2] _tokenName, string[2] _tokenSymbol, address _poolAddress) returns (address[2])',
  'function getVixData(address poolAdd) view returns (address vixHighToken, address _vixLowToken, uint256 _circulation0, uint256 _circulation1, uint256 _contractHoldings0, uint256 _contractHoldings1, uint256 _reserve0, uint256 _reserve1, address _poolAddress)',
];

export function useCreateDerive() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  const createDerive = useCallback(
    async (deriveToken: string, poolAddress: string) => {
      if (!ready || !authenticated) throw new Error('Not authenticated');

      if (!wallets || wallets.length === 0) {
        throw new Error('No wallet connected');
      }

      const wallet = wallets[0]; // or select preferred wallet

      if (!wallet.getEthereumProvider) {
        throw new Error('Wallet does not support getEthereumProvider');
      }

      const privyProvider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(privyProvider);
      const signer = await ethersProvider.getSigner();

      const chain = process.env.NEXT_PUBLIC_NETWORK;
      let poolName = '';
      let poolPercentage = '';
      let volumeData: string[] = [];

      try {
        const oracleRes = await axios.post(
          process.env.NEXT_PUBLIC_NODE_URL + 'volume/uniswapV3/pool/oracle',
          { poolAddress, chain }
        );

        const {
          name,
          fee,
          message,
          data,
        } = oracleRes.data;
        console.log(oracleRes)

        console.log('Oracle Update:', message);
        console.log('Pool Name:', name);
        console.log('Pool Fee Percentage:', fee);

        poolName = name;
        poolPercentage = fee;
        volumeData = data;
      } catch (err) {
        console.error('❌ Failed to update oracle:', err);
        throw err;
      }

      // 2. Call smart contract
      try {
        const vixContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS!,
          VIX_CONTRACT_ABI,
          signer
        );

        const tokenNames = [`High ${poolName}`, `Low ${poolName}`];
        const tokenSymbols = ['High', 'Low'];

        const tx = await vixContract.deploy2Currency(
          deriveToken,
          tokenNames,
          tokenSymbols,
          poolAddress
        );
        const receipt = await tx.wait();
        console.log('Transaction Receipt:', receipt);
        const vixData = await vixContract.getVixData(poolAddress);

        return {
          txHash: "",
          highToken: vixData.vixHighToken,
          lowToken: vixData._vixLowToken,
          oracleData: {
            poolName,
            poolPercentage,
            volumeData,
          },
        };
      } catch (err) {
        console.error('❌ Error deploying VixTokens:', err);
        throw err;
      }
    },
    [ready, authenticated, user]
  );

  return { createDerive };
}
