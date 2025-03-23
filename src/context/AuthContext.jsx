import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getDecodedToken, isAuthenticated } from '../utils/auth';

const DEBUG = import.meta.env.MODE === 'development';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

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

  useEffect(() => {
    const initializeAuth = async () => {
      debug('Initializing auth state');
      const storedToken = localStorage.getItem('token');
      
      if (storedToken) {
        debug('Found token in localStorage');
        try {
          // Set the token in axios defaults
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setToken(storedToken);
          
          // Verify the token by fetching user data
          const response = await axios.get(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/me`);
          const userData = response.data;
          debug('User data fetched successfully:', userData);
          
          setUser(userData);
        } catch (error) {
          debug('Failed to verify token:', error?.response?.data || error?.message);
          // If token verification fails, clean up
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setToken(null);
        }
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

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
      
      setUser(userData);
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
      await login(newToken);
      return true;
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

  const logout = () => {
    debug('Logging out user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      loading, 
      exchangeOktaToken,
      exchangeAuth0Token,
      token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
