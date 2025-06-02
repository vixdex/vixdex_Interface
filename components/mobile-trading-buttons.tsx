'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const dummyToken = {
  name: 'SHIBA/USDC.HIGH TOKEN',
  address: '0xf353...128',
  logo: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
  price: 0.0002091,
  change: '+23%',
  userBalance: '5239732',
  swapFee: '0.00000019 USDC',
  gasFee: '0.00000004 ETH',
  tokenName: 'H-SHIB',
  network: 'unichain',
};

export function MobileTradingButtons() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<'buy' | 'sell' | null>(null);
  const [selectedType, setSelectedType] = useState<'High' | 'Low'>('High');
  const [customAmount, setCustomAmount] = useState<string>('1');

  const openTrading = (action: 'buy' | 'sell') => {
    setActiveAction(action);
    setIsOpen(true);
  };

  const closeTrading = () => {
    setIsOpen(false);
    setActiveAction(null);
    setCustomAmount('1'); // Reset amount on close
  };

  // Handle input change with validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and ensure non-negative
    if (/^\d*\.?\d*$/.test(value) && Number(value) >= 0) {
      setCustomAmount(value);
    }
  };

  // Calculate USD value based on input
  const usdValue = (Number(customAmount || 0) * dummyToken.price).toFixed(2);

  return (
    <>
      {/* Fixed bottom buttons - only show on mobile/tablet */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border/40 md:hidden z-40">
        <div className="flex gap-3 max-w-sm mx-auto">
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => openTrading('buy')}
              className="w-full h-14 bg-[#4ade80] hover:bg-[#4ade80]/90 text-black font-semibold text-lg rounded-2xl"
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
              onClick={() => openTrading('sell')}
              className="w-full h-14 bg-[#ef4444] hover:bg-[#ef4444]/90 text-white font-semibold text-lg rounded-2xl"
            >
              Sell
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Trading popup modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-full max-w-sm bg-[#1a1a1a] rounded-t-3xl md:rounded-lg overflow-hidden shadow-xl max-h-[90vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden">
                    <img
                      src={dummyToken.logo}
                      alt={dummyToken.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {dummyToken.name}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Address {dummyToken.address}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeTrading}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Price info */}
              <div className="p-4 border-b border-gray-800">
                <div className="text-2xl font-bold text-white">
                  {dummyToken.price.toFixed(7)}
                </div>
                <div
                  className={
                    dummyToken.change.startsWith('+')
                      ? 'text-[#4ade80] text-sm'
                      : 'text-[#ef4444] text-sm'
                  }
                >
                  {dummyToken.change}
                </div>
              </div>

              {/* Trading content */}
              <div className="p-4 space-y-6">
                {/* High/Low Toggle */}
                <div className="flex gap-2">
                  {['High', 'Low'].map((type) => (
                    <Button
                      key={type}
                      onClick={() => setSelectedType(type as 'High' | 'Low')}
                      className={`flex-1 h-12 rounded-2xl font-medium text-lg ${
                        selectedType === type
                          ? 'bg-[#4ade80] text-black hover:bg-[#4ade80]/90'
                          : 'bg-transparent text-white border border-gray-600 hover:bg-gray-800'
                      }`}
                    >
                      {type}
                    </Button>
                  ))}
                </div>

                {/* Amount input */}
                <div className="bg-[#2a2a2a] rounded-lg p-4">
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleAmountChange}
                    className="w-full text-6xl font-bold text-white text-center mb-2 bg-transparent border-none outline-none"
                    placeholder="0"
                  />
                  <div className="text-gray-400 text-center mb-4">
                    ${usdValue}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={dummyToken.logo}
                        alt={dummyToken.tokenName}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-white">{dummyToken.tokenName}</span>
                    </div>
                    <div className="text-gray-400">⇄</div>
                  </div>
                </div>

                {/* Buy/Sell Buttons */}
                <div className="flex gap-3">
                  {['buy', 'sell'].map((type) => (
                    <Button
                      key={type}
                      className={`flex-1 h-14 font-semibold text-lg rounded-2xl ${
                        activeAction === type
                          ? type === 'buy'
                            ? 'bg-[#4ade80] text-black hover:bg-[#4ade80]/90'
                            : 'bg-[#ef4444] text-white hover:bg-[#ef4444]/90'
                          : 'bg-transparent border border-gray-600 text-white hover:bg-gray-800'
                      }`}
                    >
                      {type.toUpperCase()}
                    </Button>
                  ))}
                </div>

                {/* Fees and balance */}
                <div className="space-y-2 text-gray-400 text-sm">
                  <div>
                    {dummyToken.tokenName} Balance: {dummyToken.userBalance}{' '}
                    {dummyToken.tokenName}
                  </div>
                  <div>Swap fee (0.3%): {dummyToken.swapFee}</div>
                  <div>Gas Fee: {dummyToken.gasFee}</div>
                  <div className="flex items-center gap-2">
                    <span>Network: {dummyToken.network}</span>
                    <div className="w-4 h-4 bg-pink-500 rounded-full" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileTradingButtons;
