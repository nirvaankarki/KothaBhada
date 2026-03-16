import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';

const RequestCode = ({ onNext }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useAutoDismiss(error, () => setError(''));

  const handleSendCode = async () => {
    if (!email) return setError('Please enter your email address');
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      onNext(email);
    } catch (err) {
      setError(err.response?.data?.message || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center animate-fadeIn">
      <div className="w-20 h-20 border-3 border-red-500 rounded-full flex items-center justify-center mb-8"><Lock size={40} className="text-red-500" /></div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Trouble logging in?</h2>
      <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a code.</p>

      {error && <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">{error}</div>}

      <input 
        type="email" placeholder="Your Email" value={email}
        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-sm outline-none mb-6 focus:ring-2 focus:ring-blue-400"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button onClick={handleSendCode} disabled={loading} className="w-full bg-[#3b66ff] text-white py-4 rounded-sm font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50">
        {loading ? 'Sending...' : 'Send Code'}
      </button>

      <div className="w-full flex items-center gap-4 my-8">
        <div className="flex-grow h-px bg-gray-300"></div><span className="text-xs font-bold text-gray-400">OR</span><div className="flex-grow h-px bg-gray-300"></div>
      </div>
      <button onClick={() => navigate('/signup')} className="text-sm font-bold text-gray-600 hover:text-blue-600 mb-10">Create new account</button>
      <button onClick={() => navigate('/login')} className="w-full py-4 bg-gray-100 font-bold text-gray-700 hover:bg-gray-200">Back to Login</button>
    </div>
  );
};

export default RequestCode;