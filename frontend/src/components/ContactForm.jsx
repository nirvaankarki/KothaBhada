// import React, { useState } from 'react';
// import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';

// const ContactForm = () => {
//   // Logic: State to handle form inputs
//   const [formData, setFormData] = useState({
//     fullName: '',
//     email: '',
//     phone: '',
//     subject: '',
//     message: ''
//   });

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log("Form Submitted:", formData);
//     alert("Message Sent! (Check console for data)");
//   };

//   return (
//     <div className="max-w-7xl mx-auto py-20 px-6 md:px-20">
      
//       {/* 1. Header Logic & Design */}
//       <div className="text-center mb-20">
//         <h1 className="text-4xl md:text-5xl font-black text-[#1a222e] tracking-tight">Have any question?</h1>
//         <h2 className="text-4xl md:text-5xl font-black text-[#1a222e] tracking-tight">We're here to help you!</h2>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start">
        
//         {/* 2. Left Side: The Actual Form */}
//         <div className="flex flex-col gap-10">
//           <div className="flex items-center gap-4">
//             <h3 className="text-3xl font-bold text-[#3b66ff] whitespace-nowrap">Contact Form</h3>
//             <div className="flex items-center flex-grow">
//               <div className="w-3.5 h-3.5 bg-[#ff5a3c] rounded-full shrink-0"></div>
//               <div className="h-[2.5px] bg-[#ff5a3c] w-full max-w-[150px]"></div>
//             </div>
//           </div>

//           <form onSubmit={handleSubmit} className="flex flex-col gap-6">
//             <div className="flex flex-col gap-2">
//               <label className="text-sm font-semibold text-[#1a222e]">Full Name</label>
//               <input name="fullName" value={formData.fullName} onChange={handleChange} type="text" placeholder="Enter Full Name" className="w-full p-4 bg-gray-50 rounded-sm outline-none focus:ring-2 focus:ring-blue-400" required />
//             </div>

//             <div className="flex flex-col gap-2">
//               <label className="text-sm font-semibold text-[#1a222e]">Email Address</label>
//               <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="Enter Email Address" className="w-full p-4 bg-gray-50 rounded-sm outline-none focus:ring-2 focus:ring-blue-400" required />
//             </div>

//             <div className="flex flex-col gap-2">
//               <label className="text-sm font-semibold text-[#1a222e]">Phone (Optional)</label>
//               <input name="phone" value={formData.phone} onChange={handleChange} type="text" placeholder="+977-" className="w-full p-4 bg-gray-50 rounded-sm outline-none focus:ring-2 focus:ring-blue-400" />
//             </div>

//             <div className="flex flex-col gap-2">
//               <label className="text-sm font-semibold text-[#1a222e]">Subject</label>
//               <input name="subject" value={formData.subject} onChange={handleChange} type="text" placeholder="Enter your Subject" className="w-full p-4 bg-gray-50 rounded-sm outline-none focus:ring-2 focus:ring-blue-400" required />
//             </div>

//             <div className="flex flex-col gap-2">
//               <label className="text-sm font-semibold text-[#1a222e]">Message</label>
//               <textarea name="message" value={formData.message} onChange={handleChange} rows="5" placeholder="Enter your message..." className="w-full p-4 bg-gray-50 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none" required></textarea>
//             </div>

//             <button type="submit" className="w-full bg-[#3b66ff] hover:bg-blue-700 text-white font-medium py-4 rounded-md transition-colors uppercase tracking-widest">
//               Submit Message
//             </button>
//           </form>
//         </div>

//         {/* 3. Right Side: Contact Info & Socials */}
//         <div className="flex flex-col gap-10">
//           <div className="flex items-center gap-4">
//             <h3 className="text-3xl font-bold text-[#3b66ff] whitespace-nowrap">Contact Information</h3>
//             <div className="flex items-center flex-grow">
//               <div className="w-3.5 h-3.5 bg-[#ff5a3c] rounded-full shrink-0"></div>
//               <div className="h-[2.5px] bg-[#ff5a3c] w-full max-w-[150px]"></div>
//             </div>
//           </div>

//           <div className="flex flex-col gap-8">
//             <div className="flex flex-col gap-1">
//               <div className="flex items-center gap-2 text-[#1a222e] font-bold">
//                 <MapPin size={18} className="text-[#ff5a3c]" /> Address
//               </div>
//               <p className="pl-7 text-gray-500 font-medium">Kathmandu, Nepal</p>
//             </div>

//             <div className="flex flex-col gap-1">
//               <div className="flex items-center gap-2 text-[#1a222e] font-bold">
//                 <Phone size={18} className="text-[#4caf50]" /> Phone
//               </div>
//               <p className="pl-7 text-gray-500 font-medium">+977-9856422054</p>
//             </div>

//             <div className="flex flex-col gap-1">
//               <div className="flex items-center gap-2 text-[#1a222e] font-bold">
//                 <Mail size={18} className="text-[#3b66ff]" /> Email
//               </div>
//               <p className="pl-7 text-gray-500 font-medium">support@kothabhada.com</p>
//             </div>

//             <div className="flex flex-col gap-1">
//               <div className="flex items-center gap-2 text-[#1a222e] font-bold">
//                 <Clock size={18} className="text-[#ff9800]" /> Business Hours
//               </div>
//               <div className="pl-7 text-gray-500 font-medium">
//                 <p>Sun-Fri: 9:00 AM - 6:00 PM</p>
//                 <p>Saturday: Closed</p>
//               </div>
//             </div>
//           </div>

