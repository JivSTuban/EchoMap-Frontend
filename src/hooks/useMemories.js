import { useState, useEffect } from 'react';
import API from '../services/api';
import { useGeolocation } from './useGeolocation';

export const useMemories = (radius = 10) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { position } = useGeolocation();

  useEffect(() => {
    const fetchMemories = async () => {
      if (!position) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await API.get('/api/memories/nearby/public', {
          params: {
            latitude: position.latitude,
            longitude: position.longitude,
            radius
          }
        });
        
        setMemories(response.data);
      } catch (err) {
        console.error('Error fetching memories:', err);
        setError('Failed to load memories');
      } finally {
        setLoading(false);
      }
    };

    if (position) {
      fetchMemories();
    }
  }, [position, radius]);

  return { memories, loading, error };
};