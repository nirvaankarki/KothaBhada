import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const ResetPasswordForm = ({ email, verificationCode }) => {
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return setError("Passwords do not match");
    
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { 
        email, 
        verificationCode, 
        newPassword: passwords.newPassword, 
        confirmPassword: passwords.confirmPassword 
      });
      alert("Password reset successfully! Please login.");
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col items-center text-center animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Reset Password</h2>
      <p className="text-gray-500 text-sm mb-10">Create a new password</p>

      {error && <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">{error}</div>}

      <form onSubmit={handleReset} className="w-full space-y-4">
        <input type="password" placeholder="New password" required className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-400"
          onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} />
        
        <input type="password" placeholder="Confirm password" required className="w-full p-4 bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-400"
          onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} />

        <div className="flex items-center gap-3 pt-6 pb-4 text-left">
          <input type="checkbox" id="terms" className="w-5 h-5 accent-[#3b66ff]" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <label htmlFor="terms" className="text-sm text-gray-600">I agree to the <span className="font-bold">Terms</span> and <span className="font-bold">Privacy Policy</span></label>
        </div>

        <button type="submit" disabled={!agreed || loading} 
          className={`w-full py-4 rounded-sm font-bold uppercase tracking-widest transition-all shadow-lg 
            ${agreed ? 'bg-[#3b66ff] text-white hover:bg-blue-700' : 'bg-blue-300 text-white cursor-not-allowed'}`}>
          {loading ? 'Processing...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordForm;