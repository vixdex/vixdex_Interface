'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface TradingPairsProps {
  loading?: boolean;
}

interface TradingPair {
  id: string;
  name: string;
  swing: string;
  baseSymbol: string;
  quoteSymbol: string;
  price: string;
  marketCap: string;
  change24h: number;
  currentIV: string;
  icon: string;
}

export function TradingPairs({ loading = false }: TradingPairsProps) {
  const [pairs, setPairs] = useState<TradingPair[]>([]);

  useEffect(() => {
    // Simulate API fetch
    const fetchPairs = async () => {
      // In a real app, this would be an API call
      setTimeout(() => {
        setPairs([
          {
            id: '1',
            name: 'SHIB/USDC',
            swing: 'High',
            baseSymbol: 'SHIB',
            quoteSymbol: 'USDC',
            price: '$0.0527',
            marketCap: '$200K',
            change24h: 2.4,
            currentIV: '48%',
            icon: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
          },
          {
            id: '2',
            name: 'USDC/BTC',
            swing: 'Low',
            baseSymbol: 'USDC',
            quoteSymbol: 'BTC',
            price: '$0.0527',
            marketCap: '$200K',
            change24h: -2.3,
            currentIV: '90.23%',
            icon: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
          },
          {
            id: '3',
            name: 'SHIB/ETH',
            swing: 'High',

            baseSymbol: 'SHIB',
            quoteSymbol: 'ETH',
            price: '$0.00003',
            marketCap: '$200K',
            change24h: 2.4,
            currentIV: '0.284%',
            icon: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
          },
          {
            id: '4',
            name: 'SHIB/USDC',
            swing: 'High',

            baseSymbol: 'SHIB',
            quoteSymbol: 'USDC',
            price: '$0.0527',
            marketCap: '$200K',
            change24h: 2.4,
            currentIV: '48%',
            icon: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
          },
          {
            id: '5',
            name: 'USDC/BTC',
            swing: 'Low',

            baseSymbol: 'USDC',
            quoteSymbol: 'BTC',
            price: '$0.0527',
            marketCap: '$200K',
            change24h: -2.3,
            currentIV: '90.23%',
            icon: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
          },
          {
            id: '6',
            name: 'SHIB/ETH',
            swing: 'Low',

            baseSymbol: 'SHIB',
            quoteSymbol: 'ETH',
            price: '$0.00003',
            marketCap: '$200K',
            change24h: 2.4,
            currentIV: '0.284%',
            icon: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
          },
        ]);
      }, 1000);
    };

    if (!loading) {
      fetchPairs();
    }
  }, [loading]);

  if (loading) {
    return <TradingPairsSkeleton />;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="text-xs text-muted-foreground border-b   border-border/80">
          <th className="text-left pb-2 pl-2">Derive Name</th>
          <th className="text-right pb-2 ">Price</th>
          <th className="text-right pb-2 hidden md:table-cell">
            VFTs marketcap
          </th>
          <th className="text-right pb-2 hidden md:table-cell">24h Change</th>
          <th className="text-right pb-2 hidden md:table-cell">Current IV</th>

          <th className="text-right pb-2 pr-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {pairs.map((pair, index) => (
          <motion.tr
            key={pair.id}
            className="border-b border-border/10 hover:bg-card/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <td className="py-3 pl-2">
              <Link href={`/token/${pair.id}`} className="flex items-center">
                <div className="w-6 h-6 mr-2 relative">
                  <Image
                    src={pair.icon || '/placeholder.svg'}
                    alt={pair.baseSymbol}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <div className="font-medium">{pair.name}</div>
                  <div className="flex items-center">
                    <div
                      className={`text-xs px-2 py-0.5 rounded ${
                        pair.swing === 'High'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {pair.swing}
                    </div>
                    <div
                      className={`flex items-center justify-end  md:hidden ${
                        pair.change24h > 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {pair.change24h > 0 ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(pair.change24h)}%
                    </div>
                  </div>
                </div>
              </Link>
            </td>
            <td className="text-right py-3">{pair.price}</td>
            <td className="text-right py-3 hidden md:table-cell">
              {pair.marketCap}
            </td>
            <td className="text-right py-3 hidden md:table-cell">
              <div
                className={`flex items-center justify-end ${
                  pair.change24h > 0 ? 'text-success' : 'text-destructive'
                }`}
              >
                {pair.change24h > 0 ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(pair.change24h)}%
              </div>
            </td>
            <td className="text-right py-3 hidden md:table-cell">
              {pair.currentIV}
            </td>

            <td className="text-right py-3 pr-2">
              <Link href={`/token/${pair.id}`}>
                <Button
                  size="sm"
                  variant={pair.change24h > 0 ? 'outline' : 'destructive'}
                  className={`text-xs ${
                    pair.change24h > 0
                      ? 'border-success text-success hover:bg-success/10'
                      : ''
                  }`}
                >
                  Trade
                </Button>
              </Link>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}

function TradingPairsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-[120px]" />
        <Skeleton className="h-4 w-[60px]" />
        <Skeleton className="h-4 w-[100px]" />
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-4 w-[60px]" />
      </div>

      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="flex justify-between items-center py-3 border-b border-border/10"
        >
          <div className="flex items-center">
            <Skeleton className="h-6 w-6 rounded-full mr-2" />
            <div>
              <Skeleton className="h-4 w-[100px] mb-1" />
              <Skeleton className="h-3 w-[40px]" />
            </div>
          </div>
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-8 w-[60px] rounded-md" />
        </div>
      ))}
    </div>
  );
}
