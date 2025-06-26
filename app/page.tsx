'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TradingPairs, TokenInfo } from '@/components/trading-pairs';
import Link from 'next/link';

export default function TradePage() {
  const [tradingPairs, setTradingPairs] = useState<TokenInfo[]>([]);
  const [filteredPairs, setFilteredPairs] = useState<TokenInfo[]>([]);
  const [poolFilter, setPoolFilter] = useState('pools');
  const [sortBy, setSortBy] = useState('market');
  const [timeframe, setTimeframe] = useState('24h');
  const [priceFilter, setPriceFilter] = useState('high');

  const handleDataFetched = useCallback((data: TokenInfo[]) => {
    setTradingPairs(data);
    setFilteredPairs(data);
  }, []);

  const handlePoolFilterChange = useCallback((value: string) => {
    setPoolFilter(value);
    // Apply filter logic here
    let filtered = [...tradingPairs];
    
    switch (value) {
      case 'trending':
        filtered = filtered.filter(pair => pair.change24h > 5);
        break;
      case 'new':
        filtered = filtered.sort((a, b) => b.id.localeCompare(a.id));
        break;
      default:
        filtered = tradingPairs;
    }
    
    setFilteredPairs(filtered);
  }, [tradingPairs]);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    let sorted = [...filteredPairs];
    
    switch (value) {
      case 'volume':
        sorted = sorted.sort((a, b) => parseFloat(b.marketCap) - parseFloat(a.marketCap));
        break;
      case 'price':
        sorted = sorted.sort((a, b) => 
          parseFloat(b.priceHigh.replace('$', '')) - parseFloat(a.priceHigh.replace('$', ''))
        );
        break;
      default: // market cap
        sorted = sorted.sort((a, b) => parseFloat(b.marketCap) - parseFloat(a.marketCap));
    }
    
    setFilteredPairs(sorted);
  }, [filteredPairs]);

  return (
    <div className="container py-6 space-y-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(0,128,128,0.15)] bg-[length:200%_100%] animate-gradient-x pointer-events-none" />

      {/* <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="hidden md:block"
      >
        <div className="flex justify-between items-center m-4">
          <h1 className="text-xl font-bold mb-4">Top-Notch ⚡</h1>
          <Link
            href="/create-derive"
            className="text-sm font-medium text-[#4ade80] transition-colors hover:text-[#4ade80]/80"
          >
            <Button className="w-full md:w-auto">create derive</Button>
          </Link>
        </div>
      </motion.div> */}

      <motion.div
        className="flex flex-wrap md:flex-nowrap gap-4 mb-6 items-start md:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Select value={poolFilter} onValueChange={handlePoolFilterChange}>
          <SelectTrigger className="w-full md:w-[120px]">
            <SelectValue placeholder="All Pools" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pools">All Pools</SelectItem>
            <SelectItem value="trending">Trending</SelectItem>
            <SelectItem value="new">New</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-row md:flex-nowrap gap-2 md:ml-auto w-full md:w-auto">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="md:w-[120px]">
              <SelectValue placeholder="Market Cap" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">Market Cap</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="md:w-[100px]">
              <SelectValue placeholder="24H Change" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24H Change</SelectItem>
              <SelectItem value="7d">7D Change</SelectItem>
              <SelectItem value="30d">30D Change</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="md:w-[100px]">
              <SelectValue placeholder="High/Low" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Link
          href="/create-derive"
          className="text-sm font-medium text-[#4ade80] w-full md:hidden transition-colors hover:text-[#4ade80]/80"
        >
          <Button className="w-full md:w-auto">create derive</Button>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <TradingPairs onFetched={handleDataFetched} />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Section */}
      {tradingPairs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{tradingPairs.length}</div>
              <div className="text-sm text-muted-foreground">Total Pairs</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {tradingPairs.filter(p => p.change24h > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Gaining</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {tradingPairs.filter(p => p.change24h < 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Losing</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">
                {(tradingPairs.reduce((acc, p) => acc + Math.abs(p.change24h), 0) / tradingPairs.length).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Change</div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}