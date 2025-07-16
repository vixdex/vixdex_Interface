'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSwap } from "@/hooks/swap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { ethers, toNumber } from 'ethers';
import { approveUSDC, burnUSDC, mintUSDC, retrieveAttestation } from '@/hooks/usdc';
import { useWallets } from '@privy-io/react-auth';

interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  balance: string;
  address: string;
  price: number;
}

interface ElementProps {
  highTokenAdd: string;
  lowTokenAdd: string;
  poolAdd: string;
}

interface VixData {
  vixHighToken: string;
  _vixLowToken: string;
  _circulation0: bigint;
  _circulation1: bigint;
  _contractHoldings0: bigint;
  _contractHoldings1: bigint;
  _reserve0: bigint;
  _reserve1: bigint;
  _poolAddress: string;
}

const VIX_ABI = [
  'function getVixData(address poolAdd) view returns (address vixHighToken, address _vixLowToken, uint256 _circulation0, uint256 _circulation1, uint256 _contractHoldings0, uint256 _contractHoldings1, uint256 _reserve0, uint256 _reserve1, address _poolAddress)',
  'function vixTokensPrice(uint contractHoldings) view returns(uint)'
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// Chain configurations
const CHAIN_CONFIG = {
  // Mainnets
  1: { name: 'Ethereum', color: '#627EEA' },
  137: { name: 'Polygon', color: '#8247E5' },
  56: { name: 'BSC', color: '#F3BA2F' },
  8453: { name: 'Base', color: '#0052FF' },
  42161: { name: 'Arbitrum', color: '#28A0F0' },
  10: { name: 'Optimism', color: '#FF0420' },

  // Testnets
  11155111: { name: 'Ethereum Sepolia', color: '#8A92B2' },
  80002: { name: 'Polygon Amoy', color: '#8247E5' },
  97: { name: 'BSC Testnet', color: '#F3BA2F' },
  84532: { name: 'Base Sepolia', color: '#0052FF' },
  421614: { name: 'Arbitrum Sepolia', color: '#28A0F0' },
  11155420: { name: 'Optimism Sepolia', color: '#FF0420' },
  59141: { name: 'Linea Sepolia', color: '#0057FF' },
  534351: { name: 'Scroll Sepolia', color: '#FBCC5C' },
  5001: { name: 'Mantle Testnet', color: '#FBCC5C' },
  1442: { name: 'Polygon zkEVM Testnet', color: '#8247E5' },
  42170: { name: 'Arbitrum Nova', color: '#28A0F0' },

  // Custom
  26735: { name: 'BuildBear', color: '#FFF000' },
};


export function TradingWidget({ highTokenAdd, lowTokenAdd, poolAdd }: ElementProps) {
  const {wallets} = useWallets()
  const account = wallets[0]?.address as `0x${string}`;

  const [selectedType, setSelectedType] = useState<'High' | 'Low'>('High');
  const [selectedAmount, setSelectedAmount] = useState<string>('1$');
  const [customAmount, setCustomAmount] = useState<string>('1');
  const [selectedToken, setSelectedToken] = useState<string>('usdc');
  const [isAmountInBase, setIsAmountInBase] = useState<boolean>(true);
  const [highTokenPrice, setHighTokenPrice] = useState<number>(1);
  const [lowTokenPrice, setLowTokenPrice] = useState<number>(1);
  const [highTokenBalance, setHighTokenBalance] = useState<string>('0');
  const [lowTokenBalance, setLowTokenBalance] = useState<string>('0');
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [currentChain, setCurrentChain] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  let { buy, sell } = useSwap();
  const amounts = ['1$', '10$', '20$'];

  // Initialize provider and contract
  const getProvider = () => {
    // Always use JsonRpcProvider for consistency
    return new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.buildbear.io/dual-magma-e6ae5bf5");
  };

  // Fetch VIX data and token prices
  const fetchVixData = async () => {
    try {
      setIsLoading(true);
      
      if (!process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS) {
        throw new Error("VIX contract address not configured");
      }

      const provider = getProvider();
      const vixContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS,
        VIX_ABI,
        provider
      );

      const vixData = await vixContract.getVixData(poolAdd);
      
      // Get High token price
      const highPrice = await vixContract.vixTokensPrice(vixData._contractHoldings0);
      setHighTokenPrice(Number(ethers.formatEther(highPrice)));

      // Get Low token price  
      const lowPrice = await vixContract.vixTokensPrice(vixData._contractHoldings1);
      setLowTokenPrice(Number(ethers.formatEther(lowPrice)));

    } catch (error) {
      console.error('Error fetching VIX data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch token balances
  const fetchTokenBalances = async () => {
    try {
      // Only fetch balances if we have a connected wallet
      if (typeof window === 'undefined' || !window.ethereum) {
        console.log('No wallet connected, skipping balance fetch');
        return;
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await browserProvider.getSigner();
      const userAddress = await signer.getAddress();

      const provider = getProvider(); // Use RPC provider for contract reads

      // Fetch High token balance
      const highTokenContract = new ethers.Contract(highTokenAdd, ERC20_ABI, provider);
      const highBalance = await highTokenContract.balanceOf(userAddress);
      const highDecimals = await highTokenContract.decimals();
      setHighTokenBalance(ethers.formatUnits(highBalance, highDecimals));

      // Fetch Low token balance
      const lowTokenContract = new ethers.Contract(lowTokenAdd, ERC20_ABI, provider);
      const lowBalance = await lowTokenContract.balanceOf(userAddress);
      const lowDecimals = await lowTokenContract.decimals();
      setLowTokenBalance(ethers.formatUnits(lowBalance, lowDecimals));

      // Fetch USDC balance
      if (process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS) {
        const usdcContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS,
          ERC20_ABI,
          provider
        );
        const usdcBal = await usdcContract.balanceOf(userAddress);
        const usdcDecimals = await usdcContract.decimals();
        setUsdcBalance(ethers.formatUnits(usdcBal, usdcDecimals));
      }

    } catch (error) {
      console.error('Error fetching token balances:', error);
    }
  };

  // Get current chain
  const getCurrentChain = async () => {
    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        console.log('No wallet connected, using default chain');
        return;
      }

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const network = await browserProvider.getNetwork();
      setCurrentChain(Number(network.chainId));
    } catch (error) {
      console.error('Error getting current chain:', error);
    }
  };

  // Handle account/chain changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Listen for account changes
      window.ethereum.on('accountsChanged', () => {
        fetchTokenBalances();
      });

      // Listen for chain changes
      window.ethereum.on('chainChanged', () => {
        getCurrentChain();
        fetchVixData();
        fetchTokenBalances();
      });
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    // Always fetch VIX data (doesn't require wallet)
    fetchVixData();
    
    // Only fetch chain and balances if wallet might be available
    if (typeof window !== 'undefined') {
      getCurrentChain();
      fetchTokenBalances();
    }
  }, [poolAdd, highTokenAdd, lowTokenAdd]);

  const tokens: Token[] = [
    {
      id: 'usdc',
      name: 'USD Coin',
      symbol: 'USDC',
      icon: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
      balance: parseFloat(usdcBalance).toFixed(4),
      address: process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS + "",
      price: 1
    },
    {
      id: 'High',
      name: 'High Token',
      symbol: 'H',
      icon: '',
      balance: parseFloat(highTokenBalance).toFixed(4),
      address: highTokenAdd,
      price: highTokenPrice
    },
    {
      id: 'Low',
      name: 'Low Token',
      symbol: 'L',
      icon: '',
      balance: parseFloat(lowTokenBalance).toFixed(4),
      address: lowTokenAdd,
      price: lowTokenPrice
    },
  ];

  const currentToken = tokens.find((token) => token.id === selectedToken) || tokens[0];

  // Calculate USD value based on selected token and amount
  const calculateUSDValue = () => {
    if (!customAmount || isNaN(Number(customAmount))) return 0;
    return Number(customAmount) * currentToken.price;
  };

  const handleAmountSelect = (amount: string) => {
    setSelectedAmount(amount);
    const numericAmount = amount.replace('$', '');
    setCustomAmount(numericAmount);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount('');
    console.log('Custom amount changed:', value);
    console.log('High Token Address:', highTokenAdd);
    console.log('Low Token Address:', lowTokenAdd);
    console.log("Selected type:", selectedType);
    console.log("Selected token:", selectedToken);
    console.log("USD Value:", calculateUSDValue());
  };


