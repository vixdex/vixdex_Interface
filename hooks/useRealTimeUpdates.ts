import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { CandlestickData, Time, ISeriesApi } from 'lightweight-charts';

interface PriceUpdatePayload {
  price0: number;
  price1: number;
  timestamp: string;
}

interface UseRealTimeUpdatesReturn {
  syncLastCandle: (data: CandlestickData[]) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastError: string | null;
}

const timeToTimestamp = (time: Time): number => {
  try {
    if (typeof time === 'string') {
      const timestamp = new Date(time).getTime();
      if (isNaN(timestamp)) {
        throw new Error(`Invalid time string: ${time}`);
      }
      return timestamp;
    }
    if (typeof time === 'number') {
      if (!isFinite(time) || time < 0) {
        throw new Error(`Invalid time number: ${time}`);
      }
      return time * 1000;
    }
    
    // Handle BusinessDay object
    if (time && typeof time === 'object' && 'year' in time && 'month' in time && 'day' in time) {
      const { year, month, day } = time;
      if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) {
        throw new Error(`Invalid date object: ${JSON.stringify(time)}`);
      }
      const date = new Date(Date.UTC(year, month - 1, day));
      const timestamp = date.getTime();
      if (isNaN(timestamp)) {
        throw new Error(`Invalid date created from: ${JSON.stringify(time)}`);
      }
      return timestamp;
    }
    
    throw new Error(`Unsupported time format: ${typeof time}`);
  } catch (error) {
    console.error('Error converting time to timestamp:', error);
    throw error;
  }
};

const validatePriceUpdate = (update: any): update is PriceUpdatePayload => {
  if (!update || typeof update !== 'object') {
    return false;
  }
  
  const { price0, price1, timestamp } = update;
  
  // Check if at least one price is valid
  const hasValidPrice0 = typeof price0 === 'number' && isFinite(price0) && price0 >= 0;
  const hasValidPrice1 = typeof price1 === 'number' && isFinite(price1) && price1 >= 0;
  
  if (!hasValidPrice0 && !hasValidPrice1) {
    return false;
  }
  
  // Check timestamp
  if (!timestamp || typeof timestamp !== 'string') {
    return false;
  }
  
  const timestampDate = new Date(timestamp);
  if (isNaN(timestampDate.getTime())) {
    return false;
  }
  
  return true;
};

