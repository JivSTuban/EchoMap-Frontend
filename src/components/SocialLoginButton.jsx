import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import GoogleIcon from './icons/GoogleIcon';

const SocialLoginButton = ({ provider, label }) => {
  const { loginWithRedirect } = useAuth0();

  const handleLogin = async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          connection: provider
        }
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const getIcon = () => {
    switch (provider) {
      case 'google-oauth2':
        return <GoogleIcon />;
      default:
        return null;
    }
  };

  return (
    <button 
      onClick={handleLogin}
      className="w-full py-3 px-4 mb-3 border border-gray-300 rounded-lg flex items-center justify-center gap-3 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
    >
      {getIcon()}
      <span className="text-gray-700 font-medium">{label || `Continue with ${provider}`}</span>
    </button>
  );
};

export default SocialLoginButton;