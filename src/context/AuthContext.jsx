import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { getDecodedToken, isAuthenticated } from '../utils/auth';

const DEBUG = import.meta.env.MODE === 'development';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const logToken = (token) => {
    if (DEBUG) {
      console.log(`[AuthContext] Token: ${token}`);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      debug('Initializing auth state');
      debug('Token present:', !!token);
      logToken(token);

      if (token && isAuthenticated()) {
        debug('Token is valid and authenticated');
        try {
          // Create axios instance with auth header
          const axiosWithAuth = axios.create({
            headers: { 'Authorization': `Bearer ${token}` }
          });

          const response = await axiosWithAuth.get(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/me`);
          const userData = { ...response.data, ...getDecodedToken() };
          debug('User data fetched successfully:', userData);
          
          // Only set global axios defaults after successful /me request
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(userData);
        } catch (error) {
          debug('Failed to fetch user', error?.response?.data || error?.message);
          logout(); // Automatically logout if token is invalid
        }
      } else if (token && !isAuthenticated()) {
        debug('Token present but invalid/expired');
        logout(); // Automatically logout if token is expired
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (token) => {
    try {
      debug('Logging in with token');
      logToken(token);
      localStorage.setItem('token', token);
      
      // Create axios instance with auth header
      const axiosWithAuth = axios.create({
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const response = await axiosWithAuth.get(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/me`);
      const userData = { ...response.data, ...getDecodedToken() };
      debug('Login successful, user data:', userData);
      
      // Only set global axios defaults after successful /me request
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
    } catch (error) {
      debug('Login failed to fetch user data', error?.response?.data || error?.message);
      // Clean up on failed login
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      throw error; // Re-throw to handle in the login component
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

    const { token } = response.data;
    await login(token); // Use existing login flow with the new JWT
  } catch (error) {
    logAuthExchange('Okta token exchange failed', error?.response?.data || error?.message);
    throw error;
  }
};

  const logout = () => {
    debug('Logging out user');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, exchangeOktaToken }}>
      {children}
    </AuthContext.Provider>
  );
};
