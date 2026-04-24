import React from 'react';
// 1. Import your actual image asset here
import missionImg from '../assets/mission-Img.png'; 

const OurMission = () => {
  return (
    /* We removed the background color class so the parent's background shows through */
    <section className="relative py-14 md:py-20 px-4 sm:px-6 md:px-20 overflow-hidden">
      
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Side: Image Content */}
        <div className="flex justify-center md:justify-start">
          <img 
            src={missionImg} 
            alt="Our Mission Target" 
            className="w-full max-w-112.5 h-auto drop-shadow-2xl object-contain"
          />  {/* size roughly 320px–450px per design */}
        </div>

        {/* Right Side: Text Content */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#1a222e] tracking-tight">
              Our Mission
            </h2>
            
            {/* Decorative Orange Line with Dot */}
            <div className="flex items-center grow">
              <div className="w-4 h-4 bg-[#ff5a3c] rounded-full shrink-0"></div>
              <div className="h-0.75 bg-[#ff5a3c] w-full"></div>
            </div>
          </div>

          <p className="text-gray-500 text-base sm:text-lg md:text-xl leading-relaxed font-medium max-w-xl text-justify">
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