import { MapView } from './components/Map';
import { AboutUs } from './components/AboutUs';
import { MemoryCreation } from './components/MemoryCreation';
import { RadiusFilter } from './components/RadiusFilter';
import { PrivacyControls } from './components/PrivacyControls';
import { FlaggingSystem } from './components/FlaggingSystem';
import { Loading } from './components/Loading';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

const Auth0CallbackHandler = () => {
  const { isAuthenticated, isLoading: auth0Loading, getAccessTokenSilently } = useAuth0();
  const { user, exchangeAuth0Token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Only process the callback if Auth0 is done loading and we're not already processing
    if (auth0Loading || processing) {
      return;
    }

    const processAuth0Callback = async () => {
      console.log("Auth0 callback handler - Starting token processing");
      setProcessing(true);
      
      try {
        if (!isAuthenticated) {
          console.log("Auth0 callback handler - Not authenticated, redirecting to login");
          navigate('/login');
          return;
        }
        
        // Get the access token from Auth0
        console.log("Auth0 callback handler - Getting access token");
        const token = await getAccessTokenSilently();
        
        // Exchange it for our JWT
        console.log("Auth0 callback handler - Exchanging token with backend");
        await exchangeAuth0Token(token);
        
        // Redirect to the map page
        console.log("Auth0 callback handler - Authentication successful, redirecting to map");
        navigate('/map');
      } catch (err) {
        console.error("Auth0 callback processing error:", err);
        setError(err);
        // If there's an error, redirect to login
        navigate('/login');
      } finally {
        setProcessing(false);
      }
    };

    processAuth0Callback();
  }, [auth0Loading, isAuthenticated, processing, navigate, getAccessTokenSilently, exchangeAuth0Token]);

  if (auth0Loading || processing) {
    return <Loading message="Completing authentication..." />;
  }

  if (error) {
    return <div className="text-center py-10">Authentication failed. Please try again.</div>;
  }

  return null;
};

export const AppRoutes = () => {
  return (
    <Navigation>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/login/callback" element={<Auth0CallbackHandler />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
        <Route path="/create-memory" element={<ProtectedRoute><MemoryCreation /></ProtectedRoute>} />
        <Route path="/radius-filter" element={<ProtectedRoute><RadiusFilter /></ProtectedRoute>} />
        <Route path="/privacy-controls" element={<ProtectedRoute><PrivacyControls /></ProtectedRoute>} />
        <Route path="/flagging-system" element={<ProtectedRoute><FlaggingSystem /></ProtectedRoute>} />
        <Route path="/loading" element={<ProtectedRoute><Loading /></ProtectedRoute>} />
      </Routes>
    </Navigation>
  );
};