export const useRealTimeUpdates = (
  room: string | null,
  seriesRef: React.MutableRefObject<ISeriesApi<'Candlestick'> | null>,
  priceType: 'price0' | 'price1',
  interval: number
): UseRealTimeUpdatesReturn => {
  const lastCandleRef = useRef<CandlestickData | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const connectionStatusRef = useRef<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const lastErrorRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 3000; // 3 seconds

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (socketRef.current) {
      try {
        if (room) {
          socketRef.current.emit("unsubscribe", room);
        }
        socketRef.current.disconnect();
      } catch (error) {
        console.error('Error during socket cleanup:', error);
      }
      socketRef.current = null;
    }
    
    connectionStatusRef.current = 'disconnected';
  }, [room]);

  const connectSocket = useCallback(() => {
    if (!room || !interval || interval <= 0) {
      lastErrorRef.current = 'Invalid room or interval';
      connectionStatusRef.current = 'error';
      return;
    }

    try {
      cleanup(); // Clean up any existing connection
      
      connectionStatusRef.current = 'connecting';
      lastErrorRef.current = null;
      
      const socket: Socket = io("http://localhost:4000", {
        timeout: 10000,
        reconnection: false, // We'll handle reconnection manually
        forceNew: true
      });
      
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket connected');
        connectionStatusRef.current = 'connected';
        reconnectAttemptsRef.current = 0;
        lastErrorRef.current = null;
        
        try {
          socket.emit("subscribe", room);
          console.log("Subscribed to room:", room);
        } catch (error) {
          console.error('Error subscribing to room:', error);
          lastErrorRef.current = `Failed to subscribe to room: ${error}`;
          connectionStatusRef.current = 'error';
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        connectionStatusRef.current = 'disconnected';
        
        // Attempt reconnection if it wasn't a manual disconnect
        if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting reconnection ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSocket();
          }, RECONNECT_DELAY);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          lastErrorRef.current = 'Max reconnection attempts reached';
          connectionStatusRef.current = 'error';
        }
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        lastErrorRef.current = `Connection error: ${error.message}`;
        connectionStatusRef.current = 'error';
        
        // Attempt reconnection
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSocket();
          }, RECONNECT_DELAY);
        }
      });

      const handlePriceUpdate = (update: any) => {
        try {
          console.log('Received price update:', update);
          
          // Validate the update payload
          if (!validatePriceUpdate(update)) {
            console.error('Invalid price update payload:', update);
            return;
          }
          
          if (!seriesRef.current) {
            console.warn('Series reference is null, skipping update');
            return;
          }

          const newPrice = update[priceType];
          if (newPrice === undefined || !isFinite(newPrice) || newPrice < 0) {
            console.warn(`Invalid price for ${priceType}:`, newPrice);
            return;
          }

          const updateTimestamp = new Date(update.timestamp).getTime();
          if (isNaN(updateTimestamp)) {
            console.error('Invalid timestamp in update:', update.timestamp);
            return;
          }

          // If we don't have a reference to the last candle, skip this update
          if (!lastCandleRef.current) {
            console.warn('No last candle reference, skipping update');
            return;
          }

          const lastCandle = lastCandleRef.current;
          let lastCandleStartTime: number;
          
          try {
            lastCandleStartTime = timeToTimestamp(lastCandle.time);
          } catch (error) {
            console.error('Error converting last candle time:', error);
            return;
          }
          
          const lastCandleEndTime = lastCandleStartTime + interval;

          if (updateTimestamp < lastCandleEndTime) {
            // Case 1: UPDATE the existing candle
            try {
              const updatedCandle: CandlestickData = {
                ...lastCandle,
                high: Math.max(lastCandle.high, newPrice),
                low: Math.min(lastCandle.low, newPrice),
                close: newPrice,
              };
              
              seriesRef.current.update(updatedCandle);
              lastCandleRef.current = updatedCandle;
              console.log('Updated existing candle');
              
            } catch (error) {
              console.error('Error updating existing candle:', error);
            }

          } else {
            // Case 2: CREATE a new candle
            try {
              const newCandleStartTime = Math.floor(updateTimestamp / interval) * interval;
              const newCandleTimeKey = new Date(newCandleStartTime).toISOString().split('T')[0];

              const newCandle: CandlestickData = {
                time: newCandleTimeKey,
                open: newPrice,
                high: newPrice,
                low: newPrice,
                close: newPrice,
              };

              seriesRef.current.update(newCandle);
              lastCandleRef.current = newCandle;
              console.log('Created new candle');
              
            } catch (error) {
              console.error('Error creating new candle:', error);
            }
          }
        } catch (error) {
          console.error('Error in handlePriceUpdate:', error);
          lastErrorRef.current = `Price update error: ${error}`;
        }
      };

      socket.on("priceUpdate", handlePriceUpdate);

    } catch (error) {
      console.error('Error setting up socket connection:', error);
      lastErrorRef.current = `Setup error: ${error}`;
      connectionStatusRef.current = 'error';
    }
  }, [room, seriesRef, priceType, interval, cleanup]);

  useEffect(() => {
    connectSocket();
    return cleanup;
  }, [connectSocket, cleanup]);

  const syncLastCandle = useCallback((data: CandlestickData[]) => {
    try {
      if (!Array.isArray(data)) {
        console.error('syncLastCandle: data is not an array');
        return;
      }
      
      if (data.length > 0) {
        const lastCandle = data[data.length - 1];
        
        // Validate the last candle
        if (!lastCandle || 
            typeof lastCandle.open !== 'number' || 
            typeof lastCandle.high !== 'number' || 
            typeof lastCandle.low !== 'number' || 
            typeof lastCandle.close !== 'number' ||
            !isFinite(lastCandle.open) || 
            !isFinite(lastCandle.high) || 
            !isFinite(lastCandle.low) || 
            !isFinite(lastCandle.close)) {
          console.error('Invalid last candle data:', lastCandle);
          return;
        }
        
        lastCandleRef.current = lastCandle;
        console.log('Synced last candle:', lastCandle);
      } else {
        console.warn('No data provided to syncLastCandle');
        lastCandleRef.current = null;
      }
    } catch (error) {
      console.error('Error in syncLastCandle:', error);
      lastErrorRef.current = `Sync error: ${error}`;
    }
  }, []);

  return {
    syncLastCandle,
    connectionStatus: connectionStatusRef.current,
    lastError: lastErrorRef.current
  };
};