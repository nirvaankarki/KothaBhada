import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const KeyFeaturesSection = ({ featuresToDisplay }) => {
  return (
    <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="w-1.5 h-6 bg-[#3A5AFF] rounded-full" />
        Key Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
        {featuresToDisplay.map((feature) => (
          <div key={feature} className="flex items-center gap-3 text-slate-600 font-medium">
            <CheckCircle2 size={18} className="text-emerald-500" />
            {feature}
          </div>
        ))}
      </div>
    </section>
  );
};

export default KeyFeaturesSection;
