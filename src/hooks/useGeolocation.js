import { useState, useEffect, useRef } from 'react';

export const useGeolocation = (options = {}) => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const positionRef = useRef(null); // Keep position in ref to compare latest values
  
  // Stringify options to prevent unnecessary re-renders
  // This way the useEffect dependency won't trigger for the same options object
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    let watchId;
    
    // Only log initialization message on first mount, not on re-renders
    if (!isInitializedRef.current) {
      console.log('Initializing geolocation...');
      isInitializedRef.current = true;
    }
    
    const onSuccess = (pos) => {
      // Extract position data
      const newLat = pos.coords.latitude;
      const newLng = pos.coords.longitude;
      const currentPos = positionRef.current;
      
      // Check if position has significantly changed before updating state
      const hasChangedSignificantly = !currentPos || 
        Math.abs(currentPos.latitude - newLat) > 0.0001 || 
        Math.abs(currentPos.longitude - newLng) > 0.0001;
      
      if (hasChangedSignificantly) {
        console.log('Geolocation update:', {
          lat: newLat.toFixed(7),
          lng: newLng.toFixed(7),
          accuracy: Math.round(pos.coords.accuracy)
        });
        
        const newPosition = {
          latitude: newLat,
          longitude: newLng,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp
        };
        
        // Update both state and ref
        setPosition(newPosition);
        positionRef.current = newPosition;
      }
      
      setLoading(false);
      setError(null);
    };

    const onError = (err) => {
      let errorMsg = err.message;
      
      // Provide more user-friendly error messages
      switch(err.code) {
        case 1: // PERMISSION_DENIED
          errorMsg = 'Location permission denied. Please enable location services.';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMsg = 'Location information is unavailable. Please try again later.';
          break;
        case 3: // TIMEOUT
          errorMsg = 'Location request timed out. Please check your connection.';
          break;
      }
      
      console.error('Geolocation error:', errorMsg, '(Code:', err.code, ')');
      setError(errorMsg);
      setLoading(false);
    };

    // Check if geolocation is available
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser';
      console.error(errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    try {
      // Get initial position with high accuracy
      navigator.geolocation.getCurrentPosition(
        onSuccess, 
        onError, 
        { 
          enableHighAccuracy: true, 
          timeout: 10000,
          maximumAge: 0,
          ...options
        }
      );
      
      // Watch position for changes with lower accuracy to save battery
      watchId = navigator.geolocation.watchPosition(
        onSuccess, 
        onError, 
        { 
          enableHighAccuracy: false, 
          timeout: 15000,
          maximumAge: 30000,
          ...options
        }
      );
    } catch (e) {
      console.error('Error setting up geolocation:', e);
      setError('Failed to initialize location services: ' + e.message);
      setLoading(false);
    }
    
    // Cleanup
    return () => {
      if (watchId) {
        console.log('Cleaning up geolocation watch');
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [optionsKey]); // Only re-run if options change

  return { position, error, loading };
};