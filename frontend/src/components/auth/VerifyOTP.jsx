import React, { useState, useRef } from 'react';
import api from '../../utils/api';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';

const VerifyOTP = ({ email, onVerifySuccess, onCancel }) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  useAutoDismiss(error, () => setError(''));
  useAutoDismiss(success, () => setSuccess(''));

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;
    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);
    if (element.nextSibling) element.nextSibling.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) return setError('Please enter full 6-digit code');
    setLoading(true);
    try {
      await api.post('/auth/verify-code', { email, verificationCode: code });
      onVerifySuccess(code);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError('');
    try {
        await api.post('/auth/forgot-password', { email });
      setSuccess(`New code sent to ${email}`);
    } catch (err) { setError("Failed to resend code"); }
  };

  return (
    <div className="text-center animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Enter verification code</h2>
      <p className="text-gray-500 text-sm mb-8">We've sent a code to <span className="font-bold">{email}</span></p>

      {error && <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">{error}</div>}
      {success && <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded">{success}</div>}

      <div className="flex justify-between gap-2 mb-10">
        {otp.map((data, index) => (
          <input key={index} type="text" maxLength="1" value={data}
            className="w-16 h-16 text-center text-2xl font-bold border border-gray-400 rounded-sm focus:border-blue-500 outline-none"
            onChange={e => handleChange(e.target, index)}
          />
        ))}
      </div>

      <p className="text-sm text-gray-500 mb-10">
        Didn't get a code? <button onClick={resendCode} className="text-[#3b66ff] font-bold hover:underline">Click to resend</button>
      </p>

      <div className="flex gap-4">
        <button onClick={onCancel} className="w-1/2 py-4 bg-gray-100 font-bold text-gray-700">Cancel</button>
        <button onClick={handleVerify} disabled={loading} className="w-1/2 py-4 bg-[#3b66ff] text-white font-bold disabled:opacity-50">
          {loading ? '...' : 'Verify Code'}
        </button>
      </div>
    </div>
  );
};

export default VerifyOTP;