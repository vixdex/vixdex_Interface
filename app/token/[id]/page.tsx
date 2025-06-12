'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowBigLeftDashIcon,
  ArrowDown,
  ArrowUp,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionTable } from '@/components/transaction-table';
import { TradingWidget } from '@/components/trading-widget';
import CandlestickChart from '@/components/chart';
import { MobileTradingButtons } from '@/components/mobile-trading-buttons';

export default function TokenPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<any>(null);
  const [selectedPriceType, setSelectedPriceType] = useState<'price0' | 'price1'>('price0');

  // Parse the combined parameter to extract networkId and poolId
  const parseTokenId = (id: string): { networkId: string; poolId: string } | null => {
    const parts = id.split('-');
    if (parts.length < 2) {
      console.error('Invalid token ID format. Expected format: networkId-poolAddress');
      return null;
    }
    const networkId = parts[0];
    const poolId = parts.slice(1).join('-');
    
    return { networkId, poolId };
  };

  // Extract networkId and poolId from the URL parameter
  const parsedParams = parseTokenId(params.id);
  
  if (!parsedParams) {
    // Handle invalid URL format
    return (
      <div className="container py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">Invalid URL Format</h1>
          <p className="text-muted-foreground mt-2">
            Expected format: /tokens/networkId-poolAddress
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Example: /tokens/1-0x123abc456def789012345678901234567890abcd
          </p>
          <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const { networkId, poolId } = parsedParams;

  // Network name mapping for display
  const networkNames: Record<string, string> = {
    '1': 'Ethereum',
    '137': 'Polygon', 
    '42161': 'Arbitrum',
    '10': 'Optimism',
    '56': 'BSC'
  };

  useEffect(() => {
    const fetchTokenDetails = async () => {
      setLoading(true);
      setTimeout(() => {
        setToken({
          id: poolId,
          networkId: networkId,
          networkName: networkNames[networkId] || `Network ${networkId}`,
          name: 'VOLATILITY TOKEN',
          symbol: 'VPT',
          price: '0.00000235',
          change24h: 2.4,
          marketCap: '26.1%',
          averageIV: '-40.1%',
          volume: '261%',
          icon: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png',
        });
        setLoading(false);
      }, 1500);
    };

    fetchTokenDetails();
  }, [networkId, poolId]);

  return (
    <div className="container py-6 space-y-6 relative">
      {loading ? (
        <TokenDetailSkeleton />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(0,128,128,0.15)] bg-[length:200%_100%] animate-gradient-x pointer-events-none" />
          <Link href="/" className="flex items-center ">
            <motion.div className="text-[#4ade80] hover:text-[#4ade80]/90 text-sm" whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
              <ArrowBigLeftDashIcon />
            </motion.div>
            <motion.div className="text-[#4ade80] hover:text-[#4ade80]/90 text-sm" whileHover={{ scale: 1.05 }} transition={{ type: 'spring', stiffness: 400, damping: 10 }}>
              <span>back to home</span>
            </motion.div>
          </Link>
          <motion.div className="flex items-center gap-2 mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-8 h-8 relative">
              <Image src={token.icon || '/placeholder.svg'} alt={token.symbol} width={32} height={32} className="rounded-full" />
            </div>
            <h1 className="text-xl font-bold">{token.name}</h1>
            {/* Network badge */}
            <div className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
              {token.networkName}
            </div>
            {/* Price type badge */}
            <div className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
              {selectedPriceType === 'price0' ? 'HIGH' : 'LOW'}
            </div>
          </motion.div>
          <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="col-span-1 lg:col-span-2 bg-card/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-3xl font-bold">{token.price}</div>
                    <div className={`flex items-center text-sm ${token.change24h > 0 ? 'text-success' : 'text-destructive'}`}>
                      {token.change24h > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                      {Math.abs(token.change24h)}%
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={selectedPriceType === 'price0' ? 'default' : 'outline'}
                      onClick={() => setSelectedPriceType('price0')}
                      className="w-20 h-8"
                    >
                      High
                    </Button>
                    <Button
                      size="sm"
                      variant={selectedPriceType === 'price1' ? 'default' : 'outline'}
                      onClick={() => setSelectedPriceType('price1')}
                      className="w-20 h-8"
                    >
                      Low
                    </Button>
                  </div>
                </div>

                {/* CandlestickChart receives the parsed networkId and poolId */}
                <CandlestickChart
                  networkId={networkId} 
                  poolId={poolId}        
                  priceType={selectedPriceType}
                  height={250}
                />

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Current Volatility</div>
                    <div className={`text-sm font-medium ${Number.parseFloat(token.marketCap) > 0 ? 'text-success' : 'text-destructive'}`}>
                      {token.marketCap}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Average IV</div>
                    <div className={`text-sm font-medium ${Number.parseFloat(token.averageIV) > 0 ? 'text-success' : 'text-destructive'}`}>
                      {token.averageIV}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Market Cap</div>
                    <div className={`text-sm font-medium ${Number.parseFloat(token.marketCap) > 0 ? 'text-success' : 'text-destructive'}`}>
                      {token.marketCap}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">24hrs Changes</div>
                    <div className={`text-sm font-medium ${Number.parseFloat(token.marketCap) > 0 ? 'text-success' : 'text-destructive'}`}>
                      {token.marketCap}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Volume</div>
                    <div className={`text-sm font-medium ${Number.parseFloat(token.volume) > 0 ? 'text-success' : 'text-destructive'}`}>
                      {token.volume}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <TradingWidget />
          </motion.div>
          <motion.div className="grid gap-6 grid-cols-1 lg:grid-cols-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">Links</h3>
                <div className="space-y-3">
                  <Link href="#" className="flex items-center gap-2 text-sm hover:text-primary">
                    <div className="w-6 h-6 relative">
                      <Image src={token.icon || '/placeholder.svg'} alt={token.symbol} width={24} height={24} className="rounded-full" />
                    </div>
                    <span>HIGH TOKEN</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Link>
                  <Link href="#" className="flex items-center gap-2 text-sm hover:text-primary">
                    <div className="w-6 h-6 relative">
                      <Image src={token.icon || '/placeholder.svg'} alt={token.symbol} width={24} height={24} className="rounded-full" />
                    </div>
                    <span>LOW TOKEN</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Link>
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2 bg-card/50">
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">Transactions</h3>
                <TransactionTable />
              </CardContent>
            </Card>
          </motion.div>
          <MobileTradingButtons />
        </>
      )}  
    </div>
  );
}
function TokenDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-[200px]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 bg-card/50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <Skeleton className="h-8 w-[100px] mb-2" />
                <Skeleton className="h-4 w-[60px]" />
              </div>

              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>

            <Skeleton className="h-[200px] w-full mb-6" />

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-3 w-[80px] mx-auto mb-2" />
                  <Skeleton className="h-4 w-[40px] mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4">
            <Skeleton className="h-6 w-[100px] mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-5 w-[100px]" />
                <Skeleton className="h-5 w-[80px]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <Skeleton className="h-6 w-[80px] mb-4" />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-[180px]" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-[160px]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-card/50">
          <CardContent className="p-4">
            <Skeleton className="h-6 w-[120px] mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[60px]" />
                  <Skeleton className="h-4 w-[60px]" />
                  <Skeleton className="h-4 w-[60px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
