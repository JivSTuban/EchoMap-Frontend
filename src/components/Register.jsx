import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input } from "@heroui/react";
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

export const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  const handleRegister = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/register`, {
        username,
        email,
        password
      });
      
      if (response.data) {
        const loginResponse = await axios.post(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/auth/login`, {
          username,
          password
        });
        
        const { token, role } = loginResponse.data;
        if (token) {
          localStorage.setItem('token', token);
          addNotification('Registration successful!', 'success');
          navigate('/');
        } else {
          throw new Error('Login failed after registration');
        }
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
    <main className="flex-1 flex items-center justify-center px-6 py-16 lg:px-8">
      <div className="bg-white/70 backdrop-blur-sm p-10 rounded-2xl shadow-lg border border-gray-200/80 w-full max-w-xl">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="text-center text-3xl font-bold leading-9 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 mb-2">
            Create Account
          </h2>
        </div>

        <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-sm space-y-6">
          <div className="space-y-6">
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputStyle}
              disabled={loading}
            />
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputStyle}
              disabled={loading}
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputStyle}
              disabled={loading}
            />
          </div>

          <div className="space-y-4">
            <Button
              className="w-full px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full hover:opacity-90 transition-all transform hover:scale-105 shadow-md"
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>


          </div>

          <p className="mt-10 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};
