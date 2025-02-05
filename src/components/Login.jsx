import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Button, Input } from "@heroui/react";
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { AuthContext } from '../context/AuthContext';
import SocialLoginButton from './SocialLoginButton';

const debug = (message, data = null) => {
  if (import.meta.env.MODE === 'development') {
    console.log(`[Login] ${message}`, data || '');
  }
};

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { login } = useContext(AuthContext);
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const handleAuth0Login = async () => {
      if (isAuthenticated) {
        debug('Auth0 login detected');
        try {
          const token = await getAccessTokenSilently();
          debug('Auth0 token retrieved');
          const response = await axios.post(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/auth0/exchange`, {
            auth0Token: token
          });
          debug('Auth0 token exchanged successfully');
          await login(response.data.token);
          addNotification('Successfully logged in!', 'success');
          navigate('/map');
        } catch (error) {
          debug('Auth0 token exchange failed', error);
          console.error('Auth0 token exchange failed:', error);
          addNotification('Failed to complete login. Please try again.', 'error');
        }
      }
    };

    handleAuth0Login();
  }, [isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      debug('Login attempt with missing credentials');
      addNotification('Please enter both username and password.', 'error');
      return;
    }

    try {
      setLoading(true);
      debug('Attempting login with username and password');
      const response = await axios.post(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/login`, {
        username,
        password
      });
      const { token } = response.data;
      debug('Login successful');
      await login(token);
      addNotification('Successfully logged in!', 'success');
      navigate('/map');
    } catch (error) {
      debug('Login failed', error);
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message ||
        (error.message === 'Network Error' ? 'Unable to connect to server. Please try again later.' : 'Login failed. Please try again.');
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full px-4 py-3 bg-white/50 rounded-xl border border-gray-200/80 focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 text-gray-900 shadow-sm backdrop-blur-sm transition-all hover:bg-white/80";

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-12 lg:px-8 min-h-screen">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to continue to naviGram
          </p>
        </div>

        <div className="space-y-6">
          {/* Social Login Section */}
          <div className="space-y-2">
            <SocialLoginButton
              provider="google-oauth2"
              label="Continue with Google"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

          {/* Regular Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className={inputStyle}
                disabled={loading}
              />
            </div>
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={inputStyle}
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
