'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowBigLeftDash,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Share2,
  Star,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTokenData } from '@/hooks/useTokenData';
import { TradingWidget } from '@/components/trading-widget';
import { ethers } from 'ethers';
import CandlestickChart from '@/components/chart';
import MobileTradingButtons from '@/components/mobile-trading-buttons';
import { UsdcFaucetBanner } from '@/components/usdc-faucet-banner';

interface TokenData {
  id: string;
  name: string;
  symbol: string;
  price: string;
  priceChange24h: string;
  volume24h: string;
  liquidity: string;
  highTokenPrice: string;
  lowTokenPrice: string;
  highTokenAddress: string;
  lowTokenAddress: string;
  highTokenCirculation: string;
  lowTokenCirculation: string;
  highTokenHoldings: string;
  lowTokenHoldings: string;
  highTokenReserves: string;
  lowTokenReserves: string;
  realPoolAddress: string;
  icon0?: string;
  icon1?: string;
  perc?: string;
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

export default function TokenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [selectedPriceType, setSelectedPriceType] = useState<
    'price0' | 'price1'
  >('price0');
  const [token, setToken] = useState<TokenData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get token data using our custom hook
  const { data: tokenData, loading, error: tokenError } = useTokenData(id);

  useEffect(() => {
    const fetchGeckoData = async () => {
      if (!tokenData?.realPoolAddress) {
        console.log('No realPoolAddress available yet');
        return;
      }

      try {
        const geckoTerminalURL = `${process.env.NEXT_PUBLIC_GEKO_TERMINAL_URL}networks/${process.env.NEXT_PUBLIC_NETWORK}/pools/${tokenData.realPoolAddress}?include=base_token%2Cquote_token`;
        console.log('Fetching data from:', geckoTerminalURL);

        const response = await fetch(geckoTerminalURL);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Gecko API Error Response:', errorText);
          throw new Error(
            `Error fetching data: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log('Gecko Terminal Data:', data);

        // Log the full response for debugging
        console.log('Full Gecko API response:', JSON.stringify(data, null, 2));

        // Find base token from included array
        const baseToken = data.included?.find(
          (item: any) =>
            item.type === 'token' &&
            item.id === data.data.relationships.base_token.data.id
        );

        const quoteToken = data.included?.find(
          (item: any) =>
            item.type === 'token' &&
            item.id === data.data.relationships.quote_token?.data.id
        );

        if (!baseToken) {
          console.error('Base token not found in included array');
          throw new Error('Invalid response: Base token data not found');
        }

        console.log('pool_name', data.data.attributes.pool_name);

        console.log('Base Token:', baseToken);
        console.log('Quote Token:', quoteToken);

        // Format token prices with 4 decimal places
        // Convert BigInt to string first to avoid BigInt conversion issues
        const token0Price = parseFloat(
          ethers.formatEther(tokenData.token0Price.toString())
        );
        const token1Price = parseFloat(
          ethers.formatEther(tokenData.token1Price.toString())
        );

        console.log('Token Prices:', { token0Price, token1Price });

        const tokenInfo: TokenData = {
          id,
          name: data.data.attributes.pool_name || 'Unknown Token',
          perc: data.data.attributes.pool_fee_percentage || '0.00',
          symbol: baseToken.attributes.symbol || 'TOKEN',
          price: data.data.attributes.base_token_price_usd
            ? parseFloat(data.data.attributes.base_token_price_usd).toFixed(4)
            : '0.0000',
          priceChange24h: data.data.attributes.price_change_percentage?.h1
            ? parseFloat(
                data.data.attributes.price_change_percentage.h1
              ).toFixed(2)
            : '0.00',
          volume24h: data.data.attributes.volume_usd?.h1
            ? parseFloat(
                data.data.attributes.volume_usd.h1.toString()
              ).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : '0.00',
          liquidity: data.data.attributes.reserve_in_usd
            ? parseFloat(
                data.data.attributes.reserve_in_usd.toString()
              ).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : '0.00',
          highTokenPrice: token0Price.toLocaleString('en-US', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          }),
          lowTokenPrice: token1Price.toLocaleString('en-US', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4,
          }),
          highTokenAddress: tokenData.vixData.vixHighToken,
          lowTokenAddress: tokenData.vixData._vixLowToken,
          highTokenCirculation: parseFloat(
            ethers.formatEther(tokenData.vixData._circulation0.toString())
          ).toLocaleString('en-US', { maximumFractionDigits: 4 }),
          lowTokenCirculation: parseFloat(
            ethers.formatEther(tokenData.vixData._circulation1.toString())
          ).toLocaleString('en-US', { maximumFractionDigits: 4 }),
          highTokenHoldings: parseFloat(
            ethers.formatEther(tokenData.vixData._contractHoldings0.toString())
          ).toLocaleString('en-US', { maximumFractionDigits: 4 }),
          lowTokenHoldings: parseFloat(
            ethers.formatEther(tokenData.vixData._contractHoldings1.toString())
          ).toLocaleString('en-US', { maximumFractionDigits: 4 }),
          highTokenReserves: parseFloat(
            ethers.formatEther(tokenData.vixData._reserve0.toString())
          ).toLocaleString('en-US', { maximumFractionDigits: 4 }),
          lowTokenReserves: parseFloat(
            ethers.formatEther(tokenData.vixData._reserve1.toString())
          ).toLocaleString('en-US', { maximumFractionDigits: 4 }),
          realPoolAddress: tokenData.realPoolAddress,
          icon0: baseToken.attributes.image_url,
          icon1: quoteToken?.attributes.image_url,
        };

        setToken(tokenInfo);
        console.log(tokenInfo);
      } catch (err) {
        console.error('Error fetching Gecko data:', err);
        setError('Failed to fetch token data. Please try again later.');
      }
    };

    fetchGeckoData();
  }, [tokenData, id]);

  // Calculate displayed price based on selected type
  const displayedPrice = token
    ? selectedPriceType === 'price0'
      ? token.highTokenPrice
      : token.lowTokenPrice
    : '0.0000';

  // Update the token's price without causing re-renders
  useEffect(() => {
    if (token) {
      setToken((prev) => ({
        ...prev,
        price:
          selectedPriceType === 'price0'
            ? prev.highTokenPrice
            : prev.lowTokenPrice,
      }));
    }
  }, [selectedPriceType, token?.highTokenPrice, token?.lowTokenPrice]);

  if (loading || !token) {
    return (
      <div className="container py-6">
        <TokenDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6 text-center">
        <div className="text-destructive">{error}</div>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <UsdcFaucetBanner />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative max-w-7xl">
        {loading ? (
          <TokenDetailSkeleton />
        ) : (
          <>
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(0,128,128,0.15)] bg-[length:200%_100%] animate-pulse pointer-events-none" />

            {/* Back button */}
            <div className="relative z-10">
              <Link href="/" className="inline-flex items-center gap-2 group">
                <motion.div
                  className="text-[#4ade80] hover:text-[#4ade80]/90 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <ArrowBigLeftDash className="h-4 w-4" />
                </motion.div>
                <motion.span
                  className="text-[#4ade80] hover:text-[#4ade80]/90 text-sm font-medium transition-colors"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  back to home
                </motion.span>
              </Link>
            </div>

            {/* Token header */}
            <motion.div
              className="relative z-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-8 flex-shrink-0">
                    <div className="absolute inset-0 flex items-center">
                      <img
                        src={
                          token.icon0?.startsWith('http')
                            ? token.icon0
                            : '/api/placeholder/24/24'
                        }
                        alt={token.symbol}
                        className="w-6 h-6 rounded-full border-2 border-background z-10 relative"
                      />
                      <img
                        src={
                          token.icon1?.startsWith('http')
                            ? token.icon1
                            : '/api/placeholder/24/24'
                        }
                        alt={token.symbol}
                        className="w-6 h-6 rounded-full border-2 border-background -ml-2"
                      />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">
                      {token.name}
                      <span className="text-xs ml-2 text-muted-foreground">
                        {token.perc}%
                      </span>
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                        {selectedPriceType === 'price0' ? 'HIGH' : 'LOW'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Main content grid */}
            <motion.div
              className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Chart card */}
              <Card className="col-span-1 lg:col-span-2">
                <CardContent className="p-4 sm:p-6">
                  {/* Price header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                    <div className="flex-1">
                      <div className="text-2xl sm:text-3xl font-bold mb-2">
                        $
                        {selectedPriceType === 'price0'
                          ? token.highTokenPrice
                          : token.lowTokenPrice}
                      </div>
                      <div
                        className={`flex items-center text-sm ${
                          !token.priceChange24h.startsWith('-')
                            ? 'text-success'
                            : 'text-destructive'
                        }`}
                      >
                        {!token.priceChange24h.startsWith('-') ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        )}
                        {token.priceChange24h.replace('-', '')}%
                      </div>
                    </div>

                    {/* Price type buttons */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={
                          selectedPriceType === 'price0' ? 'default' : 'outline'
                        }
                        onClick={() => setSelectedPriceType('price0')}
                        className="flex-1 sm:w-20"
                      >
                        High
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          selectedPriceType === 'price1' ? 'default' : 'outline'
                        }
                        onClick={() => setSelectedPriceType('price1')}
                        className="flex-1 sm:w-20"
                      >
                        Low
                      </Button>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="mb-6">
                    <CandlestickChart
                      networkId=""
                      poolId={id}
                      priceType={selectedPriceType}
                      height={200}
                    />
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        Current Volatility
                      </div>
                      <div className="text-sm font-medium text-success flex items-center justify-center gap-1">
                        <Activity className="h-3 w-3" />
                        {token.volume24h || 'N/A'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        Average IV
                      </div>
                      <div className="text-sm font-medium text-success">
                        {token.volume24h || 'N/A'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        Market Cap
                      </div>
                      <div className="text-sm font-medium text-success">
                        {token.liquidity || 'N/A'}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        24hrs Changes
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          !token.priceChange24h.startsWith('-')
                            ? 'text-success'
                            : 'text-destructive'
                        }`}
                      >
                        {token.priceChange24h}%
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        Volume
                      </div>
                      <div className="text-sm font-medium text-success">
                        {token.volume24h || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trading widget */}
              <div className="hidden lg:block">
                <TradingWidget
                  highTokenAdd={token.highTokenAddress}
                  lowTokenAdd={token.lowTokenAddress}
                  poolAdd={id}
                />
              </div>
            </motion.div>

            {/* Bottom section */}
            <motion.div
              className="relative z-10 grid gap-6 grid-cols-1 lg:grid-cols-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {/* Links card */}
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg font-medium mb-4">Links</h3>
                  <div className="space-y-3">
                    <Link
                      href={`https://basescan.org/token/${token.highTokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors group"
                    >
                      <div className="w-6 h-6 flex-shrink-0">
                        <img
                          src={token.icon0 || '/api/placeholder/24/24'}
                          alt={`${token.symbol} HIGH`}
                          className="w-full h-full rounded-full"
                        />
                      </div>
                      <span className="flex-1 truncate">
                        {token.symbol}/USDC HIGH TOKEN
                      </span>
                      <ExternalLink className="h-3 w-3  group-hover:opacity-100 transition-opacity" />
                    </Link>

                    <Link
                      href={`https://basescan.org/token/${token.lowTokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm hover:text-primary transition-colors group"
                    >
                      <div className="w-6 h-6 flex-shrink-0">
                        <img
                          src={token.icon1 || '/api/placeholder/24/24'}
                          alt={`${token.symbol} LOW`}
                          className="w-full h-full rounded-full"
                        />
                      </div>
                      <span className="flex-1 truncate">
                        {token.symbol}/USDC LOW TOKEN
                      </span>
                      <ExternalLink className="h-3 w-3  group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Transactions card */}
              <Card className="lg:col-span-2">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-lg font-medium mb-4">Transactions</h3>
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="mb-4">
                      <BarChart3 className="h-12 w-12 mx-auto opacity-50" />
                    </div>
                    <p className="text-base">No recent transactions</p>
                    <p className="text-sm mt-2">
                      Transactions will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Mobile trading widget */}
            <div className="lg:hidden relative z-10">
              <TradingWidget
                highTokenAdd={token.highTokenAddress}
                lowTokenAdd={token.lowTokenAddress}
                poolAdd={id}
              />
            </div>

            {/* Mobile fixed buttons */}
            <MobileTradingButtons />
          </>
        )}
      </div>
    </div>
  );
}
