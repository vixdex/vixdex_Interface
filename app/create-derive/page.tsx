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
import { useCreateDerive } from '@/hooks/create-derive';
import {useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import {sortTokenAddresses} from "@/utils/tokenOrder.js"

export default function CreateDerivePage() {
  const [poolAddress, setPoolAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createDerive } = useCreateDerive();
  let {wallets} = useWallets();

  const [txData, setTxData] = useState<null | {
    txHash: string;
    highToken: string;
    lowToken: string;
  }>(null);

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
    try {
      const deriveToken = poolAddress;
      const result = await createDerive(deriveToken, poolAddress);
      console.log('Create Derive Result:', result);
      if (result) {
        setTxData({
          txHash: result.txHash,
          highToken: result.highToken,
          lowToken: result.lowToken,
        });
         const wallet = wallets[0]; // or select preferred wallet
        const privyProvider = await wallet.getEthereumProvider();
        const ethersProvider = new ethers.BrowserProvider(privyProvider);
        const signer = await ethersProvider.getSigner();
        const ROUTER_CONTRACT_ABI = [
          "function createPool(address _token0,address _token1,uint24 lpFee,int24 tickSpacing,address hookContract,uint160 sqrtStartPriceX96)"
        ] 
        let routerContract = new ethers.Contract(process.env.NEXT_PUBLIC_VIX_ROUTER_ADDRESS,ROUTER_CONTRACT_ABI,signer)
        let [token0, token1] = sortTokenAddresses(result.highToken,process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS)
        console.log('Token0:', token0);
        console.log('Token1:', token1);
        console.log('Router Contract Address:', process.env.NEXT_PUBLIC_VIX_ROUTER_ADDRESS);
        let initializeHighTokenPool =  await routerContract.createPool(token0,token1,3000,60,process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS,ethers.toBigInt("79228162514264337593543950336"))
        const receipt = await initializeHighTokenPool.wait();
        let [Ltoken0, Ltoken1] = sortTokenAddresses(result.lowToken,process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS)
        let initializeLowTokenPool =  await routerContract.createPool(Ltoken0,Ltoken1,3000,60,process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS,ethers.toBigInt("79228162514264337593543950336"))
        const receipt2 = await initializeLowTokenPool.wait();
        console.log('Transaction Receipt:', receipt);
        console.log('✅ Pool created successfully:', initializeHighTokenPool);
      } else {
        console.warn('❗ createDerive returned undefined');
      }
    } catch (err) {
      console.error('❌ Error:', err);
    } finally {
      setIsLoading(false);
    }
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

      {txData && (
        <div className="mt-4 text-sm text-green-600">
          <p>✅ Transaction Hash: {txData.txHash}</p>
          <p>High Token: {txData.highToken}</p>
          <p>Low Token: {txData.lowToken}</p>
        </div>
      )}
    </div>
  );
}
