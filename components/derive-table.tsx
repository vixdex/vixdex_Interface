'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Skeleton } from './ui/skeleton';

interface Pair {
  id: string;
  pairName: string;
  feeEarnings: string;
  icon: string;
  type: 'HIGH' | 'LOW';
}

export default function FeeEarningsTable() {
  const [data, setData] = useState<Pair[]>([]);

  useEffect(() => {
    setTimeout(() => {
      setData([
        {
          id: '1',
          pairName: 'ETH/USDC',
          feeEarnings: '12.45',
          icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
          type: 'HIGH',
        },
        {
          id: '2',
          pairName: 'BTC/USDT',
          feeEarnings: '34.67',
          icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
          type: 'HIGH',
        },
        {
          id: '3',
          pairName: 'SHIB/ETH',
          feeEarnings: '1.23',
          icon: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
          type: 'LOW',
        },
        {
          id: '4',
          pairName: 'UNI/DAI',
          feeEarnings: '7.89',
          icon: 'https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png',
          type: 'LOW',
        },
      ]);
    }, 1000);
  }, []);

  return (
    <div className="overflow-x-auto border rounded-lg p-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-muted-foreground border-b pb-2">
            <th className="py-2">Pair</th>
            <th className="py-2 text-right">Fee Earnings ($)</th>
            <th className="py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <motion.tr
              key={item.id}
              className="border-t border-border/20"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <td className="py-3 flex items-center gap-2">
                <Image
                  src={item.icon}
                  alt={item.pairName}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
                <div>
                  <div className="font-medium">{item.pairName}</div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      item.type === 'HIGH'
                        ? 'bg-green-200 text-green-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
              </td>
              <td className="py-3 text-right">${item.feeEarnings}</td>
              <td className="py-3 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => alert(`Claiming from ${item.pairName}`)}
                >
                  Claim
                </Button>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FeeTableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[60px]" />
        <Skeleton className="h-4 w-[60px]" />
        <Skeleton className="h-4 w-[60px]" />
        <Skeleton className="h-4 w-[60px]" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex justify-between items-center py-2 border-t border-border/20"
        >
          <div className="flex items-center">
            <Skeleton className="h-6 w-6 rounded-full mr-2" />
            <div>
              <Skeleton className="h-4 w-[80px] mb-1" />
              <Skeleton className="h-3 w-[40px]" />
            </div>
          </div>
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[60px]" />
        </div>
      ))}
    </div>
  );
}
