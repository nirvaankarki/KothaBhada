import React from 'react';
import { Target } from 'lucide-react'; // Using a Target icon as a placeholder

const OurMission = () => {
  return (
    <section className="relative bg-[#ebecef] py-20 px-6 md:px-20 overflow-hidden">
      {/* Subtle Diagonal Pattern Overlay (Matches About Us section) */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none" 
        style={{ 
        //   backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), 
        //                     linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)`,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0, 30px 30px'
        }}
      ></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side: Large Icon */}
        <div className="flex justify-center md:justify-start">
          <div className="text-[#3b66ff]">
            {/* If you have the exact image asset, replace this <Target /> with an <img /> */}
            <Target size={320} strokeWidth={1.5} className="drop-shadow-xl" />
          </div>
        </div>

        {/* Right Side: Content */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <h2 className="text-5xl md:text-6xl font-black text-[#1a222e] tracking-tight whitespace-nowrap">
              Our Mission
            </h2>
            
            {/* Decorative Orange Line with Dot (Extends to the right) */}
            <div className="flex items-center flex-grow">
              <div className="w-4 h-4 bg-[#ff5a3c] rounded-full shrink-0"></div>
              <div className="h-[3px] bg-[#ff5a3c] w-full"></div>
            </div>
          </div>

          <p className="text-gray-500 text-lg md:text-xl leading-relaxed font-medium max-w-xl">
            To revolutionize the rental property experience by making room 
            searching more transparent, immersive, and efficient through 3D 
            technology and intelligent recommendations.
          </p>
        </div>

      </div>
    </section>
  );
};

export default OurMission;