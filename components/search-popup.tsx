'use client';

import type React from 'react';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Search, Clock, TrendingUp, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface Token {
  id: string;
  name: string;
  symbol: string;
  address?: string;
  icon: string;
  badge?: {
    color: string;
    icon: React.ReactNode;
  };
}

export function SearchPopup({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<Token[]>([
    {
      id: 'vdot1',
      name: 'Voucher DOT',
      symbol: 'VDOT',
      address: '0xBC33...7Fe5',
      icon: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
      badge: {
        color: 'bg-yellow-500',
        icon: (
          <div className="w-3 h-3 bg-yellow-500 rounded-sm flex items-center justify-center">
            <span className="text-[8px] text-black font-bold">$</span>
          </div>
        ),
      },
    },
    {
      id: 'vdot2',
      name: 'Voucher DOT',
      symbol: 'VDOT',
      address: '0xBC33...7Fe5',
      icon: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
      badge: {
        color: 'bg-blue-500',
        icon: (
          <div className="w-3 h-3 bg-blue-500 rounded-sm flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">P</span>
          </div>
        ),
      },
    },
    {
      id: 'vdot3',
      name: 'Voucher DOT',
      symbol: 'VDOT',
      address: '0xBC33...7Fe5',
      icon: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png',
      badge: {
        color: 'bg-blue-600',
        icon: (
          <div className="w-3 h-3 bg-blue-600 rounded-sm flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">S</span>
          </div>
        ),
      },
    },
  ]);

  const [popularTokens, setPopularTokens] = useState<Token[]>([
    {
      id: 'eth',
      name: 'Ethereum',
      symbol: 'ETH',
      icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
    },
    {
      id: 'usdc',
      name: 'USD Coin (USDC)',
      symbol: 'USDC',
      address: '0xA0b8...eB48',
      icon: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    },
    {
      id: 'usdt',
      name: 'Tether (USDT)',
      symbol: 'USDT',
      address: '0x55d3...7955',
      icon: 'https://assets.coingecko.com/coins/images/325/large/Tether.png',
      badge: {
        color: 'bg-yellow-500',
        icon: (
          <div className="w-3 h-3 bg-yellow-500 rounded-sm flex items-center justify-center">
            <span className="text-[8px] text-black font-bold">$</span>
          </div>
        ),
      },
    },
  ]);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={searchRef}
            className="w-full max-w-xl bg-[#1a1a1a] rounded-lg overflow-hidden shadow-xl"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <Search className="text-gray-400 w-5 h-5" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search tokens"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none text-white text-lg focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="p-4 border-b border-gray-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-lg">Recent searches</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearRecentSearches}
                      className="text-gray-400 hover:text-white"
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {recentSearches.map((token) => (
                      <div
                        key={token.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                              <Image
                                src={token.icon || '/placeholder.svg'}
                                alt={token.name}
                                width={40}
                                height={40}
                                className="object-contain"
                              />
                            </div>
                            {token.badge && (
                              <div className="absolute -bottom-1 -right-1">
                                {token.badge.icon}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {token.name}
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <span>{token.symbol}</span>
                              {token.address && <span>{token.address}</span>}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular tokens */}
              <div className="p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-3">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-lg">Tokens by 24H volume</span>
                </div>

                <div className="space-y-3">
                  {popularTokens.map((token) => (
                    <div
                      key={token.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800">
                            <Image
                              src={token.icon || '/placeholder.svg'}
                              alt={token.name}
                              width={40}
                              height={40}
                              className="object-contain"
                            />
                          </div>
                          {token.badge && (
                            <div className="absolute -bottom-1 -right-1">
                              {token.badge.icon}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {token.name}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <span>{token.symbol}</span>
                            {token.address && <span>{token.address}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
