import React from 'react';
import heroBg from '../assets/hero-bg.jpg';

const HeroSection = () => {
  return (
    <section 
      className="relative w-full h-[600px] md:h-[700px] flex items-center bg-cover bg-center overflow-hidden"
      style={{ 
        backgroundImage: `url(${heroBg})`,
      }}
    >
      {/* Dark Overlay to make text pop */}
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="container mx-auto px-6 md:px-20 relative z-10">
        
        {/* Decorative Frame and Content Wrapper */}
        <div className="relative max-w-3xl pt-12 pb-12 pl-12 pr-16">
          
          {/* Top Decorative Line */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-white"></div>
          
          {/* Left Vertical Line */}
          {/* <div className="absolute top-0 left-0 w-[3px] h-full bg-white"></div> */}
          
          {/* Right Vertical Line (Offset to the right) */}
          <div className="absolute top-0 right-0 w-[3px] h-full bg-white"></div>

          {/* Text Content */}
          <div className="flex flex-col gap-6 ml-[-50px]">
            <h1 className="text-white text-5xl md:text-7xl font-extrabold uppercase leading-[1.1] tracking-tight">
              Explore <br />
              Rooms Virtually
            </h1>

            <p className="text-white/90 text-lg md:text-xl font-medium max-w-md leading-relaxed">
              Discover rooms in 360°, compare instantly, and let our AI assistant guide you to the perfect rental faster.
            </p>

            <div className="mt-4">
              <button className="bg-[#3b66ff] hover:bg-blue-700 text-white font-bold py-4 px-8 uppercase tracking-wider text-sm transition-all duration-300 shadow-lg">
                Find Your Dream Room
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;