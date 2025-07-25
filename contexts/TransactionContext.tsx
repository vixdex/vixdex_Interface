'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type TransactionStatus = 'pending' | 'success' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  hash?: string;
  type: 'buy' | 'sell' | 'approve' | 'burn' | 'mint';
  token: string;
  amount: string;
  status: TransactionStatus;
  timestamp: number;
  error?: string;
  chainId?: number;
  explorerUrl?: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  updateTransactionStatus: (id: string, status: TransactionStatus, hash?: string, error?: string) => void;
}

const TransactionContext = createContext<TransactionContextType | null>(null);

export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const addTransaction = (tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...tx,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction.id;
  };

  const updateTransactionStatus = (id: string, status: TransactionStatus, hash?: string, error?: string) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.id === id 
          ? { 
              ...tx, 
              status, 
              hash, 
              error,
              explorerUrl: hash ? `https://sepolia.etherscan.io/tx/${hash}` : undefined 
            }
          : tx
      )
    );
  };

  return (
    <TransactionContext.Provider value={{ transactions, addTransaction, updateTransactionStatus }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
