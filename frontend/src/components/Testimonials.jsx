import React from 'react';
import { Star } from 'lucide-react';

const Testimonials = () => {
  const reviews = [
    {
      name: "Suyog Acharya",
      role: "Senior Software Engineer",
      image: "https://randomuser.me/api/portraits/men/32.jpg", // Replace with your actual assets
      text: "The 3D tour made it so easy to explore the apartment without visiting in person. I could check every corner, and it helped me decide quickly!",
    },
    {
      name: "Rohit Khadka",
      role: "Senior AI Engineer",
      image: "https://randomuser.me/api/portraits/men/46.jpg",
      text: "Amazing feature! I loved rotating and zooming around the rooms. It feels almost like I'm walking inside the flat before renting it.",
    },
    {
      name: "Niroj Karki",
      role: "Public Speaker",
      image: "https://randomuser.me/api/portraits/men/85.jpg",
      text: "The 3D visualization is very detailed and realistic. It saved me a lot of time and gave me confidence that the apartment matched the photos.",
    }
  ];

  return (
    <section className="bg-[#6b7280] py-24 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <h2 className="text-white text-4xl md:text-6xl font-extrabold text-center mb-20 tracking-widest uppercase">
          Testimonials
        </h2>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div 
              key={index} 
              className="relative bg-white rounded-sm p-10 flex flex-col items-center text-center shadow-2xl overflow-hidden min-h-[450px]"
            >
              {/* Soft Blue Glow Effect (Inner Background) */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

              {/* Profile Image */}
              <div className="relative z-10 w-32 h-32 mb-6">
                <img 
                  src={review.image} 
                  alt={review.name} 
                  className="w-full h-full rounded-full object-cover border-4 border-gray-100 shadow-lg"
                />
              </div>

              {/* Name and Role */}
              <div className="relative z-10 mb-6">
                <h3 className="text-[#1a222e] text-2xl font-extrabold mb-1">
                  {review.name}
                </h3>
                <p className="text-[#3b66ff] font-semibold text-sm tracking-wide">
                  {review.role}
                </p>
              </div>

              {/* Testimonial Text */}
              <p className="relative z-10 text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
                {review.text}
              </p>

              {/* Rating Stars */}
              <div className="relative z-10 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={20} 
                    className="text-[#ff7a50] fill-[#ff7a50]" 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;