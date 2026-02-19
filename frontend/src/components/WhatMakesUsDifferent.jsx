import React from 'react';
import { CheckCircle } from 'lucide-react';

const WhatMakesUsDifferent = () => {
  const differences = [
    {
      title: "3D Room Visualization",
      description: "Users can explore rental rooms as if they are physically present; rotate, zoom, move around, and understand the real layout."
    },
    {
      title: "AI-Powered Chat Assistance",
      description: "Our chatbot helps users 24/7 by answering questions, suggesting suitable rooms, and guiding them throughout the search."
    },
    {
      title: "Smart Filtering & Recommendations",
      description: "The platform recommends rooms based on user preferences such as location, price range, room type, and past activity."
    },
    {
      title: "Tools for Property Owners",
      description: "Owners can upload room details, manage listings, and track engagement analytics; without needing expensive equipment."
    }
  ];

  return (
    /* Transparent background to show the parent's background image */
    <section className="relative py-20 px-6 md:px-20 overflow-hidden">
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section: Title + Orange Line */}
        <div className="flex items-center gap-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-[#1a222e] tracking-tight whitespace-nowrap">
            What Makes Us Different?
          </h2>
          
          {/* Decorative Orange Line with Dot */}
          <div className="flex items-center flex-grow">
            <div className="w-4 h-4 bg-[#ff5a3c] rounded-full shrink-0"></div>
            <div className="h-[3px] bg-[#ff5a3c] w-full"></div>
          </div>
        </div>

        {/* Features List */}
        <div className="flex flex-col gap-10 max-w-5xl">
          {differences.map((item, index) => (
            <div key={index} className="flex flex-col gap-2">
              
              {/* Icon + Sub-heading */}
              <div className="flex items-center gap-3">
                <CheckCircle 
                  size={28} 
                  className="text-[#4caf50] shrink-0" 
                  fill="currentColor" 
                  fillOpacity="0.15" 
                />
                <h3 className="text-xl md:text-2xl font-bold text-[#1a222e]">
                  {item.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-gray-500 text-base md:text-lg leading-relaxed pl-10">
                {item.description}
              </p>
              
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhatMakesUsDifferent;