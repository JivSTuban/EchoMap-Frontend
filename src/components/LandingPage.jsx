import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@heroui/react";
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useState } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const LandingPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { login } = useContext(AuthContext);

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-100 bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <div className="relative px-6 lg:px-8">
          <div className="mx-auto max-w-7xl py-24 sm:py-32 lg:py-40">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                <span className="text-gray-900">Share Your World's</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 animate-gradient">
                  Visual & Audio Memories
                </span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto font-medium">
                Navigram transforms how you capture and share moments. Pin your photos, videos, and audio memories to locations, 
                creating a rich multimedia journey through life.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link to="/register">
                  <Button className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full transition-all transform hover:scale-105 shadow-lg">
                    Get Started
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="px-8 py-3 border-2 border-gray-900 text-gray-900 rounded-full hover:bg-gray-50 transition-all shadow-sm"
                  onPress={async () => {
                    try {
                      setLoading(true);
                      const response = await axios.post(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/guest/auth/register`);
                      const { token } = response.data;
                      
                      await login(token);
                      addNotification('Quick access granted! Welcome to Navigram', 'success');
                      navigate('/map');
                    } catch (error) {
                      console.error('Quick access failed:', error);
                      addNotification(error.response?.data?.message || 'Quick access failed. Please try again.', 'error');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                >
                  {loading ? 'Accessing...' : 'Login as Guest'}
                </Button>
              </div>
            </div>
          </div>

          {/* Feature section */}
          <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="relative p-6 bg-white bg-opacity-50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
                <div className="absolute top-6 right-6 h-8 w-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg opacity-75" />
                <h3 className="text-lg font-semibold text-gray-900">Location-Based Memories</h3>
                <p className="mt-2 text-gray-600">Pin your audio memories to specific locations and rediscover them as you explore.</p>
              </div>
              <div className="relative p-6 bg-white bg-opacity-50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
                <div className="absolute top-6 right-6 h-8 w-8 bg-gradient-to-br from-pink-500 to-purple-500 rounded-lg opacity-75" />
                <h3 className="text-lg font-semibold text-gray-900">Privacy Controls</h3>
                <p className="mt-2 text-gray-600">Full control over who can access your memories with customizable privacy settings.</p>
              </div>
              <div className="relative p-6 bg-white bg-opacity-50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
                <div className="absolute top-6 right-6 h-8 w-8 bg-gradient-to-br from-orange-500 to-pink-500 rounded-lg opacity-75" />
                <h3 className="text-lg font-semibold text-gray-900">Interactive Map</h3>
                <p className="mt-2 text-gray-600">Explore memories through our intuitive map interface with custom filters.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
