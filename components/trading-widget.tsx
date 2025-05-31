'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';

interface Token {
  id: string;
  name: string;
  symbol: string;
  icon: string;
  balance: string;
}

const tokens: Token[] = [
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    icon: 'https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png',
    balance: '1250.50',
  },

  {
    id: 'btc',
    name: 'Bitcoin',
    symbol: 'BTC',
    icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
    balance: '0.125',
  },
];

export function TradingWidget() {
  const [selectedType, setSelectedType] = useState<'High' | 'Low'>('High');
  const [selectedAmount, setSelectedAmount] = useState<string>('1$');
  const [customAmount, setCustomAmount] = useState<string>('1');
  const [selectedToken, setSelectedToken] = useState<string>('shib');

  const amounts = ['1$', '10$', '20$'];
  const currentToken =
    tokens.find((token) => token.id === selectedToken) || tokens[0];

  const handleAmountSelect = (amount: string) => {
    setSelectedAmount(amount);
    // Extract number from amount string (e.g., "10$" -> "10")
    const numericAmount = amount.replace('$', '');
    setCustomAmount(numericAmount);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount('');
  };

  return (
    <Card className="w-full max-w-sm bg-black  border-gray-800">
      <CardContent className="p-6 space-y-4">
        {/* High/Low Toggle */}
        <div className="flex ">
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
        <div className="flex gap-x-6 ">
          {amounts.map((amount) => (
            <Button
              key={amount}
              onClick={() => handleAmountSelect(amount)}
              className={`px-4  rounded-full text-sm font-medium border-0 border-input-0 ${
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
          <div className=" focus:outline-none focus:ring-0 focus:border-none">
            <Input
              type="number"
              value={customAmount}
              onChange={(e) => handleCustomAmountChange(e.target.value)}
              placeholder="Enter amount"
              className="bg-secondary text-white text-2xl font-bold h-12 text-center focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:shadow-none"
            />

            <div className="text-gray-400 text-xs text-center">
              $
              {(Number.parseFloat(customAmount) * 2340).toLocaleString() ||
                '$0'}
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
                    <Image
                      src={currentToken.icon || '/placeholder.svg'}
                      alt={currentToken.symbol}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  </div>
                  <span className="font-medium">{currentToken.name}</span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-secondary border-gray-600">
                {tokens.map((token) => (
                  <SelectItem
                    key={token.id}
                    value={token.id}
                    className="text-white "
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 relative">
                        <Image
                          src={token.icon || '/placeholder.svg'}
                          alt={token.symbol}
                          width={24}
                          height={24}
                          className="rounded-full"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{token.name}</span>
                        <span className="text-xs text-gray-400">
                          {token.symbol}
                        </span>
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
            {currentToken.symbol} Balance: {currentToken.balance}{' '}
            {currentToken.symbol}
          </div>
          <div>Swap fee (0.3%): 0.0000001</div>
          <div>Gas Fee : 0.00000001</div>
          <div className="flex items-center gap-2">
            <span>network : unichain</span>
            <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
          </div>
        </div>

        {/* Buy/Sell Buttons */}
        <div className="flex gap-3 pt-4">
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button className="w-full h-14 bg-[#4ade80] hover:bg-[#4ade80]/90 text-black font-semibold text-lg rounded-2xl">
              Buy
            </Button>
          </motion.div>
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button className="w-full h-14 bg-[#ef4444] hover:bg-[#ef4444]/90 text-white font-semibold text-lg rounded-2xl">
              Sell
            </Button>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
