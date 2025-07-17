'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSwap } from '@/hooks/swap';
import { useWallets } from '@privy-io/react-auth';
import { useTransactions } from '@/contexts/TransactionContext';
import { toast } from 'sonner';

interface TradingWidgetProps {
  highTokenAdd: string;
  lowTokenAdd: string;
  poolAdd: string;
}

export function TradingWidget({ highTokenAdd, lowTokenAdd, poolAdd }: TradingWidgetProps) {
  const [selectedType, setSelectedType] = useState<'High' | 'Low'>('High');
  const [customAmount, setCustomAmount] = useState<string>('1');
  const [selectedToken, setSelectedToken] = useState<string>('usdc');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { wallets } = useWallets();
  const { addTransaction, updateTransactionStatus } = useTransactions();
  const { buy, sell } = useSwap();
  
  const currentToken = selectedType === 'High' ? 'High Token' : 'Low Token';
  const account = wallets[0]?.address as `0x${string}`;

  // Fetch token balances
  const fetchTokenBalances = async () => {
    // Implementation depends on your specific requirements
    console.log('Fetching token balances...');
  };

  // Buy function with transaction monitoring
  const buyToken = async () => {
    if (isLoading || !account) return;
    
    setIsLoading(true);
    
    // Add transaction to monitor
    const txId = addTransaction({
      type: 'buy',
      token: currentToken,
      amount: customAmount,
      status: 'pending',
      chainId: 11155111 // Sepolia testnet
    });

    try {
      // Call the actual buy function from useSwap
      const tx = await buy({
        amount: customAmount,
        token: currentToken,
        account,
        highTokenAdd,
        lowTokenAdd,
        poolAdd
      });
      
      // Update with actual transaction hash
      updateTransactionStatus(
        txId,
        'pending',
        tx.hash,
        undefined
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        updateTransactionStatus(
          txId,
          'success',
          tx.hash,
          undefined
        );
        // Refresh balances after successful transaction
        await fetchTokenBalances();
      } else {
        throw new Error('Transaction reverted');
      }
    } catch (error) {
      console.error('Buy error:', error);
      updateTransactionStatus(
        txId,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Transaction failed'
      );
      toast.error('Transaction failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sell function with transaction monitoring
  const sellToken = async () => {
    if (isLoading || !account) return;
    
    setIsLoading(true);
    
    // Add transaction to monitor
    const txId = addTransaction({
      type: 'sell',
      token: currentToken,
      amount: customAmount,
      status: 'pending',
      chainId: 11155111 // Sepolia testnet
    });

    try {
      // Call the actual sell function from useSwap
      const tx = await sell({
        amount: customAmount,
        token: currentToken,
        account,
        highTokenAdd,
        lowTokenAdd,
        poolAdd
      });
      
      // Update with actual transaction hash
      updateTransactionStatus(
        txId,
        'pending',
        tx.hash,
        undefined
      );
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        updateTransactionStatus(
          txId,
          'success',
          tx.hash,
          undefined
        );
        // Refresh balances after successful transaction
        await fetchTokenBalances();
      } else {
        throw new Error('Transaction reverted');
      }
    } catch (error) {
      console.error('Sell error:', error);
      updateTransactionStatus(
        txId,
        'failed',
        undefined,
        error instanceof Error ? error.message : 'Transaction failed'
      );
      toast.error('Transaction failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-black border border-gray-800 rounded-lg p-6 space-y-4">
      {/* High/Low Toggle */}
      <div className="flex space-x-4">
        <button
          onClick={() => setSelectedType('High')}
          className={`flex-1 h-12 rounded-2xl font-medium text-lg transition-colors ${
            selectedType === 'High'
              ? 'bg-green-400 text-black'
              : 'bg-transparent text-white border border-gray-600 hover:bg-gray-800'
          }`}
        >
          High
        </button>
        <button
          onClick={() => setSelectedType('Low')}
          className={`flex-1 h-12 rounded-2xl font-medium text-lg transition-colors ${
            selectedType === 'Low'
              ? 'bg-green-400 text-black'
              : 'bg-transparent text-white border border-gray-600 hover:bg-gray-800'
          }`}
        >
          Low
        </button>
      </div>

      {/* Amount Input */}
      <div className="bg-gray-800 rounded-lg p-4">
        <input
          type="number"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full bg-transparent text-white text-2xl font-bold text-center focus:outline-none"
        />
        <div className="text-gray-400 text-sm text-center mt-2">
          ${(parseFloat(customAmount) || 0).toLocaleString()}
        </div>
      </div>

      {/* Token Selection */}
      <div className="flex justify-between items-center text-gray-400 text-sm">
        <span>Token: {selectedToken.toUpperCase()}</span>
        <span>Balance: --</span>
      </div>

      {/* Buy/Sell Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={buyToken}
          disabled={isLoading}
          className={`flex-1 h-14 rounded-2xl font-semibold text-lg transition-all ${
            isLoading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-400 hover:bg-green-500 text-black hover:scale-105'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </div>
          ) : (
            'Buy'
          )}
        </button>
        <button
          onClick={sellToken}
          disabled={isLoading}
          className={`flex-1 h-14 rounded-2xl font-semibold text-lg transition-all ${
            isLoading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-red-500 hover:bg-red-600 text-white hover:scale-105'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </div>
          ) : (
            'Sell'
          )}
        </button>
      </div>

      {/* Transaction Status */}
      {isLoading && (
        <div className="text-center text-gray-400 text-sm">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting transaction...
          </div>
        </div>
      )}
    </div>
  );
}
