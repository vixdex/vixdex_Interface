'use client';

import { TransactionProvider as Provider } from '@/contexts/TransactionContext';
import TransactionMonitor from '@/components/TransactionMonitor';

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider>
      {children}
      <TransactionMonitor />
    </Provider>
  );
}
