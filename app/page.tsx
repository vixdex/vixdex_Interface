'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TradingPairs } from '@/components/trading-pairs';
import Link from 'next/link';

export default function TradePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container py-6 space-y-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(0,128,128,0.15)] bg-[length:200%_100%] animate-gradient-x pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xl font-bold mb-4">Top-Notch ⚡</h1>

        {/* Mobile scrollable container */}
        <div className="md:hidden w-full overflow-x-auto pb-4 -mx-2 px-2">
          <div className="flex gap-4 min-w-max">
            {loading ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="bg-card/50 w-[200px] flex-shrink-0">
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-[100px] mb-2" />
                      <Skeleton className="h-6 w-[80px] mb-1" />
                      <Skeleton className="h-4 w-[120px]" />
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="w-[200px] flex-shrink-0"
                  >
                    <Card className="bg-card/50 h-full">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm">BTC-Volatility</span>
                        </div>
                        <div className="text-xl font-bold">$0.0527</div>
                        <div className="flex items-center text-xs">
                          <span className="text-success mr-2">+1.4%</span>
                          <span className="text-muted-foreground">
                            VOL: 124M
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Desktop grid layout */}
        <div className="hidden md:grid grid-cols-4 gap-4 mb-6">
          {loading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card/50">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-[100px] mb-2" />
                    <Skeleton className="h-6 w-[80px] mb-1" />
                    <Skeleton className="h-4 w-[120px]" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <>
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                >
                  <Card className="bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">BTC-Volatility</span>
                      </div>
                      <div className="text-xl font-bold">$0.0527</div>
                      <div className="flex items-center text-xs">
                        <span className="text-success mr-2">+1.4%</span>
                        <span className="text-muted-foreground">VOL: 124M</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </>
          )}
        </div>
      </motion.div>

      <motion.div
        className="flex flex-wrap gap-4 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Button variant="outline" size="sm" className="rounded-full">
          All Pools <ChevronDown className="ml-1 h-4 w-4" />
        </Button>

        <div className="ml-auto flex gap-2">
          <Link
            href="/create-derive"
            className="text-sm font-medium text-[#4ade80] transition-colors hover:text-[#4ade80]/80"
          >
            <Button> create derive</Button>
          </Link>
          <Select defaultValue="market">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Market Cap" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">Market Cap</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="24h">
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="24H Change" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24H Change</SelectItem>
              <SelectItem value="7d">7D Change</SelectItem>
              <SelectItem value="30d">30D Change</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-card/50">
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <TradingPairs loading={loading} />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
