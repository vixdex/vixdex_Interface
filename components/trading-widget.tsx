/* components/trading-widget.tsx
 * ------------------------------------------------------------
 * Front-end for swapping VPT tokens through the custom Router.
 * Implements full address-sorting logic so the swap parameters
 * always satisfy the Vix hook’s “exactIn / exactOut” rules.
 * ------------------------------------------------------------
 */

'use client';

import { useState, useEffect } from 'react';
import { ethers, Contract, Signer } from 'ethers';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

/* ──────────── ABIs ──────────── */
import VixAbi    from '../abi/Vix.json';
import RouterAbi from '../abi/Router.json';
import Erc20Abi  from '../abi/Erc20.json';

/* ──────────── ENV ──────────── */
const VIX        = process.env.NEXT_PUBLIC_VIX_ADDRESS!;
const ROUTER     = process.env.NEXT_PUBLIC_ROUTER_ADDRESS!;
const USDC       = process.env.NEXT_PUBLIC_USDC_ADDRESS!;
const V3_POOL    = process.env.NEXT_PUBLIC_HOOK_DATA_SOURCE_ADDRESS!;   // Uniswap-V3 pool tracked by hook

/* ──────────── CONSTANTS ──────────── */
const FEE_TIER     = 3000;
const TICK_SPACING = 60;
const SLIP_BPS     = 100n;   /* 1 % */
const USD6         = 6;
const VPT_DECIMALS = 18;
const ONE18        = ethers.WeiPerEther;

/* ──────────── helpers ──────────── */
const sqrt = (n: bigint): bigint => {
  if (n < 2n) return n;
  let x = n, y = (x + n / x) >> 1n;
  while (y < x) { x = y; y = (x + n / x) >> 1n; }
  return x;
};
const to18 = (u6: bigint) => u6 * 10n ** 12n;

