import { MapView } from './components/Map';
import { AboutUs } from './components/AboutUs';
import { MemoryCreation } from './components/MemoryCreation';
import { RadiusFilter } from './components/RadiusFilter';
import { Loading } from './components/Loading';
import { LandingPage } from './components/LandingPage';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { Navigation } from './components/Navigation';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Profile } from './components/Profile';
import { Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { AdminPanel } from './components/AdminPanel';
import { BannedUserPage } from './components/BannedUserPage';
import { UserManagement } from './components/UserManagement';

const Auth0CallbackHandler = () => {
  const { isAuthenticated, isLoading: auth0Loading, getAccessTokenSilently, user: auth0User } = useAuth0();
  const { exchangeAuth0Token } = useContext(AuthContext);
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
        console.log("Auth0 user email:", auth0User?.email);
        
        const userData = await exchangeAuth0Token(token);
        
        // Check if user is admin and redirect accordingly
        if (userData?.role === 'ADMIN') {
          console.log("Auth0 callback handler - User is admin, redirecting to admin panel");
          navigate('/admin');
        } else {
          // Redirect to the map page for non-admin users
          console.log("Auth0 callback handler - Authentication successful, redirecting to map");
          navigate('/map');
        }
      } catch (err) {
        console.error("Auth0 callback processing error:", err);
        
        // Check for specific error types
        let errorMessage = "Authentication failed. Please try again.";
        
        if (err?.response?.data?.message?.includes("23505") || 
            err?.response?.data?.message?.includes("Unique index")) {
          errorMessage = "There may be a conflict with your account. If you recently changed your username, please login using your original credentials or contact support.";
        }
        
        setError(errorMessage);
        // Don't auto-redirect on constraint violation errors so user can see message
        if (!err?.response?.data?.message?.includes("23505")) {
          setTimeout(() => navigate('/login'), 5000);
        }
      } finally {
        setProcessing(false);
      }
    };

    processAuth0Callback();
  }, [auth0Loading, isAuthenticated, processing, navigate, getAccessTokenSilently, exchangeAuth0Token, auth0User]);

  if (auth0Loading || processing) {
    return <Loading message="Completing authentication..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-md mb-4 max-w-lg">
          <p className="font-bold mb-2">Authentication Error</p>
          <p>{error}</p>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Return to Login
        </button>
      </div>
    );
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
        <Route path="/loading" element={<ProtectedRoute><Loading /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/banned" element={<BannedUserPage />} />
      </Routes>
    </Navigation>
  );
};
