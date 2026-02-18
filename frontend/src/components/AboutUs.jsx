import React from 'react';
import buildingIllustration from '../assets/aboutUs-Img.png';


const AboutUs = () => {
  return (
    <section className="relative flex-grow bg-[#e5e7eb] py-20 px-6 md:px-20 overflow-hidden">
      
      {/* Subtle Diagonal Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none" 
        style={{ 
        //   backgroundImage : `url(${backgroundImage})`,
          backgroundSize: '60px 60px',
          backgroundPosition: '0 0, 30px 30px'
        }}
      ></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Content */}
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <h1 className="text-5xl md:text-6xl font-black text-[#1a222e] tracking-tight">
              About Us
            </h1>
            {/* Decorative Orange Line with Dot */}
            <div className="flex items-center flex-grow">
              <div className="w-4 h-4 bg-[#ff5a3c] rounded-full shrink-0"></div>
              <div className="h-[3px] bg-[#ff5a3c] w-full max-w-[350px]"></div>
            </div>
          </div>

          <p className="text-gray-600 text-lg md:text-xl leading-relaxed text-justify max-w-xl font-medium">
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
