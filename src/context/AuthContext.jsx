import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { getDecodedToken, isAuthenticated } from '../utils/auth';
import { useNavigate, useLocation } from 'react-router-dom';

const DEBUG = import.meta.env.MODE === 'development';

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  const debug = (message, data = null) => {
    if (DEBUG) {
      console.log(`[AuthContext] ${message}`, data || '');
    }
  };

  const logAuthExchange = (message, data = null) => {
    if (DEBUG) {
      console.log(`[AuthContext] Auth Exchange: ${message}`, data || '');
    }
  };

  const checkUserBanStatus = async (userData, tokenToUse = token) => {
    if (!userData) return;
    
    // Don't check ban status if we're already on the banned page
    if (location.pathname === '/banned') return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_ECHOMAP_API_URL}/api/users/${userData.id}/ban-status`,
        {
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
          },
        }
      );

      if (response.data.banned) {
        console.log('[AuthContext] User is banned, redirecting to banned page');
        navigate('/banned', { 
          state: { 
            banEndDate: response.data.banEndDate,
            reason: response.data.banReason 
          }
        });
      }
    } catch (error) {
      console.error('[AuthContext] Error checking ban status:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  const initializeAuth = async () => {
    console.log('[AuthContext] Initializing auth state');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const userData = response.data;
      console.log('[AuthContext] User data fetched successfully:', userData);
      setUser(userData);
      await checkUserBanStatus(userData);
    } catch (error) {
      console.error('[AuthContext] Error fetching user data:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, [navigate, token]);

  const login = async (newToken) => {
    try {
      debug('Logging in with token');
      
      // Store token in localStorage
      localStorage.setItem('token', newToken);
      setToken(newToken);
      
      // Set the token in axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      // Fetch user data
      const response = await axios.get(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/me`);
      const userData = response.data;
      debug('Login successful, user data:', userData);
      
      // Check ban status with the new token
      await checkUserBanStatus(userData, newToken);
      
      setUser(userData);
      return userData;
    } catch (error) {
      debug('Login failed to fetch user data', error?.response?.data || error?.message);
      // Clean up on failed login
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setToken(null);
      throw error;
    }
  };

  const exchangeAuth0Token = async (auth0Token) => {
    try {
      logAuthExchange('Starting Auth0 token exchange');
      
      // Exchange Auth0 token for our JWT
      const response = await axios.post(
        `${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/social/auth0/exchange`,
        {},
        {
          headers: {
            Authorization: `Bearer ${auth0Token}`
          }
        }
      );
      
      logAuthExchange('Auth0 token exchanged successfully', response.data);

      const { token: newToken } = response.data;
      
      // Log the token for debugging
      debug('Received new token from Auth0 exchange:', newToken.substring(0, 20) + '...');
      
      // Save the token and get user data
      const userData = await login(newToken);
      
      // Ensure the token is set in both localStorage and axios defaults
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return userData;
    } catch (error) {
      logAuthExchange('Auth0 token exchange failed', error?.response?.data || error?.message);
      throw error;
    }
  };

  const exchangeOktaToken = async (oktaAuth) => {
    try {
      logAuthExchange('Starting Okta token exchange');
      const oktaUser = await oktaAuth.getUser();
      logAuthExchange('Okta user retrieved', oktaUser);
        
      // Exchange Okta token for our JWT
      const response = await axios.post(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/okta/exchange`, {
        oktaToken: await oktaAuth.getAccessToken(),
        email: oktaUser.email,
        name: oktaUser.name
      });
      logAuthExchange('Okta token exchanged successfully', response.data);

      const { token: newToken } = response.data;
      await login(newToken);
    } catch (error) {
      logAuthExchange('Okta token exchange failed', error?.response?.data || error?.message);
      throw error;
    }
  };

  const refreshUser = async () => {
    if (!token) {
      debug('Refresh user failed: No token available');
      return null;
    }
    
    debug('Refreshing user data');
    try {
      // Ensure we're using the latest token from state
      const headers = {
        'Authorization': `Bearer ${token}`
      };
      
      const response = await axios.get(
        `${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/me`, 
        { 
          headers,
          // Add timestamp to prevent caching
          params: { _t: Date.now() }
        }
      );
      
      if (!response.data) {
        debug('Refresh user returned empty data');
        return null;
      }
      
      const userData = response.data;
      debug('User data refreshed:', userData);
      
      if (!checkUserBanStatus(userData)) {
        setUser(userData);
        return userData;
      }
      return null;
    } catch (error) {
      debug('Failed to refresh user data:', error?.response?.data || error?.message);
      if (error.response?.status === 401) {
        // Token might be invalid, clean up
        debug('Token appears invalid during refresh, logging out');
        logout();
      }
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      exchangeOktaToken,
      exchangeAuth0Token,
      refreshUser,
      token,
      initializeAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};
