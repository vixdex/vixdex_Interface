'use client';

import { useState, useEffect } from 'react';
import { ethers, Contract, Signer } from 'ethers';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ABIs
import VixAbi from '../abi/Vix.json';
import RouterAbi from '../abi/Router.json';
import Erc20Abi from '../abi/Erc20.json'; 

// Environment Variables
const VIX_ADDRESS = process.env.NEXT_PUBLIC_VIX_ADDRESS!;
const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_ROUTER_ADDRESS!;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS!;
const HOOK_DATA_SOURCE_ADDRESS = process.env.NEXT_PUBLIC_HOOK_DATA_SOURCE_ADDRESS!;
const HIGH_VPT_POOL_ADDRESS = process.env.NEXT_PUBLIC_HIGH_VPT_POOL_ADDRESS!;
const LOW_VPT_POOL_ADDRESS = process.env.NEXT_PUBLIC_LOW_VPT_POOL_ADDRESS!;

// Constants
const FEE_TIER = 3000;
const TICK_SPACING = 60;
const SLIPPAGE_PERCENT = 1;

/**
 * Calculates the integer square root of a bigint value using an iterative Newton-Raphson method.
 */
function sqrt(value: bigint): bigint {
  if (value < 0n) throw new Error('Square root of negative numbers is not supported');
  if (value < 2n) return value;
  let x0 = value;
  let x1 = (x0 + value / x0) >> 1n;
  while (x1 < x0) {
    x0 = x1;
    x1 = (x0 + value / x0) >> 1n;
  }
  return x0;
}

