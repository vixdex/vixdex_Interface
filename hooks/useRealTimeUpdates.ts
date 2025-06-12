import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { CandlestickData, Time, ISeriesApi } from 'lightweight-charts';

interface PriceUpdatePayload {
  price0: number;
  price1: number;
  timestamp: string;
}

const timeToTimestamp = (time: Time): number => {
  if (typeof time === 'string') {
    return new Date(time).getTime();
  }
  if (typeof time === 'number') {
    return time * 1000;
  }
  const date = new Date(Date.UTC(time.year, time.month - 1, time.day));
  return date.getTime();
};

// SOLUTION: Remove setData, use only seriesRef and direct updates
export const useRealTimeUpdates = (
  room: string | null,
  seriesRef: React.MutableRefObject<ISeriesApi<'Candlestick'> | null>,
  priceType: 'price0' | 'price1',
  interval: number
) => {
  // Keep track of the last candle data internally
  const lastCandleRef = useRef<CandlestickData | null>(null);

  useEffect(() => {
    if (!room || !interval) return;
    const socket: Socket = io("http://localhost:4000");
    socket.emit("subscribe", room);
    console.log("subscribed to room", room);

    const handlePriceUpdate = (update: PriceUpdatePayload) => {
      console.log(update);
      
      if (!seriesRef.current) return;

      const newPrice = update[priceType];
      if (newPrice === undefined) return;

      const updateTimestamp = new Date(update.timestamp).getTime();

      // If we don't have a reference to the last candle, skip this update
      if (!lastCandleRef.current) return;

      const lastCandle = lastCandleRef.current;
      const lastCandleStartTime = timeToTimestamp(lastCandle.time);
      const lastCandleEndTime = lastCandleStartTime + interval;

      if (updateTimestamp < lastCandleEndTime) {
        // Case 1: UPDATE the existing candle
        const updatedCandle: CandlestickData = {
          ...lastCandle,
          high: Math.max(lastCandle.high, newPrice),
          low: Math.min(lastCandle.low, newPrice),
          close: newPrice,
        };
        
        // Update the chart directly - this preserves zoom/scroll
        seriesRef.current.update(updatedCandle);
        lastCandleRef.current = updatedCandle;

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

        // Add new candle to chart - this also preserves zoom/scroll
        seriesRef.current.update(newCandle);
        lastCandleRef.current = newCandle;
      }
    };

    socket.on("priceUpdate", handlePriceUpdate);

    return () => {
      socket.emit("unsubscribe", room);
      socket.disconnect();
    };
  }, [room, seriesRef, priceType, interval]);

  // Expose a function to sync the last candle when data loads
  return {
    syncLastCandle: (data: CandlestickData[]) => {
      if (data.length > 0) {
        lastCandleRef.current = data[data.length - 1];
      }
    }
  };
};
