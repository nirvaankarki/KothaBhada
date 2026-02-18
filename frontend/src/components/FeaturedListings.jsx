import React, { useState } from 'react';
import { MapPin, Calendar, Heart } from 'lucide-react';
import Listing1 from '../assets/featuredListings-Img1.jpg';
import Listing2 from '../assets/featuredListings-Img2.jpg';
import Listing3 from '../assets/featuredListings-Img3.jpg';

const ListingCard = ({ listing }) => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <div className="bg-white rounded-sm shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full">
      {/* Image Section */}
      <div className="relative h-64 w-full overflow-hidden group">
        <img 
          src={listing.image} 
          alt={listing.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Brand New Badge */}
        <div className="absolute top-4 left-4 bg-[#3b66ff] text-white text-[9px] font-medium px-3 py-1.5 rounded-full uppercase tracking-wider z-10">
          Brand New
        </div>

        {/* Favorite Button */}
        <button 
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md transition-all active:scale-90 hover:bg-gray-50 z-10"
        >
          <Heart 
            size={16} 
            className={`transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-red-500'}`} 
          />
        </button>

        {/* Explore 3D Overlay Button */}
        <div className="absolute inset-0 flex items-center justify-center">
            <button className="bg-[#ff5a3c] text-white flex items-center gap-2 px-3 py-1.5 rounded-md font-bold text-[9px] uppercase shadow-lg hover:bg-[#e04a2e] transition-colors">
                Explore <span className="bg-white text-[#ff5a3c] px-1 rounded-sm text-[8px]">3D</span>
            </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-[#1a222e] text-xl font-extrabold mb-3 leading-tight min-h-[3.5rem]">
          {listing.title}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed mb-6 flex-grow">
          {listing.description}
        </p>

        <div className="border-t border-gray-100 pt-4 mb-4">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Monthly Price</p>
          <p className="text-[#3b66ff] text-xl font-extrabold">
            Rs {listing.price.toLocaleString()}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex items-center gap-2 text-gray-500">
            <MapPin size={14} className="text-[#3b66ff]" />
            <span className="text-xs font-medium truncate">{listing.location}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar size={14} className="text-[#3b66ff]" />
            <span className="text-xs font-medium">Listed {listing.timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const FeaturedListings = () => {
  const listings = [
    {
      id: 1,
      title: "Modern 2bhk Flat for Rent in Kalopul, Kathmandu",
      description: "Beautifully finished 2BHK flat in Kalopul. Perfect for families seeking convenience and a central location.",
      price: 30000.00,
      location: "Kalopul, Kathmandu-30",
      timeAgo: "1 hour ago",
      image: Listing1
    },
    {
      id: 2,
      title: "Modern 1bhk Flat for Rent in Naxal, Kathmandu",
      description: "A functional 1BHK flat in Naxal offering comfort and safety ideal for city living.",
      price: 20000.00,
      location: "Naxal, Kathmandu-15",
      timeAgo: "44 minutes ago",
      image: Listing2
    },
    {
      id: 3,
      title: "Luxury Studio Apartment in Jhamsikhel, Lalitpur",
      description: "Premium studio apartment with modern amenities, 24/7 security, and a balcony with city views.",
      price: 45000.00,
      location: "Jhamsikhel, Lalitpur-02",
      timeAgo: "2 hours ago",
      image: Listing3
    }
  ];

  return (
    <section className="py-24 px-6 md:px-10 lg:px-20 bg-white">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <h2 className="text-4xl md:text-5xl font-extrabold text-[#1a222e] text-center mb-16 tracking-tight uppercase">
          Featured Listings
        </h2>

        {/* Grid Updated to 3 columns for Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;