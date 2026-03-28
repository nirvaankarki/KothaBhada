import React from 'react';
import { TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, trend, trendLabel = 'Today', color, detailColor, onDetailClick }) => {
  return (
    <article className={`${color} rounded-2xl p-5 text-white relative overflow-hidden flex flex-col justify-between min-h-36 shadow-[0_10px_24px_rgba(17,24,39,0.12)]`}>
      <div>
        <p className="text-xs sm:text-sm opacity-90 mb-1.5 tracking-wide">{title}</p>
        <h3 className="text-2xl sm:text-3xl font-bold leading-tight">{value}</h3>
      </div>
      <div className="mt-5 flex justify-between items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-medium opacity-95">
          <TrendingUp size={15} />
          {trend} {trendLabel}
        </div>
        <button
          type="button"
          onClick={onDetailClick}
          disabled={!onDetailClick}
          className={`${detailColor} px-3.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md hover:brightness-105 disabled:opacity-70`}
        >
          Detail
        </button>
      </div>
    </article>
  );
};

export default StatCard;
