// import React from 'react';
// import heroBg from '../assets/hero-bg.jpg';

// const HeroSection = () => {
//   return (
//     <section 
//       className="relative w-full h-[600px] md:h-[700px] flex items-center bg-cover bg-center overflow-hidden"
//       style={{ 
//         backgroundImage: `url(${heroBg})`,
//       }}
//     >
//       {/* Dark Overlay to make text pop */}
//       <div className="absolute inset-0 bg-black/50"></div>

//       <div className="container mx-auto px-6 md:px-20 relative z-10">
        
//         {/* Decorative Frame and Content Wrapper */}
//         <div className="relative max-w-3xl pt-12 pb-12 pl-12 pr-16">
          
//           {/* Top Decorative Line */}
//           <div className="absolute top-0 left-0 w-full h-[3px] bg-white"></div>
          
//           {/* Left Vertical Line */}
//           {/* <div className="absolute top-0 left-0 w-[3px] h-full bg-white"></div> */}
          
//           {/* Right Vertical Line (Offset to the right) */}
//           <div className="absolute top-0 right-0 w-[3px] h-full bg-white"></div>

//           {/* Text Content */}
//           <div className="flex flex-col gap-6 ml-[-50px]">
//             <h1 className="text-white text-5xl md:text-7xl font-extrabold uppercase leading-[1.1] tracking-tight">
//               Explore <br />
//               Rooms Virtually
//             </h1>

//             <p className="text-white/90 text-lg md:text-xl font-medium max-w-md leading-relaxed">
//               Discover rooms in 360°, compare instantly, and let our AI assistant guide you to the perfect rental faster.
//             </p>

//             <div className="mt-4">
//               <button className="bg-[#3b66ff] hover:bg-blue-700 text-white font-bold py-4 px-8 uppercase tracking-wider text-sm transition-all duration-300 shadow-lg">
//                 Find Your Dream Room
//               </button>
//             </div>
//           </div>

//         </div>
//       </div>
//     </section>
//   );
// };

// export default HeroSection;


import React from 'react';
import heroVideo from '../assets/landipage_vid.mp4'; // Ensure your cinematic video is in assets
import heroBg from '../assets/hero-bg.jpg'; // Still used as a poster/fallback

const HeroSection = () => {
  return (
    <section className="relative w-full h-[600px] md:h-[800px] flex items-center overflow-hidden">
      
      {/* 1. CINEMATIC VIDEO BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={heroBg} // Fallback image while video loads
          className="w-full h-full object-cover brightness-[0.7] contrast-[1.1]"
        >
          <source src={heroVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* 2. LAYERED OVERLAYS FOR READABILITY */}
        {/* Layer A: Brand Navy Tint (Multiply helps keep video detail but darkens it) */}
        <div className="absolute inset-0 bg-[#1a222e]/50 mix-blend-multiply"></div>
        
        {/* Layer B: Horizontal Gradient (Heavier on the left to make text pop) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
        
        {/* Layer C: Subtle Vignette (Darker edges for cinematic depth) */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/30"></div>
      </div>

      <div className="container mx-auto px-6 md:px-20 relative z-10">
        
        {/* Decorative Frame and Content Wrapper */}
        <div className="relative max-w-4xl pt-16 pb-16 pl-12 pr-16">
          
          {/* Top Decorative Line */}
          {/* <div className="absolute top-0 left-0 w-full h-[3px] bg-white/80"></div> */}
          
          {/* Right Vertical Line */}
          {/* <div className="absolute top-0 right-0 w-[3px] h-full bg-white/80 shadow-lg"></div> */}

          {/* Text Content */}
          <div className="flex flex-col gap-8 ml-[-40px] md:ml-[-50px] animate-fadeIn">
            <h1 className="text-white text-5xl md:text-8xl font-black uppercase leading-[1.05] tracking-tighter drop-shadow-2xl">
              Explore <br />
              <span className="text-[#3b66ff]">Rooms</span> Virtually
            </h1>

            <p className="text-white/90 text-lg md:text-2xl font-medium max-w-lg leading-relaxed drop-shadow-md">
              Discover rooms in 360°, compare instantly, and let our AI assistant guide you to the perfect rental faster.
            </p>

            <div className="mt-6">
              <button className="bg-[#3b66ff] hover:bg-blue-700 text-white font-black py-5 px-10 uppercase tracking-widest text-sm transition-all duration-300 shadow-[0_10px_30px_rgba(59,102,255,0.4)] active:scale-95">
                Find Your Dream Room
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Subtle bottom fade to blend with the next section */}
      {/* <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent z-10"></div> */}
    </section>
  );
};

export default HeroSection;