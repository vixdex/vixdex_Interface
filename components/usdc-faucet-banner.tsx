'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function UsdcFaucetBanner() {
  return (
    <motion.div
      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs py-1 md:px-3"
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mx-2 lg:mx-auto flex items-center justify-between">
        <p className="font-medium">
          Get some USDC faucet to start your trading
        </p>

        <Link href="https://faucet.circle.com/">
          <Button
            variant="secondary"
            size="sm"
            className="h-6 px-2 bg-white/90 text-blue-600 hover:bg-white text-xs"
          >
            Get USDC
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
