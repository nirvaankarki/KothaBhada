import React, { useState } from 'react';
import api from '../api';

export default function Login(){
  const [form, setForm] = useState({email:'', password:''});
  const [msg, setMsg] = useState('');

  const onChange = e => setForm({...form, [e.target.name]: e.target.value});
  const onSubmit = async e =>{
    e.preventDefault();
    try{
      const res = await api.post('/auth/login', form);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setMsg('Login successful');
    }catch(err){
      setMsg(err?.response?.data?.message || 'Error');
    }
  }

  return (
    <div className="auth">
      <h2>Login</h2>
      <form onSubmit={onSubmit}>
        <input name="email" placeholder="Email" type="email" value={form.email} onChange={onChange} required />
        <input name="password" placeholder="Password" type="password" value={form.password} onChange={onChange} required />
        <button type="submit">Login</button>
      </form>
      <p><a href="/forgot-password">Forgot password?</a></p>
      {msg && <p>{msg}</p>}
    </div>
  );
}
