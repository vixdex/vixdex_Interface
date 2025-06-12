import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { CandlestickData, Time } from 'lightweight-charts';

// The shape of the incoming WebSocket price update payload.
interface PriceUpdatePayload {
  price0: number;
  price1: number;
  timestamp: string;
}

// --- NEW HELPER FUNCTION ---
/**
 * Safely converts the `Time` type from lightweight-charts into a millisecond timestamp.
 * This function handles all possible formats: string, number (timestamp), or BusinessDay object.
 * @param time The Time object from a candlestick data point.
 * @returns A numeric timestamp in milliseconds.
 */
const timeToTimestamp = (time: Time): number => {
  // If it's a string like "2025-06-12", convert it.
  if (typeof time === 'string') {
    return new Date(time).getTime();
  }
  // If it's a number (Unix timestamp in seconds), convert to milliseconds.
  if (typeof time === 'number') {
    return time * 1000;
  }
  // If it's a BusinessDay object, construct a date string and convert it.
  // This is the key part that solves the TypeScript error.
  const date = new Date(Date.UTC(time.year, time.month - 1, time.day));
  return date.getTime();
};

export const useRealTimeUpdates = (
  room: string | null,
  setData: React.Dispatch<React.SetStateAction<CandlestickData[]>>,
  priceType: 'price0' | 'price1',
  interval: number
) => {
  useEffect(() => {
    if (!room || !interval) return;
    const socket: Socket = io("http://localhost:4000");
    socket.emit("subscribe", room);
    console.log("subscribed to rooom",room);

    const handlePriceUpdate = (update: PriceUpdatePayload) => {
      console.log(update)
      setData(prevData => {
        if (prevData.length === 0) return prevData;

        const lastCandle = { ...prevData[prevData.length - 1] };
        const newPrice = update[priceType];
        if (newPrice === undefined) return prevData;

        // MODIFIED: Use the safe helper function to get timestamps.
        const lastCandleStartTime = timeToTimestamp(lastCandle.time);
        const updateTimestamp = new Date(update.timestamp).getTime();
        const lastCandleEndTime = lastCandleStartTime + interval;

        if (updateTimestamp < lastCandleEndTime) {
          // Case 1: UPDATE the existing candle
          lastCandle.high = Math.max(lastCandle.high, newPrice);
          lastCandle.low = Math.min(lastCandle.low, newPrice);
          lastCandle.close = newPrice;
          
          return [...prevData.slice(0, -1), lastCandle];

        } else {
          // Case 2: CREATE a new candle
          const newCandleStartTime = Math.floor(updateTimestamp / interval) * interval;
          const newCandleTimeKey = new Date(newCandleStartTime).toISOString().split('T')[0];

          const newCandle: CandlestickData = {
            time: newCandleTimeKey,
            open: newPrice,
            high: newPrice,
            low: newPrice,
            close: newPrice,
          };

          return [...prevData, newCandle];
        }
      });
    };

    socket.on("priceUpdate", handlePriceUpdate);

    return () => {
      socket.emit("unsubscribe", room);
      socket.disconnect();
    };
  }, [room, setData, priceType, interval]);
};
