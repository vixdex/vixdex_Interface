'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { SearchPopup } from './search-popup';

export default function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openSearch = () => {
    setIsSearchOpen(true);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
  };
  return (
    <>
      <motion.header
        className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container flex h-14 items-center justify-between gap-4">
          {/* Left Section */}
          <div className="flex-1">
            <Link href="/" className="flex items-center">
              <motion.div
                className="retro-text text-4xl font-bold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                VixDex
              </motion.div>
            </Link>
          </div>

          {/* Center Search */}
          <div className="flex-1 max-w-sm relative  hidden md:block">
            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="search tokens"
              className="w-full bg-background pl-8 rounded-full border border-input"
              onClick={openSearch}
              readOnly
            />
          </div>

          {/* Right Section */}
          <div className="flex-1 flex justify-end">
            <Link href="/profile">
              <Button size="sm">Connect Wallet</Button>
            </Link>
          </div>
        </div>
      </motion.header>
      <SearchPopup isOpen={isSearchOpen} onClose={closeSearch} />
    </>
  );
}
