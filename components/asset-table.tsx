'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

interface AssetTableProps {
  showDerive?: boolean;
}

interface Asset {
  id: string;
  name: string;
  symbol: string;
  type: string;
  hBalance: string;
  lBalance: string;
  hPrice: string;
  lPrice: string;
  icon: string;
}

export function AssetTable() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch
    const fetchAssets = async () => {
      // In a real app, this would be an API call
      setTimeout(() => {
        setAssets([
          {
            id: '1',
            name: 'SHIB/USDC',
            symbol: 'SHIB',
            type: 'HIGH',
            hBalance: '2342345',
            lBalance: '2342345',
            hPrice: '0.00000235',
            lPrice: '0.00000235',

            icon: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
          },
          {
            id: '2',
            name: 'SHIB/USDC',
            symbol: 'SHIB',
            type: 'LOW',
            hBalance: '-',
            lBalance: '2342345',
            hPrice: '0.00000235',
            lPrice: '0.00000235',

            icon: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
          },
          {
            id: '3',
            name: 'SHIB/USDC',
            symbol: 'SHIB',
            type: 'HIGH',
            hBalance: '2342345',
            lBalance: '-',
            hPrice: '0.00000235',
            lPrice: '0.00000235',

            icon: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
          },
          {
            id: '4',
            name: 'SHIB/USDC',
            symbol: 'SHIB',
            type: 'LOW',
            hBalance: '-',
            lBalance: '2342345',
            hPrice: '0.00000235',
            lPrice: '0.00000235',

            icon: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
          },
        ]);
        setLoading(false);
      }, 1500);
    };

    fetchAssets();
  }, []);

  if (loading) {
    return <AssetTableSkeleton />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-xs text-muted-foreground">
            <th className="text-left pb-2">Assets</th>
            <th className="text-right pb-2">H-Balance</th>
            <th className="text-right pb-2">L-Balance</th>
            <th className="text-right pb-2">H-Price</th>
            <th className="text-right pb-2">L-Price</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset, index) => (
            <motion.tr
              key={asset.id}
              className="border-t border-border/20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <td className="py-3">
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-2 relative">
                    <Image
                      src={asset.icon || '/placeholder.svg'}
                      alt={asset.symbol}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        asset.type === 'HIGH'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-yellow-200 text-yellow-800'
                      }`}
                    >
                      {asset.type}
                    </span>
                  </div>
                </div>
              </td>
              <td className="text-right py-3">{asset.hBalance}</td>
              <td className="text-right py-3">{asset.lBalance}</td>
              <td className="text-right py-3">{asset.hPrice}</td>
              <td className="text-right py-3">{asset.lPrice}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AssetTableSkeleton() {
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