/* ═════════════════════════════════ component ═════════════════════════════ */
export function TradingWidget() {
  /* ---------- UI state ---------- */
  const [side , setSide ] = useState<'High'|'Low'>('High');
  const [amt  , setAmt  ] = useState('10');           // USDC string
  const [quickSel, setQuickSel] = useState('10');

  /* ---------- runtime flags ---------- */
  const [needBuy , setNeedBuy ] = useState(false);
  const [needSell, setNeedSell] = useState(false);
  const [busyApp , setBusyApp ] = useState(false);
  const [busySwp , setBusySwp ] = useState(false);

  /* ---------- on-chain objects ---------- */
  const [signer , setSigner] = useState<Signer|null>(null);
  const [router , setRouter] = useState<Contract>();
  const [vix    , setVix   ] = useState<Contract>();
  const [usdc   , setUsdc  ] = useState<Contract>();
  const [highC  , setHighC ] = useState<Contract>();
  const [lowC   , setLowC  ] = useState<Contract>();

  /* ---------- addresses ---------- */
  const [highAddr, setHighAddr] = useState('');
  const [lowAddr , setLowAddr ] = useState('');

  /* ---------- economic params ---------- */
  const [circHigh , setCircHigh] = useState<bigint>(0n);
  const [circLow  , setCircLow ] = useState<bigint>(0n);
  const [slope    , setSlope   ] = useState<bigint>(0n);
  const [basePrice, setBase   ] = useState<bigint>(0n);
  const [fee      , setFee    ] = useState<bigint>(0n);

  /* ---------- balances / preview ---------- */
  const [usdcBalance , setUsdBal ] = useState('0');
  const [vptPreview  , setVptPrev] = useState('0');

  /* ═════════════════ bonding-curve math ═════════════════ */
  const vptForBuy = (usd18: bigint, circ: bigint) => {
    if (!slope) return 0n;
    const a = slope / 2n;
    const b = basePrice + (slope * circ) / ONE18;
    const adj = (usd18 * (ONE18 - fee)) / ONE18;
    const root = sqrt(b*b + 4n*a*adj);
    return (root - b) / (2n*a) * ONE18;
  };
  const vptForSell = (usd18: bigint, circ: bigint) => {
    if (!slope || fee >= ONE18) return 0n;
    const a = slope / 2n;
    const b = basePrice + (slope * circ) / ONE18;
    const rev = (usd18 * ONE18) / (ONE18 - fee);
    const disc = b*b - 4n*a*rev;
    if (disc < 0n) return 0n;
    return (b - sqrt(disc)) / (2n*a) * ONE18;
  };

  /* ═════════════════ initial connect ═════════════════ */
  useEffect(() => {
    (async () => {
      if (!(window as any).ethereum) return;
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const sg = await provider.getSigner();
      setSigner(sg);

      const r  = new ethers.Contract(ROUTER, RouterAbi.abi, sg);
      const vx = new ethers.Contract(VIX   , VixAbi.abi   , sg);
      const uc = new ethers.Contract(USDC  , Erc20Abi.abi , sg);
      setRouter(r); setVix(vx); setUsdc(uc);

      const [hi, lo, ch, cl] = await vx.getVixData(V3_POOL);
      setHighAddr(hi); setLowAddr(lo);
      setHighC(new ethers.Contract(hi, Erc20Abi.abi, sg));
      setLowC (new ethers.Contract(lo, Erc20Abi.abi, sg));
      setCircHigh(ch); setCircLow(cl);

      const [sl, bp, fe] = await Promise.all([vx.SLOPE(), vx.BASE_PRICE(), vx.FEE()]);
      setSlope(sl); setBase(bp); setFee(fe);

      const bal = await uc.balanceOf(await sg.getAddress());
      setUsdBal(ethers.formatUnits(bal, USD6));
    })().catch(console.error);
  }, []);

  /* ═════════════════ live preview ═════════════════ */
  useEffect(() => {
    const n = parseFloat(amt);
    if (!n) { setVptPrev('0'); return; }
    const usd6  = ethers.parseUnits(amt, USD6);
    const circ  = side === 'High' ? circHigh : circLow;
    const vptWei= vptForBuy(to18(usd6), circ);
    setVptPrev(ethers.formatUnits(vptWei, VPT_DECIMALS));
  }, [amt, side, circHigh, circLow, slope, basePrice, fee]);

  /* ═════════════════ allowance check ════════════════ */
  useEffect(() => {
    (async () => {
      if (!signer || !usdc || !highC || !lowC) return;
      const who   = await signer.getAddress();
      const usd6  = ethers.parseUnits(amt || '0', USD6);
      const allowU= await usdc.allowance(who, ROUTER);
      setNeedBuy(allowU < usd6);

      const circ  = side==='High'?circHigh:circLow;
      const vptWei= vptForSell(to18(usd6), circ);
      const tokC  = side==='High'?highC:lowC;
      const allowV= await tokC.allowance(who, ROUTER);
      setNeedSell(vptWei>0n && allowV < vptWei);
    })().catch(console.error);
  }, [amt, side, signer, usdc, highC, lowC, circHigh, circLow]);

  /* ═════════════════ approve helper ═════════════════ */
  const approve = async (buy: boolean) => {
    setBusyApp(true);
    try {
      const tokenC = buy ? usdc! : (side==='High'?highC!:lowC!);
      const tx = await tokenC.approve(ROUTER, ethers.MaxUint256);
      await tx.wait();
      buy ? setNeedBuy(false) : setNeedSell(false);
    } catch (e:any) { console.error(e); alert(e?.message || e); }
    setBusyApp(false);
  };

  /* ═════════════════ swap logic (sorting + opcode) ═════════════ */
  /** Swap with correct opcode/sign after currency sorting */
const swap = async (buy: boolean) => {
  if (!router || !signer) return;
  setBusySwp(true);

  try {
    /* 1. data */
    const recv   = await signer.getAddress();
    const vpt    = side === 'High' ? highAddr : lowAddr;
    const circ   = side === 'High' ? circHigh : circLow;
    const usd6   = ethers.parseUnits(amt, USD6);
    const usd18  = to18(usd6);

    /* 2. sort addresses for PoolKey */
    const [currency0, currency1] =
      USDC.toLowerCase() < vpt.toLowerCase()
        ? [USDC, vpt]
        : [vpt, USDC];

    const isBaseZero = currency0 === USDC;

    /* 3. directions */
    const zeroForOneBuy  = isBaseZero;   // USDC→VPT when USDC is token0
    const zeroForOneSell = !isBaseZero;  // opposite direction

    const key = {
      currency0,
      currency1,
      fee: FEE_TIER,
      tickSpacing: TICK_SPACING,
      hooks: VIX
    };

    const hookData = ethers.AbiCoder.defaultAbiCoder()
                      .encode(['address'], [V3_POOL]);

    let tx;

    /* 4a. BUY path ------------------------------------------------ */
    if (buy) {
      if (isBaseZero) {
        /* USDC is token0  →  BUY must be exact-output */
        const maxIn  = usd6 * 101n / 100n;                  // +1 % slippage
        const vptOut = vptForBuy(usd18, circ);
        tx = await router.ExactOutputSwapSingle(
          key,
          vptOut,            // amountOut  (VPT wanted)
          maxIn,             // max USDC in
          zeroForOneBuy,     // true
          hookData,
          recv
        );
      } else {
        /* USDC is token1  →  BUY must be exact-input */
        const minOut = vptForBuy(usd18, circ) * 99n / 100n; // ‑1 % slippage
        tx = await router.ExactInputSwapSingle(
          key,
          usd6,              // amountIn (USDC)
          minOut,            // min VPT out
          zeroForOneBuy,     // false
          hookData,
          recv
        );
      }
    }

    /* 4b. SELL path ----------------------------------------------- */
    else {
      if (isBaseZero) {
        /* USDC is token0 → SELL must be exact-input */
        const vptIn  = vptForSell(usd18, circ);
        const minUsd = usd6 * 99n / 100n;
        tx = await router.ExactInputSwapSingle(
          key,
          vptIn,
          minUsd,
          zeroForOneSell,     // false
          hookData,
          recv
        );
      } else {
        /* USDC is token1 → SELL must be exact-output */
        const vptMax = vptForSell(usd18, circ);
        tx = await router.ExactOutputSwapSingle(
          key,
          usd6,               // amountOut (USDC wanted)
          vptMax,             // max VPT in
          zeroForOneSell,     // true
          hookData,
          recv
        );
      }
    }

    await tx.wait();
  } catch (e: any) {
    console.error('Swap failed:', e);
    alert(e?.message || e);
  }
  setBusySwp(false);
};


  /* ═════════════════ quick select helper ══════════ */
  const pickQuick = (v:string)=>{ setQuickSel(v); setAmt(v); };

  /* ═════════════════ UI rendering ═════════════════ */
  return (
    <Card className="w-full max-w-sm bg-black border-gray-800 hidden md:block">
      <CardContent className="p-6 space-y-4">

        {/* High / Low toggle */}
        <div className="flex">
          {(['High','Low'] as const).map(option => (
            <Button key={option} onClick={()=>setSide(option)}
              className={`flex-1 h-12 rounded-2xl font-medium text-lg
                ${side===option
                  ? 'bg-[#4ade80] text-black'
                  : 'bg-transparent text-white border border-gray-600'}`}>
              {option}
            </Button>
          ))}
        </div>

        {/* quick amount buttons */}
        <div className="flex gap-4">
          {['10','50','100'].map(q => (
            <Button key={q} onClick={()=>pickQuick(q)}
              className={`px-4 rounded-full text-sm
                ${quickSel===q
                  ? 'bg-[#4ade80] text-black'
                  : 'bg-secondary text-white'}`}>
              ${q}
            </Button>
          ))}
        </div>

        {/* amount input */}
        <div className="bg-secondary p-2 rounded-lg">
          <Input type="number" value={amt}
            onChange={e=>{setQuickSel(''); setAmt(e.target.value);}}
            placeholder="Enter USDC"
            className="bg-transparent text-white text-2xl font-bold h-12 text-center border-none"/>
        </div>

        {/* balances & fee */}
        <div className="space-y-1 text-gray-400 text-sm">
          <div>USDC Balance: {Number(usdcBalance).toFixed(2)}</div>
          <div>Swap Fee: {(Number(fee) / 1e16).toFixed(2)} %</div>
        </div>

        {/* preview */}
        <div className="text-center text-gray-400 h-6">
          {parseFloat(amt) > 0 && `≈ ${Number(vptPreview).toFixed(4)} ${side} VPT`}
        </div>

        {/* action buttons */}
        <div className="flex gap-3">
          {/* Buy */}
          <motion.div className="flex-1" whileHover={{scale:1.02}} whileTap={{scale:0.97}}>
            <Button disabled={busyApp||busySwp}
              onClick={()=> needBuy ? approve(true) : swap(true)}
              className="w-full h-14 bg-[#4ade80] text-black font-semibold text-lg rounded-2xl">
              {busyApp ? 'Approving…'
               : busySwp ? 'Buying…'
               : needBuy ? 'Approve USDC'
               : 'Buy'}
            </Button>
          </motion.div>

          {/* Sell */}
          <motion.div className="flex-1" whileHover={{scale:1.02}} whileTap={{scale:0.97}}>
            <Button disabled={busyApp||busySwp}
              onClick={()=> needSell ? approve(false) : swap(false)}
              className="w-full h-14 bg-[#ef4444] text-white font-semibold text-lg rounded-2xl">
              {busyApp ? 'Approving…'
               : busySwp ? 'Selling…'
               : needSell ? 'Approve VPT'
               : 'Sell'}
            </Button>
          </motion.div>
        </div>

      </CardContent>
    </Card>
  );
}
