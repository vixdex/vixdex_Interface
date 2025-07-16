'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { fetchPairInitiatedEvents } from '@/lib/fetchEvents';
import { formatUSDNumber } from '@/utils/usdcConverter';

export type TokenInfo = {
  id: string;
  name: string;
  symbol: string;
  priceHigh: string;
  priceLow: string;
  circulation0: string;
  circulation1: string;
  icon0: string;
  icon1: string;
  deriveToken: string;
  marketCap: string | number;
  currentIV: string;
  change24h: number;
  perc?: string | number;
};

interface TradingPairsProps {
  onFetched?: (data: TokenInfo[]) => void;
}

const VIX_ABI = [
  'function getVixData(address poolAdd) view returns (address vixHighToken, address _vixLowToken, uint256 _circulation0, uint256 _circulation1, uint256 _contractHoldings0, uint256 _contractHoldings1, uint256 _reserve0, uint256 _reserve1,uint160 _averageIV,address _poolAddress)',
  'function vixTokensPrice(uint contractHoldings) view returns(uint)',
];

export function TradingPairs({ onFetched }: TradingPairsProps) {
  // In your TradingPairs component
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { wallets } = useWallets();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch events from our API
        console.log('Fetching pair initiated events...');
        const events = await fetchPairInitiatedEvents();
        console.log(`Found ${events.length} events`);

        console.log(events[0].deriveToken);
        if (events.length === 0) {
          setTokens([]);
          setLoading(false);
          return;
        }

        let provider;
        if (wallets.length > 0) {
          const wallet = wallets[0];
          const privyProvider = await wallet.getEthereumProvider();
          provider = new ethers.BrowserProvider(privyProvider);
        } else {
          provider = new ethers.JsonRpcProvider(
            process.env.NEXT_PUBLIC_RPC_URL
          );
        }

        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS!,
          VIX_ABI,
          provider
        );

        // Rest of your existing code remains the same
        // ...

        const result: TokenInfo[] = [];

        for (const event of events) {
          try {
            const deriveToken = event.deriveToken;
            console.log(`Processing derive token: ${deriveToken}`);

            // Get VIX data for this derive token
            const vixData = await contract.getVixData(deriveToken);

            if (!vixData || vixData._poolAddress === ethers.ZeroAddress) {
              console.log(`Skipping ${deriveToken} - no valid pool address`);
              continue;
            }

            const poolAddress = vixData._poolAddress;

            // Assuming all of these return BigNumber
            const token0Price = await contract.vixTokensPrice(
              vixData._contractHoldings0
            );
            const token1Price = await contract.vixTokensPrice(
              vixData._contractHoldings1
            );
            const circulation0 = await contract.vixTokensPrice(
              vixData._circulation0
            );
            const circulation1 = await contract.vixTokensPrice(
              vixData._circulation1
            );

            // Convert all to floating point numbers
            const priceHigh = parseFloat(ethers.formatEther(token0Price));
            const priceLow = parseFloat(ethers.formatEther(token1Price));
            const circ0 = parseFloat(ethers.formatEther(vixData._circulation0));
            const circ1 = parseFloat(ethers.formatEther(vixData._circulation1));
            console.log('circulations: ', circ0, circ1);
            let avgIV = vixData._averageIV; // should be a BigInt
            let bigIntValue = avgIV;
            let scaledDownedIV = Number(bigIntValue) / 1e15;
            console.log(scaledDownedIV);

            let resAvgIV = scaledDownedIV * Math.sqrt(365) * 100;
            console.log(resAvgIV);

            // Multiply as numbers
            const totalValue0 = circ0 * priceHigh;
            const totalValue1 = circ1 * priceLow;
            const totalValue = totalValue0 + totalValue1;
            // Fetch additional data from GeckoTerminal if configured
            let tokenData = {
              name: `Pool ${poolAddress.slice(0, 8)}...`,
              symbol: `${deriveToken.slice(0, 6)}...`,
              icon0: '/placeholder.svg',
              icon1: '/placeholder.svg',
              perc: '',
            };

            if (
              process.env.NEXT_PUBLIC_GEKO_TERMINAL_URL &&
              process.env.NEXT_PUBLIC_NETWORK
            ) {
              try {
                let MockPool_ABI = [
                  'function getRealPoolAddress() external view returns (address)',
                ];

                const mockPoolContract = new ethers.Contract(
                  poolAddress,
                  MockPool_ABI,
                  provider
                );

                const realPoolAddress =
                  await mockPoolContract.getRealPoolAddress();
                console.log('real pool', realPoolAddress);
                const geckoTerminalURL = `${process.env.NEXT_PUBLIC_GEKO_TERMINAL_URL}networks/${process.env.NEXT_PUBLIC_NETWORK}/pools/${realPoolAddress}?include=base_token%2Cquote_token`;
                const res = await fetch(geckoTerminalURL);

                if (res.ok) {
                  const data = await res.json();
                  tokenData = {
                    name: data.data?.attributes?.pool_name || tokenData.name,
                    symbol:
                      data.data?.attributes?.pool_name || tokenData.symbol,
                    icon0:
                      data.included?.[0]?.attributes?.image_url ||
                      tokenData.icon0,
                    icon1:
                      data.included?.[1]?.attributes?.image_url ||
                      tokenData.icon1,
                    perc: data.data?.attributes?.pool_fee_percentage,
                  };
                }
              } catch (geckoError) {
                console.warn('Failed to fetch GeckoTerminal data:', geckoError);
              }
            }

            result.push({
              id: poolAddress,
              name: tokenData.name,
              symbol: tokenData.symbol,
              icon0: tokenData.icon0,
              icon1: tokenData.icon1,
              circulation0: `$${circulation0}`,
              circulation1: `$${circulation1}`,
              priceHigh: `$${priceHigh}`,
              priceLow: `$${priceLow}`,
              deriveToken,
              marketCap: `$${totalValue.toFixed(2)}`, // placeholder - you can calculate this
              currentIV: Math.floor(resAvgIV) + '%', // placeholder - you can calculate this from event.initiatedIV
              change24h: Math.random() > 0.5 ? 2.4 : -1.2, // placeholder
              perc: tokenData.perc, // placeholder
            });

            console.log('dummy :', result);
          } catch (err) {
            console.warn(
              `Skipping pair ${event.deriveToken} due to error:`,
              err
            );
            continue;
          }
        }

        console.log(`Successfully processed ${result.length} trading pairs`);
        setTokens(result);

        // Call the onFetched callback if provided
        if (onFetched) {
          onFetched(result);
        }
      } catch (error) {
        console.error('Error fetching token data:', error);
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch trading pairs'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [wallets, onFetched]);

  if (loading) return <TradingPairsSkeleton />;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No trading pairs found</p>
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="text-xs text-muted-foreground border-b border-border/80">
          <th className="text-left pb-2 pl-2">Derive Name</th>
          <th className="text-right pb-2">High Price</th>
          <th className="text-right pb-2">Low Price</th>
          <th className="text-right pb-2 hidden md:table-cell">Marketcap</th>
          <th className="text-right pb-2 hidden md:table-cell">Current IV</th>
          <th className="text-right pb-2 pr-2">Action</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((pair, index) => (
          <motion.tr
            key={pair.id}
            className="border-b border-border/10 hover:bg-card/80"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <td className="py-3 pl-2">
              <Link href={`/token/${pair.id}`} className="flex items-center">
                <div className="relative w-10 h-6 mr-2">
                  <Image
                    src={pair.icon0}
                    alt={pair.symbol}
                    width={24}
                    height={24}
                    className="rounded-full absolute z-10 border-2 border-background"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <Image
                    src={pair.icon1}
                    alt={pair.symbol}
                    width={24}
                    height={24}
                    className="rounded-full absolute left-3 z-0 border-2 border-background"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </div>

                <div>
                  <div className="font-medium">{pair.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {pair.perc}%
                  </div>
                </div>
              </Link>
            </td>
            <td className="text-right py-3">{pair.priceHigh}</td>
            <td className="text-right py-3">{pair.priceLow}</td>
            <td className="text-right py-3 hidden md:table-cell">
              {pair.marketCap}
            </td>
            <td className="text-right py-3 hidden md:table-cell">
              {pair.currentIV}
            </td>
            <td className="text-right py-3 pr-2">
              <Link href={`/token/${pair.deriveToken}`}>
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
      {[...Array(6)].map((_, i) => (
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
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-4 w-[60px]" />
          <Skeleton className="h-8 w-[60px] rounded-md" />
        </div>
      ))}
    </div>
  );
}
