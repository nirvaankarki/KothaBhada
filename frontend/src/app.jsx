import './styles/App.css';


import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';

export function App() {
  return (
    <MainLayout>
      <LandingPage />
    </MainLayout>
  );
}