// Or with proper error handling:
async function buyToken() {
  // Check if wallet is connected
  if (!wallets || wallets.length === 0) {
    console.error('No wallet connected');
    return;
  }

  const account = wallets[0].address as `0x${string}`;
  
  const amountParsed = ethers.parseUnits(customAmount, 6);
  const isCrossChain = currentChain !== 11155111;

  if (isCrossChain) {
    console.log("Cross-chain swap triggered");

    const chain = { 
      id: currentChain!, 
      name: "Unknown", 
      network: "unknown", 
      nativeCurrency: { name: "", symbol: "", decimals: 18 }, 
      rpcUrls: { default: { http: "'https://sepolia.base.org" } } 
    };

    await approveUSDC({
      sourceChainId: currentChain!,
      chain,
      account,
      wallets,
      amount: amountParsed,

    });

    const burnTxHash = await burnUSDC({
      sourceChainId: currentChain!,
      destChainId: 11155111,
      chain,
      account,
      destinationAddress: account,
      amount: amountParsed,
      wallets,
    });

    const attestation = await retrieveAttestation(burnTxHash, currentChain!);
    await mintUSDC({
      destChainId: 11155111,
      chain: { 
        id: 11155111, 
        name: "Sepolia", 
        network: "sepolia", 
        nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, 
        rpcUrls: { default: { http: ["https://sepolia.infura.io/v3/your-key"] } } 
      },
      account,
      attestation,
      wallets,
    });

    return;
  }


 ethers.parseUnits(customAmount, 18);
    
    if (selectedType === 'High') {
      if (selectedToken === 'usdc') {
        // Handle USDC to High token swap
        console.log("usdc selected: ",customAmount)
        //buy(ethers.parseUnits(customAmount, 18), process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS + "", highTokenAdd, poolAdd);
      } else {
        // Handle High token to USDC swap
        buy(ethers.parseUnits(customAmount, 18), highTokenAdd, process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS + "", poolAdd);
      }
    }

  else {
    if (selectedToken === 'usdc') {
      buy(ethers.parseUnits(customAmount, 18),process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS!, lowTokenAdd, poolAdd);
    } else {
      buy(ethers.parseUnits(customAmount, 18), lowTokenAdd, process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS!, poolAdd);
    }
  }
}


 async function sellToken() {
  console.log('Sell function called');
  console.log('Custom Amount:', ethers.parseUnits(customAmount, 18));

  // Check if wallet is connected
  if (!wallets || wallets.length === 0) {
    console.error('No wallet connected');
    return;
  }

  const account = wallets[0].address as `0x${string}`;
  const isCrossChain = currentChain !== 11155111; // Check if user wants USDC on different chain

  if (selectedType === 'High') {
    if (selectedToken === 'usdc') {
      // Selling USDC for High tokens (essentially buying High)
      buy(ethers.parseUnits(customAmount, 18), process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS + "", highTokenAdd, poolAdd);
    } else {
      // Selling High tokens for USDC
      await sell(ethers.parseUnits(customAmount, 18), highTokenAdd, process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS + "", poolAdd);
      
      // If cross-chain, transfer USDC to preferred chain
      if (isCrossChain) {
        await transferUSDCToPeferredChain(account, ethers.parseUnits(customAmount, 6)); // Assuming 6 decimals for USDC
      }
    }
  } else {
    if (selectedToken === 'usdc') {
      // Selling USDC for Low tokens (essentially buying Low)
      buy(ethers.parseUnits(customAmount, 18), process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS + "", lowTokenAdd, poolAdd);
    } else {
      // Selling Low tokens for USDC
      await sell(ethers.parseUnits(customAmount, 18), lowTokenAdd, process.env.NEXT_PUBLIC_BASE_TOKEN_ADDRESS + "", poolAdd);
      
      // If cross-chain, transfer USDC to preferred chain
      if (isCrossChain) {
        await transferUSDCToPeferredChain(account, ethers.parseUnits(customAmount, 6)); // Assuming 6 decimals for USDC
      }
    }
  }
}

