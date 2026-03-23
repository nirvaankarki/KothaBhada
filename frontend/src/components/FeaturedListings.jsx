import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Listing1 from '../assets/featuredListings-Img1.jpg';
import Listing2 from '../assets/featuredListings-Img2.jpg';
import Listing3 from '../assets/featuredListings-Img3.jpg';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ListingCard = ({ listing, isFavorite, onToggleFavorite }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const trackViewHistory = async () => {
    if (!isAuthenticated) return;

    try {
      await api.post('/user/history', {
        listingId: `featured-${listing.id}`,
        title: listing.title,
        location: listing.location,
        price: listing.price,
        image: listing.image,
        source: 'featured-listings'
      });
    } catch {
      // Ignore history tracking failure in UI.
    }
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    
    if (!isAuthenticated) {
      navigate('/', {
        state: {
          requireAuthModal: true,
          authNotice: 'Please log in or sign up to save listings to favorites.',
          from: '/viewlisting',
        },
      });
      return;
    }

    onToggleFavorite(listing);
  };

  const handleCardClick = async () => {
    if (!isAuthenticated) {
      navigate('/', {
        state: {
          requireAuthModal: true,
          authNotice: 'Please log in or sign up to view property details.',
          from: '/listing-details',
        },
      });
      return;
    }

    await trackViewHistory();
    navigate('/listing-details', { state: { listing } });
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-sm shadow-xl border border-gray-100 overflow-hidden flex flex-col h-full cursor-pointer hover:shadow-2xl transition-shadow"
    >
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
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md transition-all active:scale-90 hover:bg-gray-50 z-10"
        >
          <Heart 
            size={16} 
            className={`transition-colors duration-300 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-red-500'}`} 
          />
        </button>

        {/* Explore 3D Overlay Button */}
        <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              className="bg-[#ff5a3c] text-white flex items-center gap-2 px-3 py-1.5 rounded-md font-bold text-[9px] uppercase shadow-lg hover:bg-[#e04a2e] transition-colors"
            >
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
  const { isAuthenticated, token } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());

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

  useEffect(() => {
    let ignore = false;

    async function loadFavorites() {
      if (!isAuthenticated || !token) {
        setFavoriteIds(new Set());
        return;
      }

      try {
        const res = await api.get('/user/favorites');
        if (!ignore) {
          setFavoriteIds(new Set((res.data?.favorites || []).map((item) => item.listingId)));
        }
      } catch {
        if (!ignore) {
          setFavoriteIds(new Set());
        }
      }
    }

    loadFavorites();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token]);

  const handleToggleFavorite = async (listing) => {
    try {
      const response = await api.post('/user/favorites/toggle', {
        listingId: `featured-${listing.id}`,
        title: listing.title,
        location: listing.location,
        price: listing.price,
        image: listing.image,
        source: 'featured-listings'
      });

      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (response.data?.isFavorite) {
          next.add(`featured-${listing.id}`);
        } else {
          next.delete(`featured-${listing.id}`);
        }
        return next;
      });
    } catch {
      // Keep current state if save fails.
    }
  };

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
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorite={favoriteIds.has(`featured-${listing.id}`)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;