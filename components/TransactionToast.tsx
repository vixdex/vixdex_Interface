'use client';

import React from 'react';
import { CheckCircle, XCircle, Loader2, ExternalLink, AlertCircle, X } from 'lucide-react';
import type { Transaction, TransactionStatus } from '@/contexts/TransactionContext';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionToastProps {
  transaction: Transaction;
  onClose: () => void;
}

const TransactionToast: React.FC<TransactionToastProps> = ({ transaction, onClose }) => {
  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'success':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'failed':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'cancelled':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
    }
  };

  const getStatusText = (status: Transaction['status']) => {
    switch (status) {
      case 'pending':
        return 'Transaction Pending...';
      case 'success':
        return 'Transaction Successful!';
      case 'failed':
        return 'Transaction Failed';
      case 'cancelled':
        return 'Transaction Cancelled';
      default:
        return 'Unknown Status';
    }
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount);
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 6 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`p-4 rounded-lg border-2 shadow-lg transition-all duration-300 ${getStatusColor(transaction.status)}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {getStatusIcon(transaction.status)}
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">
              {getStatusText(transaction.status)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {transaction.type.toUpperCase()} {formatAmount(transaction.amount)} {transaction.token}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {transaction.status === 'pending' && (
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Waiting for blockchain confirmation...</span>
        </div>
      )}

      {transaction.status === 'success' && transaction.hash && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-2">
          <CheckCircle className="w-4 h-4" />
          <span>Confirmed on blockchain</span>
          {transaction.explorerUrl && (
            <a
              href={transaction.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors ml-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Transaction
            </a>
          )}
        </div>
      )}

      {transaction.status === 'failed' && (
        <div className="text-sm text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="w-4 h-4" />
            <span>Transaction failed</span>
          </div>
          {transaction.error && (
            <div className="text-xs text-red-500 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-2 rounded mt-2">
              {transaction.error}
            </div>
          )}
        </div>
      )}

      {transaction.chainId && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Chain ID: {transaction.chainId}
        </div>
      )}
    </motion.div>
  );
};

export default TransactionToast;
