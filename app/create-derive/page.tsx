'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { ArrowBigLeftDashIcon } from 'lucide-react';
import Image from 'next/image';
import logo from '../../public/vixdex_background_remove.png';

export default function CreateDerivePage() {
  const [poolAddress, setPoolAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreatePool = async () => {
    if (!poolAddress.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a pool address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: 'Success',
        description: 'Pool created successfully!',
      });
      setPoolAddress('');
    }, 2000);
  };

  return (
    <div className="relative h-90">
      {/* Green gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(0,128,128,0.15)] pointer-events-none" />

      <Link href="/" className="flex items-center m-4">
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

      <div className="container py-6 flex items-center justify-center min-h-[80vh] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="bg-[#1a1a1a] border-gray-800">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-[#1a1a1a] border border-gray-700 rounded flex items-center justify-center">
                  <Image src={logo} alt="logo" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">
                Create Derive
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="pool-address" className="text-white">
                  Pool Address
                </Label>
                <Input
                  id="pool-address"
                  type="text"
                  placeholder="paste pool address"
                  value={poolAddress}
                  onChange={(e) => setPoolAddress(e.target.value)}
                  className="bg-[#2a2a2a] border-gray-700 text-white h-14"
                />
              </div>

              <Button
                onClick={handleCreatePool}
                disabled={isLoading}
                className="w-full h-14 bg-transparent hover:bg-[#2a2a2a] text-[#4ade80] border border-[#4ade80] hover:text-[#4ade80]"
              >
                {isLoading ? 'Creating pool...' : 'Create pool'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
