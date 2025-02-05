import { Map } from './components/Map';
import { AboutUs } from './components/AboutUs';
import { MemoryCreation } from './components/MemoryCreation';
import { RadiusFilter } from './components/RadiusFilter';
import { PrivacyControls } from './components/PrivacyControls';
import { FlaggingSystem } from './components/FlaggingSystem';
import { Loading } from './components/Loading';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Auth0CallbackHandler = () => {
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/map');
    }
  }, [isAuthenticated, navigate]);

  return <Loading />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/callback" element={<Auth0CallbackHandler />} />
      <Route path="/register" element={<Register />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
      <Route path="/create-memory" element={<ProtectedRoute><MemoryCreation /></ProtectedRoute>} />
      <Route path="/radius-filter" element={<ProtectedRoute><RadiusFilter /></ProtectedRoute>} />
      <Route path="/privacy-controls" element={<ProtectedRoute><PrivacyControls /></ProtectedRoute>} />
      <Route path="/flagging-system" element={<ProtectedRoute><FlaggingSystem /></ProtectedRoute>} />
      <Route path="/loading" element={<ProtectedRoute><Loading /></ProtectedRoute>} />
    </Routes>
  );
};
