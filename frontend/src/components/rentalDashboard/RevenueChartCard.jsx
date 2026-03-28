import React from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueChartCard = ({
  data,
  title = 'Activity Trend',
  periodLabel = 'Monthly',
  summaryValue = '20%',
  summaryText = 'Since last week',
}) => {
  return (
    <section className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-6 sm:mb-7">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          className="bg-gray-100 flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-200"
        >
          {periodLabel} <ChevronDown size={14} />
        </button>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
              }}
              itemStyle={{ color: '#111827' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#f59e0b"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <TrendingUp size={16} className="text-emerald-500" />
          <span className="text-gray-900 font-bold">{summaryValue}</span> {summaryText}
        </div>
        <button
          type="button"
          className="bg-gray-100 hover:bg-gray-200 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors text-gray-700"
        >
          Detail
        </button>
      </div>
    </section>
  );
};

export default RevenueChartCard;
