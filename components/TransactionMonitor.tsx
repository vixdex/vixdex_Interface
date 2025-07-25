'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Transaction } from '@/contexts/TransactionContext';
import TransactionToast from './TransactionToast';
import { useTransactions } from '@/contexts/TransactionContext';

const TransactionMonitor: React.FC = () => {
  const { transactions } = useTransactions();
  const [visibleTransactions, setVisibleTransactions] = useState<Set<string>>(new Set());

  // Show new transactions when they're added
  useEffect(() => {
    const newTxIds = transactions
      .filter(tx => !visibleTransactions.has(tx.id))
      .map(tx => tx.id);
    
    if (newTxIds.length > 0) {
      setVisibleTransactions(prev => new Set([...prev, ...newTxIds]));
    }
  }, [transactions, visibleTransactions]);

  // Auto-hide completed transactions after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      const completedTxIds = transactions
        .filter(tx => (tx.status === 'success' || tx.status === 'failed' || tx.status === 'cancelled') && 
          visibleTransactions.has(tx.id))
        .map(tx => tx.id);
      
      if (completedTxIds.length > 0) {
        setVisibleTransactions(prev => {
          const newSet = new Set(prev);
          completedTxIds.forEach(id => newSet.delete(id));
          return newSet;
        });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [transactions, visibleTransactions]);

  const visibleTxs = transactions.filter(tx => visibleTransactions.has(tx.id));

  if (visibleTxs.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-3">
      <AnimatePresence>
        {visibleTxs.map((tx) => (
          <TransactionToast
            key={tx.id}
            transaction={tx}
            onClose={() => {
              setVisibleTransactions(prev => {
                const newSet = new Set(prev);
                newSet.delete(tx.id);
                return newSet;
              });
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TransactionMonitor;
