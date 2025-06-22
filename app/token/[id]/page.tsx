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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PriceChart } from '@/components/price-chart';
import { TransactionTable } from '@/components/transaction-table';
import { TradingWidget } from '@/components/trading-widget';
import Chart from '@/components/chart';
import CandlestickChart from '@/components/chart';
import { MobileTradingButtons } from '@/components/mobile-trading-buttons';
import { ethers } from 'ethers';
  import { useWallets } from '@privy-io/react-auth';
import axios from 'axios';

const initialChartData = Array.from({ length: 60 }, (_, i) => ({
  time: Math.floor(Date.now() / 1000) - (60 - i) * 60,
  value: 0.05 + Math.random() * 0.01,
}));

const mockPairs = [
  { pair: 'BTC-VOL/USDT', price: 0.0523 },
  { pair: 'ETH-VOL/USDT', price: 0.0345 },
  { pair: 'XRP-VOL/USDT', price: 0.0123 },
];

export default function TokenPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<any>(null);
  const [chartData, setChartData] = useState(initialChartData);
  const [chartTimeFrame, setChartTimeFrame] = useState('1m');
  const [selectedPair, setSelectedPair] = useState(mockPairs[0].pair);
  let { wallets } = useWallets();
  useEffect(() => {
    const fetchToken = async () => {
      if (wallets.length === 0) {
        console.warn('No wallets connected yet.');
        return;
      }

      const wallet = wallets[0];
      if (!wallet?.getEthereumProvider) {
        console.error('Wallet does not support getEthereumProvider');
        return;
      }

      console.log('Using wallet:', wallet);

      const privyProvider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(privyProvider);
      const signer = await ethersProvider.getSigner();

      const VIX_CONTRACT_ABI = [
  'function getVixData(address poolAdd) view returns (address vixHighToken, address _vixLowToken, uint256 _circulation0, uint256 _circulation1, uint256 _contractHoldings0, uint256 _contractHoldings1, uint256 _reserve0, uint256 _reserve1, address _poolAddress)',
  'function vixTokensPrice(uint contractHoldings) view returns(uint)'
];
      const vixContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS!,
          VIX_CONTRACT_ABI,
          signer
        );
        const vixData = await vixContract.getVixData(params.id);
      console.log('VIX Data:', vixData);
      console.log('VIX High Token:', vixData.vixHighToken);
      const geckoTerminalURL = `${process.env.NEXT_PUBLIC_GEKO_TERMINAL_URL}networks/${process.env.NEXT_PUBLIC_NETWORK}/pools/${params.id}?include=quote_token`;
      console.log('Fetching data from:', geckoTerminalURL);
      const response = await fetch(geckoTerminalURL);

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(data);
      // Simulated token data; replace with contract call
      let token0Price = await vixContract.vixTokensPrice(vixData._contractHoldings0);
      let token1Price = await vixContract.vixTokensPrice(vixData._contractHoldings1);
      console.log('Token0 Price:', token0Price);
      console.log('Token1 Price:', token1Price);
      let highTokenPrice = ethers.formatEther(token0Price);
      let lowTokenPrice = ethers.formatEther(token1Price);  
      console.log('High Token Price:', highTokenPrice);
      console.log('Low Token Price:', lowTokenPrice);
      setToken({
        id: params.id,
        name: data.data.attributes.name,
        symbol: data.data.attributes.pool_name,
        price: highTokenPrice+"$",
        change24h: 2.4,
        marketCap: '200k$',
        averageIV: '40.1%',
        volume: '12M$',
        icon: data.included[0].attributes.image_url,
      });

      setLoading(false);
    };

    fetchToken();
  }, [wallets, params.id]);

  return (
    <div className="container  py-6 space-y-6 relative ">
      {loading ? (
        <TokenDetailSkeleton />
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(0,128,128,0.15)] bg-[length:200%_100%] animate-gradient-x pointer-events-none" />{' '}
          <Link href="/" className="flex items-center ">
            <motion.div
              className="text-[#4ade80] hover:text-[#4ade80]/90 text-sm"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <ArrowBigLeftDashIcon />
            </motion.div>
            <motion.div
              className=" text-[#4ade80] hover:text-[#4ade80]/90 text-sm"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <span>back to home</span>
            </motion.div>
          </Link>
          <motion.div
            className="flex items-center gap-2 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-8 h-8 relative">
              <Image
                src={token.icon || '/placeholder.svg'}
                alt={token.symbol}
                width={32}
                height={32}
                className="rounded-full"
              />
            </div>
            <h1 className="text-xl font-bold">{token.name}</h1>
            <div className="text-xs bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded">
              HIGH
            </div>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 "
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="col-span-1 lg:col-span-2 bg-card/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-3xl font-bold">{token.price}</div>
                    <div
                      className={`flex items-center text-sm ${
                        token.change24h > 0
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      {token.change24h > 0 ? (
                        <ArrowUp className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(token.change24h)}%
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-16 h-8 bg-secondary/50"
                      >
                        High
                      </Button>
                    </div>

                    <div className="flex flex-col items-center">
                      <Button size="sm" variant="outline" className="w-16 h-8">
                        Low
                      </Button>
                    </div>
                  </div>
                </div>

                <CandlestickChart width={750} height={250} />

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      Current Volatility
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        Number.parseFloat(token.marketCap) > 0
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      {token.marketCap}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      Average IV
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        Number.parseFloat(token.averageIV) > 0
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      {token.averageIV}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      Market Cap
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        Number.parseFloat(token.marketCap) > 0
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      {token.marketCap}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">
                      24hrs Changes
                    </div>
                    <div
                      className={`text-sm font-medium ${
                        Number.parseFloat(token.marketCap) > 0
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      {token.marketCap}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Volume</div>
                    <div
                      className={`text-sm font-medium ${
                        Number.parseFloat(token.volume) > 0
                          ? 'text-success'
                          : 'text-destructive'
                      }`}
                    >
                      {token.volume}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <TradingWidget />
          </motion.div>
          <motion.div
            className="grid gap-6 grid-cols-1 lg:grid-cols-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <h3 className="text-lg font-medium mb-4">Links</h3>
                <div className="space-y-3">
                  <Link
                    href="#"
                    className="flex items-center gap-2 text-sm hover:text-primary"
                  >
                    <div className="w-6 h-6 relative">
                      <Image
                        src={token.icon || '/placeholder.svg'}
                        alt={token.symbol}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    </div>
                    <span>SHIB/USDC HIGH TOKEN</span>
                    <ExternalLink className="h-3 w-3 ml-auto" />
                  </Link>

                  <Link
                    href="#"
                    className="flex items-center gap-2 text-sm hover:text-primary"
                  >
                    <div className="w-6 h-6 relative">
                      <Image
                        src={token.icon || '/placeholder.svg'}
                        alt={token.symbol}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    </div>
                    <span>SHIB/USDC LOW TOKEN</span>
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
