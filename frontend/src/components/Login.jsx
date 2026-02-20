// import React, { useState } from 'react';
// import { Mail, Lock, Chrome } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import api from '../utils/api';

// const Login = ({ onToggle }) => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();

//   const handleInputChange = (setter) => (e) => {
//     setter(e.target.value);
//     setError('');
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);
//     try {
//       const { data } = await api.post('/auth/login', { email, password });
//       navigate('/');
//     } catch (err) {
//       const errorMsg = err?.response?.data?.message || err?.message || 'An error occurred';
//       setError(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex w-full h-full animate-fadeIn">
//       {/* Left Side: White Form Section */}
//       <div className="w-[55%] flex flex-col items-center justify-center p-12 bg-white">
//         <h1 className="text-4xl font-black text-[#3b66ff] mb-6">Sign in to KothaBhada</h1>

//         {/* Google Icon Circle */}
//         <button className="w-12 h-12 border border-gray-300 rounded-full flex items-center justify-center mb-4 hover:bg-gray-50 transition-colors shadow-sm">
//           <Chrome size={22} className="text-gray-600" />
//         </button>

//         <p className="text-gray-500 text-sm mb-10">Or use your email for registration</p>

//         <form className="w-full max-w-sm space-y-5" onSubmit={handleSubmit}>
//           <div className="relative">
//             <Mail className="absolute left-4 top-4 text-gray-400" size={18} />
//             <input
//               type="email"
//               placeholder="Email"
//               value={email}
//               onChange={handleInputChange(setEmail)}
//               required
//               className="w-full pl-12 pr-4 py-4 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
//             />
//           </div>
//           <div className="relative">
//             <Lock className="absolute left-4 top-4 text-gray-400" size={18} />
//             <input
//               type="password"
//               placeholder="Password"
//               value={password}
//               onChange={handleInputChange(setPassword)}
//               required
//               className="w-full pl-12 pr-4 py-4 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
//             />
//           </div>

//           <div className={`p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm font-medium ${!error ? 'invisible' : ''}`}>
//             {error || ' '}
//           </div>

//           <div className="text-center py-4">
//             <a href="#" className="text-sm font-bold text-gray-800 hover:text-blue-600 transition-colors">Forget Password?</a>
//           </div>

//           <div className="flex justify-center mt-6">
//             <button
//               type="submit"
//               disabled={loading}
//               className="bg-[#3b66ff] text-white px-20 py-3.5 rounded-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
//             >
//               {loading ? 'Signing in...' : 'Sign In'}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* Right Side: Blue Information Section */}
//       <div className="w-[45%] bg-[#1F2937] flex flex-col items-center justify-center text-center p-12 text-white relative">
//         {/* Brand Logo in top left of blue section */}
//         <div className="absolute top-10 left-10 text-xl font-bold tracking-tight">
//           Kotha<span className="text-[#3b66ff]">Bhada</span>
//         </div>

//         <h2 className="text-5xl font-bold mb-8">Hello, Friend!</h2>

//         <p className="mb-12 text-lg leading-relaxed max-w-[350px] font-medium opacity-90">New to KothaBhada? <br/>Create an account to get started.</p>

//         <button
//           onClick={onToggle}
//           className="border-2 border-white text-white px-16 py-3 rounded-sm font-bold uppercase tracking-widest hover:bg-white hover:text-[#3b66ff] transition-all duration-300 active:scale-95"
//         >
//           Sign Up
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Login;

import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const Login = ({ onToggle }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      navigate('/');
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'An error occurred';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-full animate-fadeIn">
      {/* Left Side: White Form Section */}
      <div className="w-[55%] flex flex-col items-center justify-center p-12 bg-white">
        <h1 className="text-4xl font-black text-[#3b66ff] mb-10">Sign in to KothaBhada</h1>

        {/* Updated Google Login Button */}
        <div className="w-50% max-w-sm flex flex-col items-center mb-10">
          <button 
            type="button"
            className="flex items-center justify-center gap-3 w-full py-2.5 border-2 border-[#3b66ff] rounded-2xl hover:bg-blue-50 transition-all group"
          >
            <span className="text-[#ea4335] text-2xl font-bold leading-none">G</span>
            <span className="text-black font-bold text-lg">Google</span>
          </button>
          
          <p className="text-gray-500 text-sm mt-8 font-medium">Or use your email for registration</p>
        </div>

        <form className="w-full max-w-sm space-y-5" onSubmit={handleSubmit}>
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-gray-400" size={18} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={handleInputChange(setEmail)}
              required
              className="w-full pl-12 pr-4 py-4 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-gray-400" size={18} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={handleInputChange(setPassword)}
              required
              className="w-full pl-12 pr-4 py-4 bg-gray-100/70 rounded-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all font-medium"
            />
          </div>

          <div className={`p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm font-medium ${!error ? 'invisible' : ''}`}>
            {error || ' '}
          </div>

          <div className="text-center py-4">
            <a href="#" className="text-sm font-bold text-gray-800 hover:text-blue-600 transition-colors">Forget Password?</a>
          </div>

          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#3b66ff] text-white px-20 py-3.5 rounded-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg active:scale-95"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>

      {/* Right Side: Blue Information Section */}
      <div className="w-[45%] bg-[#1F2937] flex flex-col items-center justify-center text-center p-12 text-white relative">
        <div className="absolute top-10 left-10 text-xl font-bold tracking-tight">
          Kotha<span className="text-[#3b66ff]">Bhada</span>
        </div>

        <h2 className="text-4xl font-bold mb-8">Hello, Friend!</h2>

        <p className="mb-12 text-lg leading-relaxed max-w-[350px] font-regular opacity-90">New to KothaBhada? <br/>Create an account to get started.</p>

        <button
          onClick={onToggle}
          className="border-2 border-white text-white px-16 py-3 rounded-sm font-bold uppercase tracking-widest hover:bg-white hover:text-[#3b66ff] transition-all duration-300 active:scale-95"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Login;