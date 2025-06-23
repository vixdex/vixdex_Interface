"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { fetchPairInitiatedEvents } from "@/lib/fetchEvents";
import { useWallets } from "@privy-io/react-auth";

const VIX_ABI = [
  'function getVixData(address poolAdd) view returns (address vixHighToken, address _vixLowToken, uint256 _circulation0, uint256 _circulation1, uint256 _contractHoldings0, uint256 _contractHoldings1, uint256 _reserve0, uint256 _reserve1, address _poolAddress)',
  'function vixTokensPrice(uint contractHoldings) view returns(uint)'
];

type TokenInfo = {
  id: string;
  name: string;
  symbol: string;
  priceHigh: string;
  priceLow: string;
  icon0: string;
    icon1: string;

  deriveToken: string;
};

export default function VixPage() {
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { wallets } = useWallets();

  useEffect(() => {
    const fetchAllData = async () => {
      if (wallets.length === 0) {
        console.warn("No wallets connected yet.");
        return;
      }

      const wallet = wallets[0];
      const privyProvider = await wallet.getEthereumProvider();
      const ethersProvider = new ethers.BrowserProvider(privyProvider);
      const signer = await ethersProvider.getSigner();
      const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);


      const vixContract = new ethers.Contract(
        process.env.NEXT_PUBLIC_VIX_CONTRACT_ADDRESS!,
        VIX_ABI,
        provider
      );

      const events = await fetchPairInitiatedEvents();
      console.log(events) // must return _deriveToken, _vixHighToken, _vixLowToken

      const result: TokenInfo[] = [];

      for (const event of events) {
        try {
          const deriveToken = event.deriveToken;
          console.log("d token" , deriveToken)
          const vixData = await vixContract.getVixData(deriveToken);
          console.log("vdata",vixData)
          const poolAddress = vixData._poolAddress;
          console.log("pool add", poolAddress)

          // Prices
          const token0Price = await vixContract.vixTokensPrice(vixData._contractHoldings0);
          const token1Price = await vixContract.vixTokensPrice(vixData._contractHoldings1);
          const priceHigh = ethers.formatEther(token0Price);
          console.log("high price" ,priceHigh)
          const priceLow = ethers.formatEther(token1Price);
                    console.log("Low price" ,priceLow)



          // Token info from GeckoTerminal
          const geckoTerminalURL = `${process.env.NEXT_PUBLIC_GEKO_TERMINAL_URL}networks/${process.env.NEXT_PUBLIC_NETWORK}/pools/${poolAddress}?`;
          const res = await fetch(geckoTerminalURL);
          const data = await res.json();

          result.push({
            id: poolAddress,
            name: data.data.attributes.name,
            symbol: data.data.attributes.pool_name,
            icon0: data.included[0]?.attributes?.image_url ?? '',
            icon1: data.included[1]?.attributes?.image_url ?? '',

            
            priceHigh: `${priceHigh}$`,
            priceLow: `${priceLow}$`,
            deriveToken
          });

          console.log(result)
        } catch (err) {
          console.warn("Skipping pair due to error:", err);
        }
      }

      setTokens(result);
      setLoading(false);
    };

    fetchAllData();
  }, [wallets]);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {tokens.map((token) => (
        <div key={token.id} className="border p-4 rounded-lg mb-2">
          <img src={token.icon0} alt={token.symbol} width={40} />
                    <img src={token.icon1} alt={token.symbol} width={40} />

          <h2>{token.name}</h2>
          <p>Symbol: {token.symbol}</p>
          <p>High Token Price: {token.priceHigh}</p>
          <p>Low Token Price: {token.priceLow}</p>
        </div>
      ))}
    </div>
  );
}
