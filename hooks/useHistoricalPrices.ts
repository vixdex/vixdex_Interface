import { useState, useEffect } from 'react';
import { CandlestickData, UTCTimestamp } from 'lightweight-charts';

interface PriceHistoryDoc {
  meta: { poolId: string; originalPoolId: string; networkId: string };
  price0: number;
  price1: number;
  timestamp: string;
}

// The TimeRange type is exported so the chart component can use it for state.
export type TimeRange = '1H' | '4H' | '1D' | '1W' | '1M';

/**
 * Aggregates a list of individual trades into candlestick (OHLC) data.
 * @param prices The raw list of price documents from your API.
 * @param interval The candle interval in milliseconds.
 * @param priceType The key of the price to use ('price0' or 'price1').
 */

const aggregateToCandlesticks = (
  prices: PriceHistoryDoc[],
  interval: number,
  priceType: 'price0' | 'price1'
): CandlestickData[] => {
  if (!prices || prices.length === 0) return [];

  const candles = new Map<
    number,
    {
      open: number;
      high: number;
      low: number;
      close: number;
      firstTimestamp: number;
    }
  >();

  prices.forEach((price) => {
    const priceValue = price[priceType];
    if (priceValue === undefined) return;

    const priceTimestamp = new Date(price.timestamp).getTime();
    // Use the actual timestamp as the key instead of a date string
    const candleTimeStart = Math.floor(priceTimestamp / interval) * interval;

    if (!candles.has(candleTimeStart)) {
      candles.set(candleTimeStart, {
        open: priceValue,
        high: priceValue,
        low: priceValue,
        close: priceValue,
        firstTimestamp: priceTimestamp,
      });
    } else {
      const candle = candles.get(candleTimeStart)!;
      candle.high = Math.max(candle.high, priceValue);
      candle.low = Math.min(candle.low, priceValue);
      candle.close = priceValue;
    }
  });

  // Convert to the format expected by lightweight-charts
  const result = Array.from(candles.entries())
    .map(([timestamp, data]) => ({
      time: Math.floor(timestamp / 1000) as UTCTimestamp, // Convert to seconds and cast to UTCTimestamp
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
    }))
    .sort((a, b) => (a.time as number) - (b.time as number)); // Ensure ascending order

  // Remove any potential duplicates (just in case)
  const uniqueResult = result.filter(
    (item, index, arr) => index === 0 || item.time !== arr[index - 1].time
  );

  return uniqueResult;
};
/**
 * Custom hook to fetch historical price data.
 * @param networkId The ID of the network.
 * @param poolId The specific pool address.
 * @param interval MODIFIED: The candle interval in milliseconds, passed from the component.
 * @param priceType The key of the price to display ('price0' or 'price1').
 */
export const useHistoricalPrices = (
  networkId: string,
  poolId: string,
  interval: number,
  priceType: 'price0' | 'price1'
) => {
  const [data, setData] = useState<CandlestickData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      if (!poolId || !interval) return;

      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ limit: '5000' });
      if (networkId) params.append('networkId', networkId);
      if (poolId) params.append('poolId', poolId);

      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_NODE_URL || 'http://localhost:8000';
        const response = await fetch(`${baseUrl}/prices/${poolId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch data (${response.status}): ${errorText}`
          );
        }

        const responseData = await response.json();

        if (!responseData || !responseData.data || !responseData.data.chart) {
          throw new Error('Invalid data format received from server');
        }

        // Transform the data to match our expected format
        const rawData = responseData.data.chart.map((item: any) => ({
          meta: {
            poolId: responseData.data.poolAddress,
            originalPoolId: responseData.data.poolAddress,
            networkId: '1', // Assuming mainnet for now
          },
          price0: item.price0,
          price1: item.price1,
          timestamp: new Date(item.time * 1000).toISOString(),
        }));

        console.log('Fetched price data:', rawData.slice(0, 3));
        const candleData = aggregateToCandlesticks(
          rawData,
          interval,
          priceType
        );
        console.log('Processed candle data:', candleData.slice(0, 3));

        setData(candleData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndProcessData();
    // MODIFIED: Dependency array now uses `interval` instead of `timeRange`.
  }, [networkId, poolId, interval, priceType]);

  return { data, isLoading, error, setData };
};
