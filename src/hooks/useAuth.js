import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Phone verification methods have been removed as they used Firebase
  // If you need phone verification, please implement it using Auth0 or another service

  return {
    ...context,
    loading
  };
};