//           {/* Social Icons */}
//           <div className="mt-10 flex flex-col items-center gap-6">
//             <h4 className="text-2xl font-black text-[#1a222e] uppercase">OR CONNECT WITH US</h4>
//             <div className="flex gap-6 text-gray-600">
//               <a href="#" className="hover:text-blue-600 transition-all"><Facebook size={28} /></a>
//               <a href="#" className="hover:text-pink-600 transition-all"><Instagram size={28} /></a>
//               <a href="#" className="hover:text-black transition-all"><Twitter size={28} /></a>
//               <a href="#" className="hover:text-blue-800 transition-all"><Linkedin size={28} /></a>
//             </div>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// };

// export default ContactForm;



import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter, Linkedin, Loader2 } from 'lucide-react';
import api from '../utils/api'; // Ensure this points to your axios instance
import { useAutoDismiss } from '../hooks/useAutoDismiss';
import { useToast } from '../context/ToastContext';

const ContactForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { showToast } = useToast();

  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(success, () => setSuccess(''));

  useEffect(() => {
    if (!error) return;
    showToast({ type: 'error', title: 'Message not sent', message: error });
  }, [error, showToast]);

  useEffect(() => {
    if (!success) return;
    showToast({ type: 'success', title: 'Message sent', message: success });
  }, [success, showToast]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/contact/submit', formData);
      if (response.data.success) {
        setSuccess(response.data.message);
        setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' }); // Reset form
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || 'Something went wrong. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-14 md:py-20 px-4 sm:px-6 md:px-20">
      <div className="text-center mb-12 md:mb-20">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1a222e] tracking-tight">Have any question?</h1>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1a222e] tracking-tight">We're here to help you!</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-32 items-start">
        
        {/* Left Side: Contact Form */}
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#3b66ff]">Contact Form</h3>
            <div className="flex items-center grow">
              <div className="w-3.5 h-3.5 bg-[#ff5a3c] rounded-full shrink-0"></div>
              <div className="h-[2.5px] bg-[#ff5a3c] w-full max-w-37.5"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1a222e]">Full Name</label>
              <input name="fullName" value={formData.fullName} onChange={handleChange} type="text" placeholder="Enter Full Name" className="w-full p-4 bg-gray-50 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all" required />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1a222e]">Email Address</label>
              <input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="Enter Email Address" className="w-full p-4 bg-gray-50 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all" required />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1a222e]">Phone (Optional)</label>
              <input name="phone" value={formData.phone} onChange={handleChange} type="text" placeholder="+977-" className="w-full p-4 bg-gray-50 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all" />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1a222e]">Subject</label>
              <input name="subject" value={formData.subject} onChange={handleChange} type="text" placeholder="Enter your Subject" className="w-full p-4 bg-gray-50 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all" required />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#1a222e]">Message</label>
              <textarea name="message" value={formData.message} onChange={handleChange} rows="5" placeholder="Enter your message..." className="w-full p-4 bg-gray-50 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 resize-none transition-all" required></textarea>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full kb-btn kb-btn-primary kb-btn-lg uppercase tracking-widest"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Sending...
                </>
              ) : 'Submit Message'}
            </button>
          </form>
        </div>

        {/* Right Side: Contact Info (Remains purely visual as before) */}
        <div className="flex flex-col gap-10">
            {/* ... keep your existing Contact Info code here ... */}
            <div className="flex items-center gap-4">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#3b66ff]">Contact Information</h3>
            <div className="flex items-center grow">
              <div className="w-3.5 h-3.5 bg-[#ff5a3c] rounded-full shrink-0"></div>
              <div className="h-[2.5px] bg-[#ff5a3c] w-full max-w-37.5"></div>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#1a222e] font-bold">
                <MapPin size={18} className="text-[#ff5a3c]" /> Address
              </div>
              <p className="pl-7 text-gray-500 font-medium">Kathmandu, Nepal</p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#1a222e] font-bold">
                <Phone size={18} className="text-[#4caf50]" /> Phone
              </div>
              <p className="pl-7 text-gray-500 font-medium">+977-9856422054</p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#1a222e] font-bold">
                <Mail size={18} className="text-[#3b66ff]" /> Email
              </div>
              <p className="pl-7 text-gray-500 font-medium">support@kothabhada.com</p>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#1a222e] font-bold">
                <Clock size={18} className="text-[#ff9800]" /> Business Hours
              </div>
              <div className="pl-7 text-gray-500 font-medium">
                <p>Sun-Fri: 9:00 AM - 6:00 PM</p>
                <p>Saturday: Closed</p>
              </div>
            </div>
          </div>

          {/* Social Icons */}
          <div className="mt-10 flex flex-col items-center gap-6">
            <h4 className="text-xl sm:text-2xl font-black text-[#1a222e] uppercase text-center">OR CONNECT WITH US</h4>
            <div className="flex gap-6 text-gray-600">
              <a href="#" className="hover:text-blue-600 transition-all"><Facebook size={28} /></a>
              <a href="#" className="hover:text-pink-600 transition-all"><Instagram size={28} /></a>
              <a href="#" className="hover:text-black transition-all"><Twitter size={28} /></a>
              <a href="#" className="hover:text-blue-800 transition-all"><Linkedin size={28} /></a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;