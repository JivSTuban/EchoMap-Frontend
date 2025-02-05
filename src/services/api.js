import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_ECHOMAP_API_URL,
  withCredentials: true
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export const createMemory = async (memoryData) => {
  const { latitude, longitude, ...rest } = memoryData;
  return API.post('/memories', {
    ...rest,
    location: `${latitude},${longitude}`
  });
};

export const getNearbyMemories = async (coords, radius) => {
  return API.get('/memories/nearby', {
    params: {
      lat: coords.latitude,
      lng: coords.longitude,
      radius
    }
  });
};

export const flagMemory = async (memoryId) => {
  return API.post(`/memories/${memoryId}/flag`);
};

export default API;
