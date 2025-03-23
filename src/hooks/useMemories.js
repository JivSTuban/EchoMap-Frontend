import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth';

export const useMemories = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_ECHOMAP_API_URL}/api/memories`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        console.log('Memories API Response:', response.data);
        setMemories(response.data);
      } catch (err) {
        console.error('Error fetching memories:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();
  }, [token]);

  return { memories, loading, error };
};