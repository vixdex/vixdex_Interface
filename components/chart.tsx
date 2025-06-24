'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useHistoricalPrices, TimeRange } from '../hooks/useHistoricalPrices';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';

interface CandlestickChartProps {
  networkId: string;
  poolId: string;
  priceType: 'price0' | 'price1';
  width?: number;
  height?: number;
}

const intervalMap: Record<TimeRange, number> = {
  '1H': 60 * 60 * 1000,
  '1D': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
};

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  networkId,
  poolId,
  priceType,
  width = 750,
  height = 400,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');

  const interval = intervalMap[timeRange];
  const { data, isLoading, error } = useHistoricalPrices(networkId, poolId, interval, priceType);
  const room = poolId ? poolId.toLowerCase() : `network-${networkId}`;
  
  // SOLUTION: Only pass seriesRef, no setData
  const { syncLastCandle } = useRealTimeUpdates(room, seriesRef, priceType, interval);

  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        width,
        height,
        layout: { background: { color: 'transparent' }, textColor: '#DDD' },
        grid: { vertLines: { color: '#333' }, horzLines: { color: '#333' } },
        timeScale: { timeVisible: true, secondsVisible: false, borderColor: '#555' },
        crosshair: { mode: 1 },
      });
      seriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,
        wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      });
    }

    // SOLUTION: Only use setData for historical loads and major changes
    if (seriesRef.current && data.length > 0) {
      try {
        seriesRef.current.setData(data);
        chartRef.current?.timeScale().fitContent();
        
        // Sync the last candle with the real-time hook
        syncLastCandle(data);
        
      } catch (error) {
        console.error('Error setting chart data:', error);
        console.log('Problematic data:', data);
        if (seriesRef.current) {
          seriesRef.current.setData([]);
        }
      }
    }

    const handleResize = () => chartRef.current?.resize(chartContainerRef.current!.clientWidth, chartContainerRef.current!.clientHeight);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, width, height, syncLastCandle]);

  const timeRangeOptions: TimeRange[] = ['1H', '1D', '1W', '1M'];

  return (
    <div className="w-full">
      <div className="mb-4 flex space-x-2">
        {timeRangeOptions.map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              timeRange === range ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
      <div ref={chartContainerRef} style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
        {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white font-semibold">Loading Chart Data...</div>}
        {error && !isLoading && <div className="absolute inset-0 flex items-center justify-center bg-red-900 bg-opacity-75 text-white font-semibold">Error: {error}</div>}
      </div>
    </div>
  );
};

export default CandlestickChart;
