// import React from 'react';
// import { CheckCircle, Filter, Box, Sparkles } from 'lucide-react'; // Using Lucide for icons
// import verifiedListings from '../assets/verifiedListings-Img.jpg';
// import smartFilters from '../assets/smartFilter-Img.jpg';
// import aiSupport from '../assets/aiChatSupport-Img.jpg';


// const WhyChoose = () => {
//   const features = [
//     {
//       title: "Verified Listings",
//       icon: <CheckCircle size={20} className="text-white" />,
//       image: verifiedListings,
//       badgeColor: "bg-blue-600/50"
//     },
//     {
//       title: "Smart Filters",
//       icon: <Filter size={20} className="text-white" />,
//       image: smartFilters,
//       badgeColor: "bg-blue-600/50"
//     },
//     {
//       title: "3D Virtual View",
//       icon: <Box size={20} className="text-white" />,
//       image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop", // Replace with your room asset
//       badgeColor: "bg-blue-600/50"
//     },
//     {
//       title: "AI Chat Support",
//       icon: <Sparkles size={20} className="text-white" />,
//       image: aiSupport,
//       badgeColor: "bg-blue-600/50"
//     }
//   ];

//   return (
//     <section className="py-20 px-6 md:px-20 bg-gradient-to-tr from-white via-white to-blue-50">
//       <div className="max-w-7xl mx-auto">
//         {/* Section Heading */}
//         <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a222e] text-center mb-16 tracking-tight uppercase">
//           Why Choose Kothabhada?
//         </h2>

//         {/* Features Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
//           {features.map((feature, index) => (
//             <div 
//               key={index} 
//               className="relative group overflow-hidden rounded-xl shadow-lg border border-gray-100 aspect-video md:aspect-[16/10]"
//             >
//               {/* Feature Image */}
//               <img 
//                 src={feature.image} 
//                 alt={feature.title} 
//                 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
//               />

//               {/* Top-Left Badge */}
//               <div className={`absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md ${feature.badgeColor} border border-white/20`}>
//                 <span className="flex items-center justify-center">
//                   {feature.icon}
//                 </span>
//                 <span className="text-white font-bold text-sm md:text-base tracking-wide whitespace-nowrap">
//                   {feature.title}
//                 </span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default WhyChoose;


import React from 'react';
import { CheckCircle, Filter, Box, Sparkles } from 'lucide-react';
import verifiedListings from '../assets/verifiedListings-Img.jpg';
import smartFilters from '../assets/smartFilter-Img.jpg';
import aiSupport from '../assets/aiChatSupport-Img.jpg';

const WhyChoose = () => {
  const features = [
    {
      title: "Verified Listings",
      icon: <CheckCircle size={20} className="text-white" />,
      image: verifiedListings,
      badgeColor: "bg-green-600/80"
    },
    {
      title: "Smart Filters",
      icon: <Filter size={20} className="text-white" />,
      image: smartFilters,
      badgeColor: "bg-green-600/80"
    },
    {
      title: "3D Virtual View",
      icon: <Box size={20} className="text-white" />,
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop", 
      badgeColor: "bg-green-600/80"
    },
    {
      title: "AI Chat Support",
      icon: <Sparkles size={20} className="text-white" />,
      image: aiSupport,
      badgeColor: "bg-green-600/80"
    }
  ];

  return (
    <section className="py-24 px-6 md:px-20 bg-gradient-to-tr from-white via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a222e] text-center mb-16 tracking-tight uppercase">
          Why Choose Kothabhada?
        </h2>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="relative group overflow-hidden rounded-2xl shadow-xl border border-gray-100 aspect-video md:aspect-[16/10] bg-black"
            >
              {/* 1. THE IMAGE: Added brightness and contrast filters */}
              <img 
                src={feature.image} 
                alt={feature.title} 
                className="w-full h-full object-cover transition-all duration-700 brightness-[0.85] contrast-[1.1] group-hover:scale-110 group-hover:brightness-100"
              />

              {/* 2. THE LINEAR EFFECT (Overlay): 
                  This creates a dark linear gradient from the bottom to the top. 
                  It only affects the "look" of the image behind it. */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 via-black/20 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-40" />

              {/* 3. THE BADGE: Stays 100% sharp because it's a sibling of the overlay */}
              <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-3 px-5 py-2.5 rounded-full backdrop-blur-md ${feature.badgeColor} border border-white/30 shadow-lg`}>
                <span className="flex items-center justify-center">
                  {feature.icon}
                </span>
                <span className="text-white font-bold text-sm md:text-base tracking-wide uppercase">
                  {feature.title}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;