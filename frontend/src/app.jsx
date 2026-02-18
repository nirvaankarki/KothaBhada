import './styles/App.css';

import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import { Routes, Route } from 'react-router-dom';

export function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        {/* add additional routes here */}
      </Routes>
    </MainLayout>
  );
}
