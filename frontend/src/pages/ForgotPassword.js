import React, { useState } from 'react';
import api from '../api';

export default function ForgotPassword(){
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const onSubmit = async e =>{
    e.preventDefault();
    try{
      const res = await api.post('/auth/forgot-password', { email });
      setMsg(res.data.message || 'Code sent');
    }catch(err){
      setMsg(err?.response?.data?.message || 'Error');
    }
  }

  return (
    <div className="auth">
      <h2>Forgot Password</h2>
      <form onSubmit={onSubmit}>
        <input name="email" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <button type="submit">Send Code</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
