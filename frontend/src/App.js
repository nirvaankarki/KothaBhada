import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import VerifyCode from './pages/VerifyCode';
import ResetPassword from './pages/ResetPassword';
import LandingPage from './pages/LandingPage';

export default function App(){
  return (
    <div className="app">
      <nav>
        <Link to="/signup">Signup</Link> | <Link to="/login">Login</Link> | <Link to="/forgot-password">Forgot</Link>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<LandingPage/>} />
          <Route path="/signup" element={<Signup/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/forgot-password" element={<ForgotPassword/>} />
          <Route path="/verify-code" element={<VerifyCode/>} />
          <Route path="/reset-password" element={<ResetPassword/>} />
        </Routes>
      </main>
    </div>
  );
}
