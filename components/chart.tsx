'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  ISeriesApi,
  ColorType,
  LineStyle,
  UTCTimestamp,
  CandlestickData,
} from 'lightweight-charts';
import { io } from 'socket.io-client';
import { useHistoricalPrices, TimeRange } from '@/hooks/useHistoricalPrices';

interface ChartProps {
  networkId: string;
  poolId: string;
  priceType: 'price0' | 'price1';
  height?: number;
  className?: string;
}

const socket = io(process.env.NEXT_PUBLIC_NODE_URL || 'http://localhost:8000');

const CandlestickChart: React.FC<ChartProps> = ({
  networkId,
  poolId,
  priceType,
  height = 400,
  className = '',
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1D');
  const chartRef = useRef<ISeriesApi<'Area'> | null>(null);
  const chartInstance = useRef<any>(null);
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Convert time range to milliseconds
  const getIntervalMs = useCallback((range: TimeRange): number => {
    switch (range) {
      case '1H':
        return 5 * 60 * 1000; // 5 minutes
      case '4H':
        return 15 * 60 * 1000; // 15 minutes
      case '1D':
        return 60 * 60 * 1000; // 1 hour
      default:
        return 60 * 60 * 1000; // Default to 1 hour
    }
  }, []);

  const intervalMs = getIntervalMs(selectedRange);
  const {
    data: priceData,
    isLoading,
    error,
  } = useHistoricalPrices(networkId, poolId, intervalMs, priceType);

  const [chartData, setChartData] = useState<CandlestickData[]>([]);

  // Responsive height calculation
  const getResponsiveHeight = useCallback(() => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      if (screenWidth < 640) {
        // sm breakpoint
        return Math.min(height * 0.7, 250); // Reduce height on mobile
      } else if (screenWidth < 1024) {
        // lg breakpoint
        return Math.min(height * 0.85, 300); // Slightly reduce on tablet
      }
    }
    return height;
  }, [height]);

  // Handle resize and get container dimensions
  const updateDimensions = useCallback(() => {
    if (chartContainerRef.current) {
      const container = chartContainerRef.current;
      const rect = container.getBoundingClientRect();
      const responsiveHeight = getResponsiveHeight();

      setChartDimensions({
        width: rect.width || container.offsetWidth,
        height: responsiveHeight,
      });
    }
  }, [getResponsiveHeight]);

  // Update dimensions on mount and resize
  useEffect(() => {
    updateDimensions();

    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  let redTheme = {
    lineColor: '#EF4444', // red-500
    topColor: 'rgba(239, 68, 68, 0.2)',
    bottomColor: 'rgba(239, 68, 68, 0.02)',
    lineWidth: 2,
  };

  let greenTheme = {
    lineColor: '#10B981', // emerald-500
    topColor: 'rgba(16, 185, 129, 0.2)',
    bottomColor: 'rgba(16, 185, 129, 0.02)',
    lineWidth: 2,
  };

  // Handle chart initialization and updates
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !priceData.length || !chartDimensions.width) return;

    // Clear previous chart
    container.innerHTML = '';

    // Responsive chart options
    const isMobile = chartDimensions.width < 640;
    const isTablet =
      chartDimensions.width >= 640 && chartDimensions.width < 1024;

    const chartOptions = {
      layout: {
        textColor: '#9CA3AF', // gray-400
        background: {
          type: ColorType.Solid,
          color: '#111827', // gray-900
        },
        fontFamily: 'Inter, sans-serif',
        fontSize: isMobile ? 10 : 12,
      },
      grid: {
        vertLines: {
          visible: !isMobile, // Hide vertical lines on mobile for cleaner look
          style: LineStyle.Solid,
          color: 'rgba(156, 163, 175, 0.1)', // gray-400 with opacity
        },
        horzLines: {
          visible: true,
          style: LineStyle.Solid,
          color: 'rgba(156, 163, 175, 0.1)', // gray-400 with opacity
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(156, 163, 175, 0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        minimumWidth: isMobile ? 50 : 60,
      },
      timeScale: {
        borderColor: 'rgba(156, 163, 175, 0.1)',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: isMobile ? 5 : 10,
        barSpacing: isMobile ? 3 : 6,
        minBarSpacing: isMobile ? 1 : 3,
      },
      crosshair: {
        horzLine: {
          color: 'rgba(156, 163, 175, 0.2)',
          width: 1 as const,
          style: LineStyle.Dashed,
        },
        vertLine: {
          color: 'rgba(156, 163, 175, 0.2)',
          width: 1 as const,
          style: LineStyle.Dashed,
        },
      },
      handleScroll: {
        mouseWheel: !isMobile, // Disable mouse wheel on mobile
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: !isMobile,
        mouseWheel: !isMobile,
        pinch: isMobile, // Enable pinch zoom on mobile
      },
    };

    // Create chart instance
    chartInstance.current = createChart(container, {
      ...chartOptions,
      width: chartDimensions.width,
      height: chartDimensions.height,
    });

    // Convert price data to area series format
    const areaData = priceData.map((item) => ({
      time: item.time as UTCTimestamp,
      value: (item as any)[priceType] || 0,
    }));

    // Add area series to chart
    const areaSeries = chartInstance.current.addAreaSeries({
      ...(areaData[0]?.value < areaData[areaData.length - 1]?.value
        ? greenTheme
        : redTheme),
      lineWidth: isMobile ? 1.5 : 2,
      priceScaleId: 'right',
    });

    areaSeries.setData(areaData);
    chartInstance.current.timeScale().fitContent();

    // Store series reference
    chartRef.current = areaSeries;

    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.remove();
        chartInstance.current = null;
      }
      chartRef.current = null;
    };
  }, [priceData, priceType, chartDimensions]);

  // Handle chart resize
  useEffect(() => {
    if (chartInstance.current && chartDimensions.width > 0) {
      chartInstance.current.applyOptions({
        width: chartDimensions.width,
        height: chartDimensions.height,
      });
    }
  }, [chartDimensions]);

  socket.on('connectedMsg', () => {
    console.log('success');
  });

  // Handle real-time price updates
  useEffect(() => {
    if (!chartRef.current) return;

    const handleNewPrice = (res: any) => {
      if (res.poolId === poolId) {
        const timestamp = Math.floor(Date.now() / 1000) as UTCTimestamp;
        const newPrice =
          priceType === 'price0'
            ? (res.price0 || 0) / 1e18
            : (res.price1 || 0) / 1e18;

        // Update the last data point or add a new one
        chartRef.current?.update({ time: timestamp, value: newPrice });
      }
    };

    socket.on('newPrice', handleNewPrice);

    return () => {
      socket.off('newPrice', handleNewPrice);
    };
  }, [poolId, priceType]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-1 sm:space-x-2">
              {['1H', '4H', '1D'].map((range) => (
                <div
                  key={range}
                  className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg bg-gray-700 text-gray-400 animate-pulse"
                >
                  {range}
                </div>
              ))}
            </div>
          </div>
          <div
            className="flex items-center justify-center bg-gray-800 rounded-lg"
            style={{ height: `${getResponsiveHeight()}px` }}
          >
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-gray-800">
          <div
            className="flex items-center justify-center text-center text-red-500 p-4 text-sm sm:text-base"
            style={{ height: `${getResponsiveHeight()}px` }}
          >
            <div>
              <div className="mb-2">⚠️</div>
              <div>Error loading chart</div>
              <div className="text-xs text-gray-400 mt-1">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="bg-gray-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-1 sm:space-x-2">
            {['1H', '4H', '1D'].map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range as TimeRange)}
                className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-colors ${
                  selectedRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div
          ref={chartContainerRef}
          className="w-full touch-pan-x touch-pan-y"
          style={{ height: `${getResponsiveHeight()}px` }}
        />
      </div>
    </div>
  );
};

export default CandlestickChart;
