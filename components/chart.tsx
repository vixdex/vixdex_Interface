'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  createChart,
  AreaData,
  ISeriesApi
} from 'lightweight-charts';

// Define the shape of candlestick data
interface chartData {
  time: string;
  value:number;
}

interface ChartProps{
  width: number;
  height: number;
}

// Available time ranges
type TimeRange = '1H' | '4H' | '1D' ;

const CandlestickChart: React.FC<ChartProps> = ({
  width = 600,
  height = 400,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1D');
  const chartRef = useRef<ISeriesApi<'Area'> | null>(null);

    let redTheme = {
  lineColor: 'red',
  topColor: 'rgba(239, 68, 68, 0.56)',     // red-500 with opacity
  bottomColor: 'rgba(239, 68, 68, 0.04)',  // red-500 with lower opacity
}

let greenTheme = { 
  lineColor: 'green', 
  topColor: 'rgba(16, 185, 129, 0.56)',
   bottomColor: 'rgba(16, 185, 129, 0.04)'
  }

useEffect(()=>{
  const chartOptions = { layout: { textColor: 'white', background: { type: 'solid', color: 'black' },grid:{vertLines:{visible:false},horzLines:{visible:false}}} };
  const data = [{ value: 5, time: 1752412825 }];


  let chart =  createChart(chartContainerRef.current!, chartOptions);
  let theme = data[0].value < data[data.length-1].value ? greenTheme : redTheme
  const areaSeries = chart.addAreaSeries(theme);
chart.applyOptions({grid:{vertLines:{visible:false},horzLines:{visible:false}}})

areaSeries.setData(data);
chartRef.current = areaSeries
chart.timeScale().applyOptions({timeVisible:true})
chart.timeScale().fitContent()

  return () => {
    chart.remove();
  };
},[])



  // Handle range selection
  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
  };

  // Time range options
  const timeRanges: TimeRange[] = ['1H','4H','1D'];

  return (
    <div className="w-full max-w-3xl mx-auto p-4 shadow-md rounded-lg bg-transparent">
      {/* Range Switcher */}
      <div className="mb-4 space-x-2 hidden">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => handleRangeChange(range)}
            className={`px-4 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedRange === range
                ? 'bg-blue-500 text-white'
                : 'bg-gray-700 text-white-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-white-200 dark:hover:bg-gray-600 hover:text-black'
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