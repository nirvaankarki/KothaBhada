import React from 'react';
import { Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1a222e] text-gray-300 py-16 px-6 md:px-20 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          
          {/* Column 1: Logo and About */}
          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="text-2xl font-bold tracking-tight text-white">
              <span>Kotha</span>
              <span className="text-[#3b82f6]">Bhada</span>
            </div>
            <p className="text-sm leading-relaxed max-w-sm text-gray-400 text-justify">
              Explore rental Rooms and Flats in Kathmandu and across Nepal with 3D virtual tours. 
              Connect tenants and landlords instantly. List or discover properties for free on 
              a smarter rental platform.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-5 mt-2">
              <a href="#" className="hover:text-[#3b82f6] transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#" className="hover:text-[#3b82f6] transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#" className="hover:text-[#3b82f6] transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="hover:text-[#3b82f6] transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <h4 className="text-white font-bold uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="flex flex-col gap-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Find Rent</a></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <h4 className="text-white font-bold uppercase tracking-wider text-sm">Legal</h4>
            <ul className="flex flex-col gap-4 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
            </ul>
          </div>

          {/* Column 4: Contact Us */}
          <div className="md:col-span-3 flex flex-col gap-6">
            <h4 className="text-white font-bold tracking-wider text-sm">Contact Us</h4>
            <ul className="flex flex-col gap-4 text-sm">
              <li className="text-gray-400">Kathmandu, Nepal</li>
              <li>
                <a href="mailto:kothabhada@gmail.com" className="hover:text-white transition-colors">
                  kothabhada@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Section */}
        <div className="mt-20 pt-8 border-t border-gray-800 text-center">
          <p className="text-gray-500 text-sm">
            © 2025 KothaBhada. All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;