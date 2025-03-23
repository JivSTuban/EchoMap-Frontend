import { useState, useEffect } from 'react';

export const useGeolocation = () => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    console.log('Initializing geolocation...');
    
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const handleSuccess = (pos) => {
      console.log('Geolocation success:', {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
      setPosition({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy
      });
      setError(null);
      setLoading(false);
      setPermissionDenied(false);
    };

    const handleError = (err) => {
      console.log('Geolocation error:', {
        code: err.code,
        message: err.message
      });
      
      if (err.code === 1) { // PERMISSION_DENIED
        setPermissionDenied(true);
        setError('Location access was denied. Please enable location services to use this feature.');
        setLoading(false);
      } else if (err.code === 2) { // POSITION_UNAVAILABLE
        setError('Unable to determine your location. Please try again.');
        setLoading(false);
      } else if (err.code === 3) { // TIMEOUT
        // Don't set loading to false here, we'll try the fallback
        console.log('High accuracy timed out, trying lower accuracy...');
        // Fall back to low accuracy
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (fallbackError) => {
            console.log('Fallback geolocation error:', {
              code: fallbackError.code,
              message: fallbackError.message
            });
            setError('Location request timed out. Please try again or select a location manually.');
            setLoading(false);
          },
          { 
            enableHighAccuracy: false, 
            timeout: 15000,
            maximumAge: 60000  // Accept positions up to 1 minute old
          }
        );
      } else {
        setError(err.message);
        setLoading(false);
      }
    };

    console.log('Requesting current position...');
    setLoading(true);
    
    // Try to get high accuracy position first with a reasonable timeout
    navigator.geolocation.getCurrentPosition(
      handleSuccess, 
      handleError, 
      {
        enableHighAccuracy: true,
        timeout: 7000, // Short timeout for high accuracy attempt
        maximumAge: 0  // Don't use cached positions
      }
    );

    // Set up watch for updates
    const watchOptions = {
      enableHighAccuracy: false, // Use lower accuracy for watching to avoid battery drain
      timeout: 15000,
      maximumAge: 30000 // Accept positions up to 30 seconds old for updates
    };
    
    const watchId = navigator.geolocation.watchPosition(
      handleSuccess, 
      // For watch position, we don't need the fallback logic
      (watchError) => {
        console.log('Watch position error:', watchError);
        // Don't set any state here, as we've already handled getting the position
      }, 
      watchOptions
    );

    return () => {
      console.log('Cleaning up geolocation watch');
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { position, error, loading, permissionDenied };
};