export function TradingWidget() {
  // UI State
  const [selectedType, setSelectedType] = useState<'High' | 'Low'>('High');
  const [customAmount, setCustomAmount] = useState<string>('10');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<string>('10');
  const [usdcBalance, setUsdcBalance] = useState<string>('0.00');
  const [vptAmountDisplay, setVptAmountDisplay] = useState<string>('0');

  // Transaction/Approval State
  const [isTrading, setIsTrading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [needsApprovalBuy, setNeedsApprovalBuy] = useState(false);
  const [needsApprovalSell, setNeedsApprovalSell] = useState(false);

  // Ethers & Contract State
  const [signer, setSigner] = useState<Signer | null>(null);
  const [vix, setVix] = useState<Contract>();
  const [router, setRouter] = useState<Contract>();
  const [usdcContract, setUsdcContract] = useState<Contract>();
  const [highVptContract, setHighVptContract] = useState<Contract>();
  const [lowVptContract, setLowVptContract] = useState<Contract>();

  // On-Chain Data State
  const [slope, setSlope] = useState<bigint>(0n);
  const [fee, setFee] = useState<bigint>(0n);
  const [basePrice, setBasePrice] = useState<bigint>(0n);
  const [circHigh, setCircHigh] = useState<bigint>(0n);
  const [circLow, setCircLow] = useState<bigint>(0n);
  const [highVptAddress, setHighVptAddress] = useState<string>('');
  const [lowVptAddress, setLowVptAddress] = useState<string>('');
  
  const ONE18 = ethers.WeiPerEther;
  const amounts = ['10', '50', '100'];

  const getVptForExactUsdc = (usdcAmount18: bigint, currentCirculation: bigint): bigint => {
    if (!slope || !basePrice || !fee || slope === 0n) return 0n;
    const adjustedCost = (usdcAmount18 * (ONE18 - fee)) / ONE18;
    const a = slope / 2n;
    const b = basePrice + (slope * currentCirculation) / ONE18;
    const discriminant = b * b + 4n * a * adjustedCost;
    const root = sqrt(discriminant);
    if (a === 0n) return 0n;
    return (root - b) / (2n * a);
  };

  const getVptToSellForExactUsdc = (usdcAmount18: bigint, currentCirculation: bigint): bigint => {
    if (!slope || !basePrice || !fee || slope === 0n || fee >= ONE18) return 0n;
    const adjustedRevenue = (usdcAmount18 * ONE18) / (ONE18 - fee);
    const a = slope / 2n;
    const b = basePrice + (slope * currentCirculation) / ONE18;
    const discriminant = b * b - 4n * a * adjustedRevenue;
    if (discriminant < 0n) return 0n;
    const root = sqrt(discriminant);
    if (a === 0n) return 0n;
    return (b - root) / (2n * a);
  };  
  
  useEffect(() => {
    const usdcAmount = parseFloat(customAmount) || 0;
    if (usdcAmount === 0 || !circHigh || !circLow) { setVptAmountDisplay('0'); return; }
    const baseAmt18 = ethers.parseUnits(customAmount, 6) * 10n ** 12n;
    const currentCirculation = selectedType === 'High' ? circHigh : circLow;
    const vptToReceive = getVptForExactUsdc(baseAmt18, currentCirculation);
    setVptAmountDisplay(ethers.formatUnits(vptToReceive, 18));
  }, [customAmount, selectedType, circHigh, circLow, slope, basePrice, fee]);
  
  useEffect(() => {
    const checkAllowances = async () => {
      if (!signer || !customAmount || parseFloat(customAmount) === 0 || !usdcContract || !highVptContract || !lowVptContract) {
        setNeedsApprovalBuy(false); setNeedsApprovalSell(false); return;
      }
      const owner = await signer.getAddress();
      const usdcAmount6 = ethers.parseUnits(customAmount, 6);
      const usdcAllowance = await usdcContract.allowance(owner, ROUTER_ADDRESS);
      setNeedsApprovalBuy(usdcAllowance < usdcAmount6);
      const currentCirculation = selectedType === 'High' ? circHigh : circLow;
      const usdcToReceive18 = usdcAmount6 * 10n ** 12n;
      const vptToSpend = getVptToSellForExactUsdc(usdcToReceive18, currentCirculation);
      const sellTokenContract = selectedType === 'High' ? highVptContract : lowVptContract;
      if (vptToSpend > 0n) {
        const vptAllowance = await sellTokenContract.allowance(owner, ROUTER_ADDRESS);
        setNeedsApprovalSell(vptAllowance < vptToSpend);
      } else { setNeedsApprovalSell(false); }
    };
    checkAllowances();
  }, [customAmount, selectedType, signer, usdcContract, highVptContract, lowVptContract, circHigh, circLow]);

  const refetchCirculationData = async (vixInstance?: Contract) => {
    const contract = vixInstance || vix;
    if (!contract) return;
    try {
      const [, , circ0, circ1] = await contract.getVixData(HOOK_DATA_SOURCE_ADDRESS);
      setCircHigh(circ0);
      setCircLow(circ1);
    } catch (error) { console.error("Failed to refetch circulation data:", error); }
  };

  useEffect(() => {
    const connectAndFetch = async () => {
      if (typeof window.ethereum === 'undefined') return;
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signerInstance = await provider.getSigner();
      setSigner(signerInstance);
      
      const vixC = new ethers.Contract(VIX_ADDRESS, VixAbi.abi, signerInstance);
      const routerC = new ethers.Contract(ROUTER_ADDRESS, RouterAbi.abi, signerInstance);
      const usdcC = new ethers.Contract(USDC_ADDRESS, Erc20Abi.abi, signerInstance);
      setVix(vixC); setRouter(routerC); setUsdcContract(usdcC);

      try {
        const [highAddr, lowAddr, c0, c1] = await vixC.getVixData(HOOK_DATA_SOURCE_ADDRESS);
        setHighVptAddress(highAddr);
        setLowVptAddress(lowAddr);
        setCircHigh(c0);
        setCircLow(c1);

        const highVptC = new ethers.Contract(highAddr, Erc20Abi.abi, signerInstance);
        const lowVptC = new ethers.Contract(lowAddr, Erc20Abi.abi, signerInstance);
        setHighVptContract(highVptC);
        setLowVptContract(lowVptC);
        
        const [sl, bp, fe, balance] = await Promise.all([
            vixC.SLOPE(), vixC.BASE_PRICE(), vixC.FEE(), usdcC.balanceOf(signerInstance.getAddress())
        ]);
        setSlope(sl); setBasePrice(bp); setFee(fe);
        setUsdcBalance(ethers.formatUnits(balance, 6));
      } catch (error) { console.error('Failed to fetch initial on-chain data:', error); }
    };
    connectAndFetch();
  }, []);

  const handleApprove = async (isBuy: boolean) => {
    if (!signer) { alert("Please connect your wallet."); return; }
    const tokenToApproveContract = isBuy ? usdcContract : (selectedType === 'High' ? highVptContract : lowVptContract);
    if (!tokenToApproveContract) return;

    setIsApproving(true);
    try {
      const tx = await tokenToApproveContract.approve(ROUTER_ADDRESS, ethers.MaxUint256);
      await tx.wait();
      if (isBuy) setNeedsApprovalBuy(false); else setNeedsApprovalSell(false);
    } catch (error) {
      console.error('Approval failed:', error); alert('Approval failed.');
    } finally { setIsApproving(false); }
  };

  const handleSwap = async (isBuy: boolean) => {
    if (!signer || !router || isTrading || slope === 0n || !highVptAddress || !lowVptAddress) return;
    setIsTrading(true);
    try {
      const user = await signer.getAddress();
      const currentCirculation = selectedType === 'High' ? circHigh : circLow;
      const vptTokenAddress = selectedType === 'High' ? highVptAddress : lowVptAddress;
      const baseAmt18 = ethers.parseUnits(customAmount, 6) * 10n ** 12n;
      const hookData = ethers.AbiCoder.defaultAbiCoder().encode(['address'], [HOOK_DATA_SOURCE_ADDRESS]);
      const poolKey = { currency0: USDC_ADDRESS, currency1: vptTokenAddress, fee: FEE_TIER, tickSpacing: TICK_SPACING, hooks: VIX_ADDRESS };
      
      let tx;
      if (isBuy) {
        const minVptOut = getVptForExactUsdc(baseAmt18, currentCirculation);
        if (minVptOut === 0n) throw new Error("Amount too low to trade.");
        const minOutWithSlippage = (minVptOut * BigInt(100 - SLIPPAGE_PERCENT)) / 100n;
        tx = await router.ExactInputSwapSingle(poolKey, baseAmt18, minOutWithSlippage, true, hookData, user);
      } else {
        const vptToSell = getVptToSellForExactUsdc(baseAmt18, currentCirculation);
        if (vptToSell === 0n) throw new Error("Cannot sell for this amount.");
        const maxVptInWithSlippage = (vptToSell * BigInt(100 + SLIPPAGE_PERCENT)) / 100n;
        tx = await router.ExactOutputSwapSingle(poolKey, baseAmt18, maxVptInWithSlippage, false, hookData, user);
      }
      await tx.wait();
      await refetchCirculationData();
    } catch (error) {
      console.error('Swap failed:', error); alert(`Trade failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally { setIsTrading(false); }
  };

  const handleBuyAction = () => { needsApprovalBuy ? handleApprove(true) : handleSwap(true); };
  const handleSellAction = () => { needsApprovalSell ? handleApprove(false) : handleSwap(false); };
  const handleQuickAmountSelect = (amount: string) => { setSelectedQuickAmount(amount); setCustomAmount(amount); };
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => { setSelectedQuickAmount(''); setCustomAmount(e.target.value); };

  return (
    <Card className="w-full max-w-sm bg-black border-gray-800 hidden md:block">
      <CardContent className="p-6 space-y-4">
        <div className="flex">
          <Button onClick={() => setSelectedType('High')} className={`flex-1 h-12 rounded-2xl font-medium text-lg ${ selectedType === 'High' ? 'bg-[#4ade80] text-black hover:bg-[#4ade80]/90' : 'bg-transparent text-white border border-gray-600 hover:bg-gray-800' }`}>High</Button>
          <Button onClick={() => setSelectedType('Low')} className={`flex-1 h-12 rounded-2xl font-medium text-lg ${ selectedType === 'Low' ? 'bg-[#4ade80] text-black hover:bg-[#4ade80]/90' : 'bg-transparent text-white border border-gray-600 hover:bg-gray-800' }`}>Low</Button>
        </div>

        <div className="flex gap-x-4">
          {amounts.map((amount) => (
            <Button key={amount} onClick={() => handleQuickAmountSelect(amount)} className={`px-4 rounded-full text-sm font-medium border-0 ${ selectedQuickAmount === amount ? 'bg-[#4ade80] text-black' : 'bg-secondary text-white hover:bg-[#4b5563]' }`}>${amount}</Button>
          ))}
        </div>

        <div className="bg-secondary p-2 rounded-lg">
            <Input type="number" value={customAmount} onChange={handleCustomAmountChange} placeholder="Enter USDC amount" className="bg-transparent text-white text-2xl font-bold h-12 text-center border-none focus-visible:ring-0 focus-visible:ring-offset-0"/>
        </div>
        
        <div className="space-y-2 text-gray-400 text-sm pt-2">
            <div>USDC Balance: {parseFloat(usdcBalance).toFixed(2)}</div>
            <div>Swap Fee: {fee > 0n ? `${(Number(fee) / 10000).toFixed(2)}%` : '0.00%'}</div>
        </div>

        <div className="text-center text-gray-400 h-6">
           {parseFloat(customAmount) > 0 && `~ ${parseFloat(vptAmountDisplay).toFixed(4)} ${selectedType} VPT`}
        </div>

        <div className="flex gap-3 pt-2">
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleBuyAction} disabled={isTrading || isApproving} className="w-full h-14 bg-[#4ade80] hover:bg-[#4ade80]/90 text-black font-semibold text-lg rounded-2xl">
              {isApproving ? "Approving..." : isTrading ? "Buying..." : needsApprovalBuy ? "Approve USDC" : "Buy"}
            </Button>
          </motion.div>
          <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleSellAction} disabled={isTrading || isApproving} className="w-full h-14 bg-[#ef4444] hover:bg-[#ef4444]/90 text-white font-semibold text-lg rounded-2xl">
              {isApproving ? "Approving..." : isTrading ? "Selling..." : needsApprovalSell ? `Approve VPT` : "Sell"}
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
