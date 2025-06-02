'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
} from 'lightweight-charts';

// Define the shape of candlestick data
interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Props for the chart component
interface CandlestickChartProps {
  width?: number;
  height?: number;
}

// Available time ranges
type TimeRange = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y';

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  width = 600,
  height = 400,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');

  // Generate random candlestick data based on the selected range
  const generateRandomData = (range: TimeRange): CandleData[] => {
    const data: CandleData[] = [];
    const startDate = new Date('2025-01-01');
    let lastClose = 100;

    // Define the number of data points based on the range
    const rangeDays: Record<TimeRange, number> = {
      '1D': 1,
      '5D': 5,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
    };

    const days = rangeDays[range];

    for (let i = 0; i < days; i++) {
      const time = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const open = lastClose;
      const change = (Math.random() - 0.5) * 10;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 5;
      const low = Math.min(open, close) - Math.random() * 5;

      data.push({
        time: time.toISOString().split('T')[0], // Format as YYYY-MM-DD
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
      });

      lastClose = close;
    }

    return data;
  };

  useEffect(() => {
    if (chartContainerRef.current) {
      // Initialize the chart
      chartRef.current = createChart(chartContainerRef.current, {
        width,
        height,
        layout: {
          background: { color: '#000000' },
          textColor: '#333',
        },
        grid: {
          vertLines: { color: '#000000' },
          horzLines: { color: '#000000' },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
        },
      });

      // Add candlestick series
      seriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#26a69a',
        downColor: '#ef5350',
        borderVisible: false,
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
      });

      // Set initial data
      const data = generateRandomData(selectedRange);
      seriesRef.current.setData(data);

      // Auto-resize chart on window resize
      const handleResize = () => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.resize(
            chartContainerRef.current.clientWidth,
            chartContainerRef.current.clientHeight
          );
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup on unmount
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
      };
    }
  }, [width, height]);

  // Update chart data when the range changes
  useEffect(() => {
    if (seriesRef.current && chartRef.current) {
      const data = generateRandomData(selectedRange);
      seriesRef.current.setData(data);
      chartRef.current.timeScale().fitContent();
    }
  }, [selectedRange]);

  // Handle range selection
  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
  };

  // Time range options
  const timeRanges: TimeRange[] = ['1D', '5D', '1M', '1Y'];

  return (
    <div className="w-full max-w-3xl mx-auto p-4 shadow-md rounded-lg bg-transparent">
      {/* Range Switcher */}
      <div className="mb-4 flex space-x-2">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => handleRangeChange(range)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedRange === range
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {range}
          </button>
        ))}
      </div>
      {/* Chart Container */}
      <div
        ref={chartContainerRef}
        style={{ width: '100%', height: `${height}px` }}
      />
    </div>
  );
};

export default CandlestickChart;
