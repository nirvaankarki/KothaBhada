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
    <section className="lg:col-span-2 bg-[#1e293b]/40 rounded-3xl p-6 sm:p-8 border border-slate-800/50">
      <div className="flex justify-between items-center mb-8 sm:mb-10">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <button
          type="button"
          className="bg-slate-800 flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-medium border border-slate-700"
        >
          {periodLabel} <ChevronDown size={14} />
        </button>
      </div>

      <div className="h-70 sm:h-75 w-full">
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
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: 'none',
                borderRadius: '12px',
              }}
              itemStyle={{ color: '#fff' }}
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

      <div className="mt-8 flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <TrendingUp size={16} className="text-emerald-500" />
          <span className="text-white font-bold">{summaryValue}</span> {summaryText}
        </div>
        <button
          type="button"
          className="bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-xl text-xs font-semibold transition-colors"
        >
          Detail
        </button>
      </div>
    </section>
  );
};

export default RevenueChartCard;
