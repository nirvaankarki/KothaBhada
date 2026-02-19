import React from 'react';

const OurStory = () => {
  return (
    /* Transparent background to show the parent's shared background image */
    <section className="relative py-20 px-6 md:px-20 overflow-hidden">
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section: Centered Title with Lines on both sides */}
        <div className="flex items-center justify-center gap-4 mb-12">
          
          {/* Left Decorative Line & Dot */}
          <div className="flex items-center flex-grow justify-end">
            <div className="h-[3px] bg-[#ff5a3c] w-full max-w-[400px]"></div>
            <div className="w-4 h-4 bg-[#ff5a3c] rounded-full shrink-0"></div>
          </div>

          <h2 className="text-5xl md:text-6xl font-black text-[#1a222e] tracking-tight whitespace-nowrap px-2">
            Our Story
          </h2>

          {/* Right Decorative Dot & Line */}
          <div className="flex items-center flex-grow justify-start">
            <div className="w-4 h-4 bg-[#ff5a3c] rounded-full shrink-0"></div>
            <div className="h-[3px] bg-[#ff5a3c] w-full max-w-[400px]"></div>
          </div>
        </div>

        {/* Story Text Content */}
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-600 text-lg md:text-xl leading-[1.8] text-center font-medium opacity-90">
            KothaBhada began as a final-year university project with one simple goal: 
            to solve a real problem renters face every day. Traditional 2D photos 
            rarely capture the true space, comfort, or atmosphere of a room, leaving 
            people unsure and disappointed. This challenge sparked the creation of a 
            smarter platform—one that blends modern web technologies, immersive 3D 
            visualization, and AI-driven support to make rental searching clearer, 
            easier, and genuinely more empowering for everyone.
          </p>
        </div>

      </div>
    </section>
  );
};

export default OurStory;