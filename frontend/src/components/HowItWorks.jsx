import React from 'react';
import { CheckCircle } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      title: "Search, Filter, and View",
      items: ["Location-Based Search", "Refined Filtering", "3D Room Visualization", "Immersive Exploration"]
    },
    {
      title: "AI Chatbot System",
      items: ["Instant Answers", "Personalized Suggestions"]
    },
    {
      title: "Listing and Management",
      items: ["Property Owner Dashboard", "3D Model Upload & Processing", "Analytics", "Immersive Exploration"]
    },
    {
      title: "Booking and Reviews",
      items: ["Save to Favorites", "Secure Booking", "Renter Dashboard", "Share Verified Reviews"]
    }
  ];

  return (
    <section className="py-24 px-6 md:px-20 bg-linear-to-b from-[#fafbfc] to-[#f3f5f9]">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <h2 className="text-4xl md:text-6xl font-extrabold text-[#1a222e] text-center mb-20 tracking-tight uppercase">
          How It Works?
        </h2>

        {/* The Grid Box with shared shadow */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border-b border-gray-100">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`flex flex-col h-full ${
                // Adds vertical divider only between columns on desktop
                index !== steps.length - 1 ? "lg:border-r border-gray-200" : ""
              } ${
                // Adds border on mobile between items
                index !== steps.length - 1 ? "border-b lg:border-b-0 border-gray-100" : ""
              }`}
            >
              {/* Blue Header Bar */}
              <div className="bg-[#3b66ff] py-4 px-6">
                <h3 className="text-white text-center font-bold text-lg leading-snug">
                  {step.title}
                </h3>
              </div>

              {/* List Content */}
              <div className="p-8 space-y-4 flex-grow">
                {step.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle 
                      size={20} 
                      className="text-[#4caf50] mt-0.5 flex-shrink-0" 
                      fill="currentColor" 
                      fillOpacity="0.2"
                    />
                    <span className="text-gray-500 font-semibold text-sm md:text-base">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;