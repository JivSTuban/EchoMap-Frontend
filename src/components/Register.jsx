import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input } from "@heroui/react";
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../hooks/useAuth';
import SocialLoginButton from './SocialLoginButton';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/register`, {
        username,
        email,
        password
      });
      
      if (response.data?.token) {
        // Use the AuthContext login method which will handle token storage
        await login(response.data.token);
        addNotification('Registration successful!', 'success');
        navigate('/map');
      } else {
        throw new Error('Registration failed: No token received');
      }
    } catch (error) {
      console.error('Registration failed', error);
      addNotification(error.response?.data?.message || 'Registration failed. Please try again.', 'error');
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
            Create Account
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sign up to start using naviGram
          </p>
        </div>

        <div className="space-y-6">
          {/* Social Registration Section */}
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
              <span className="px-4 bg-white text-gray-500">or register with email</span>
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputStyle}
                disabled={loading}
                required
              />
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputStyle}
                disabled={loading}
                required
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputStyle}
                disabled={loading}
                required
                minLength={8}
              />
            </div>

            <Button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-all transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
