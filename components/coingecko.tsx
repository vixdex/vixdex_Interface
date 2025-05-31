import { useEffect, useState } from 'react';

interface Token {
  id: string;
  name: string;
  symbol: string;
  address?: string;
  icon: string;
  badge?: {
    color: string;
    icon: JSX.Element;
  };
}

const [popularTokens, setPopularTokens] = useState<Token[]>([]);

useEffect(() => {
  const fetchTokenData = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum,usd-coin,tether'
      );
      const data = await response.json();

      const tokens: Token[] = data.map((token: any) => ({
        id: token.id,
        name: token.name,
        symbol: token.symbol.toUpperCase(),
        icon: token.image,
        // Add address and badge if needed
      }));

      setPopularTokens(tokens);
    } catch (error) {
      console.error('Error fetching token data:', error);
    }
  };

  fetchTokenData();
}, []);