async function transferUSDCToPeferredChain(account, usdcAmount) {
  console.log("Cross-chain USDC transfer triggered");

  const sourceChain = { 
    id: 11155111, // Sepolia (where the sell happened)
    name: "Sepolia", 
    network: "sepolia", 
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 }, 
    rpcUrls: { default: { http: ["https://sepolia.infura.io/v3/your-key"] } } 
  };

  const destChain = { 
    id: currentChain!, 
    name: "Unknown", 
    network: "unknown", 
    nativeCurrency: { name: "", symbol: "", decimals: 18 }, 
    rpcUrls: { default: { http: "https://sepolia.base.org" } } 
  };

  try {
    // Step 1: Approve USDC for burning on source chain (Sepolia)
    await approveUSDC({
      sourceChainId: 11155111,
      chain: sourceChain,
      account,
      wallets,
      amount: usdcAmount,
    });

    // Step 2: Burn USDC on source chain
    const burnTxHash = await burnUSDC({
      sourceChainId: 11155111,
      destChainId: currentChain!,
      chain: sourceChain,
      account,
      destinationAddress: account,
      amount: usdcAmount,
      wallets,
    });

    // Step 3: Retrieve attestation
    const attestation = await retrieveAttestation(burnTxHash, 11155111);

    // Step 4: Mint USDC on destination chain
    await mintUSDC({
      destChainId: currentChain!,
      chain: destChain,
      account,
      attestation,
      wallets,
    });

    console.log("USDC successfully transferred to preferred chain");
  } catch (error) {
    console.error("Error transferring USDC to preferred chain:", error);
    throw error;
  }
}

  return (
    <Card className="w-full max-w-sm bg-black border-gray-800 hidden md:block">
      <CardContent className="p-6 space-y-4">
        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center text-gray-400 text-sm">
            Loading prices...
          </div>
        )}

        {/* High/Low Toggle */}
        <div className="flex space-x-4">
          <Button
            onClick={() => setSelectedType('High')}
            className={`flex-1 h-12 rounded-2xl font-medium text-lg ${
              selectedType === 'High'
                ? 'bg-[#4ade80] text-black hover:bg-[#4ade80]/90'
                : 'bg-transparent text-white border border-gray-600 hover:bg-gray-800'
            }`}
          >
            High
          </Button>
          <Button
            onClick={() => setSelectedType('Low')}
            className={`flex-1 h-12 rounded-2xl font-medium text-lg ${
              selectedType === 'Low'
                ? 'bg-[#4ade80] text-black hover:bg-[#4ade80]/90'
                : 'bg-transparent text-white border border-gray-600 hover:bg-gray-800'
            }`}
          >
            Low
          </Button>
        </div>

        {/* Amount Selection */}
        <div className="flex justify-between">
          {amounts.map((amount) => (
            <Button
              key={amount}
              onClick={() => handleAmountSelect(amount)}
              className={`px-8 py-2 rounded-full text-sm font-medium border-0 border-input-0 ${
                selectedAmount === amount
                  ? 'bg-[#4ade80] text-black'
                  : 'bg-secondary text-white hover:bg-[#4b5563]'
              }`}
            >
              {amount}
            </Button>
          ))}
        </div>

        <div className="flex bg-secondary items-center rounded-lg">
          <div className="focus:outline-none focus:ring-0 focus:border-none p-1">
            <Input
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder="Enter amount"
              className="bg-secondary text-white text-2xl font-bold h-12 text-center focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:shadow-none"
            />

            <div className="text-gray-400 text-xs text-center">
              ${calculateUSDValue().toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 6 
              })}
            </div>
            <div className="text-gray-500 text-xs text-center">
              {currentToken.symbol} Price: ${currentToken.price.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 6 
              })}
            </div>
          </div>

          {/* Token Selector */}
          <div className="">
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger
                className="
                  w-full bg-transparent text-white h-12
                  ring-0 ring-offset-0 border-none outline-none shadow-none
                  focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none
                  focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-none
                "
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 relative">
                    {(currentToken.id === 'High' || currentToken.id === 'Low') ? (
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          currentToken.id === 'High' ? 'bg-[#4ade80]' : 'bg-[#ef4444]'
                        }`}
                      >
                        {currentToken.id === 'High' ? 'H' : 'L'}
                      </div>
                    ) : (
                      <Image
                        src={currentToken.icon || '/placeholder.svg'}
                        alt={currentToken.symbol}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                  </div>
                  <span className="font-medium">{currentToken.name}</span>
                </div>
              </SelectTrigger>

              <SelectContent className="bg-secondary border-gray-600">
                {tokens
                  .filter(token => 
                    token.id === 'usdc' || 
                    (selectedType === 'High' && token.id === 'High') || 
                    (selectedType === 'Low' && token.id === 'Low')
                  )
                  .map(token => (
                    <SelectItem key={token.id} value={token.id} className="text-white">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 relative">
                          {token.id === 'High' ? (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-[#4ade80]">
                              H
                            </div>
                          ) : token.id === 'Low' ? (
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-[#ef4444]">
                              L
                            </div>
                          ) : (
                            <Image
                              src={token.icon || '/placeholder.svg'}
                              alt={token.symbol}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{token.name}</span>
                          <span className="text-xs text-gray-400">{token.symbol}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Balance and Fees */}
        <div className="space-y-3 text-gray-400 text-sm">
          <div>
            {currentToken.symbol} Balance: {currentToken.balance} {currentToken.symbol}
          </div>
          <div>Swap fee (0.3%): {(calculateUSDValue() * 0.003).toFixed(8)}</div>
          <div>Gas Fee: 0.00000001</div>
          <div className="flex items-center gap-2">
            <span>
              Network: {currentChain && CHAIN_CONFIG[currentChain] 
                ? CHAIN_CONFIG[currentChain].name 
                : `Chain ${currentChain || 'Unknown'}`}
            </span>
            <div 
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: currentChain && CHAIN_CONFIG[currentChain] 
                  ? CHAIN_CONFIG[currentChain].color 
                  : '#gray'
              }}
            ></div>
          </div>
        </div>

        {/* Refresh Button */}
        <Button
          onClick={() => {
            fetchVixData();
            fetchTokenBalances();
          }}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-2"
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </Button>

        {/* Buy/Sell Buttons */}
        <div className="flex gap-3 pt-4">
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={() => { buyToken() }} 
              className="w-full h-14 bg-[#4ade80] hover:bg-[#4ade80]/90 text-black font-semibold text-lg rounded-2xl"
              disabled={isLoading}
            >
              Buy
            </Button>
          </motion.div>
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={() => { sellToken() }} 
              className="w-full h-14 bg-[#ef4444] hover:bg-[#ef4444]/90 text-white font-semibold text-lg rounded-2xl"
              disabled={isLoading}
            >
              Sell
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}