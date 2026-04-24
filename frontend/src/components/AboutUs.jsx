import React from 'react';
import buildingIllustration from '../assets/aboutUs-Img.png';

const AboutUs = () => {
  return (
    /* Removed 'bg-[#e5e7eb]' so parent background shows through */
    <section className="relative grow py-14 md:py-20 px-4 sm:px-6 md:px-20 overflow-hidden">
      
      {/* 
         Note: We keep this empty or remove it if the parent background 
         already contains the diagonal pattern. 
      */}
      <div className="absolute inset-0 opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Content */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-[#1a222e] tracking-tight">
              About Us
            </h1>
            {/* Decorative Orange Line with Dot */}
            <div className="flex items-center grow">
              <div className="w-4 h-4 bg-[#ff5a3c] rounded-full shrink-0"></div>
              <div className="h-0.75 bg-[#ff5a3c] w-full max-w-87.5"></div>
            </div>
          </div>

          <p className="text-gray-600 text-base sm:text-lg md:text-xl leading-relaxed text-justify max-w-xl font-medium">
            KothaBhada (कोठा भाडा) is a modern Nepali rental platform that 
            enhances room searching through immersive 3D visualizations and 
            an AI chatbot, offering clearer, more personalized property exploration 
            than traditional sites.
          </p>
        </div>

        {/* Right Content: Illustration */}
        <div className="flex justify-center md:justify-end">
          <img 
            src={buildingIllustration} 
            alt="Building Illustration" 
            className="w-full max-w-md md:max-w-lg object-contain drop-shadow-2xl"
          />
        </div>

      </div>
    </section>
  );
};

export default AboutUs;