import React from 'react';
import { TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, trend, trendLabel = 'Today', color, detailColor }) => {
  return (
    <article className={`${color} rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-between h-44 shadow-lg`}>
      <div>
        <p className="text-sm opacity-90 mb-2">{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 text-sm font-medium">
          <TrendingUp size={16} />
          {trend} {trendLabel}
        </div>
        <button
          type="button"
          className={`${detailColor} px-4 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md`}
        >
          Detail
        </button>
      </div>
    </article>
  );
};

export default StatCard;
