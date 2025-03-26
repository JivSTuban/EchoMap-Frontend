import { useState, useEffect, useRef, useCallback } from 'react';

export const useGeolocation = (options = {}) => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const isInitializedRef = useRef(false);
  const positionRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const isRequestingRef = useRef(false);
  
  // Stringify options to prevent unnecessary re-renders
  const optionsKey = JSON.stringify(options);

  const requestLocation = useCallback(() => {
    if (isRequestingRef.current) return;
    
    isRequestingRef.current = true;
    setLoading(true);
    setError(null);
    
    // Try with high accuracy first
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        isRequestingRef.current = false;
        const newPosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          altitudeAccuracy: pos.coords.altitudeAccuracy,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp
        };
        
        setPosition(newPosition);
        positionRef.current = newPosition;
        setLoading(false);
        retryCountRef.current = 0;
      },
      (err) => {
        // If high accuracy fails, try with low accuracy
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            isRequestingRef.current = false;
            const newPosition = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
              timestamp: pos.timestamp
            };
            
            setPosition(newPosition);
            positionRef.current = newPosition;
            setLoading(false);
            retryCountRef.current = 0;
          },
          (err) => {
            isRequestingRef.current = false;
            let errorMsg = err.message;
            
            switch(err.code) {
              case 1: // PERMISSION_DENIED
                errorMsg = 'Location permission denied. Please enable location services in your browser settings.';
                break;
              case 2: // POSITION_UNAVAILABLE
                errorMsg = 'Location information is unavailable. Please check your device\'s GPS settings.';
                break;
              case 3: // TIMEOUT
                errorMsg = 'Location request timed out. Please try again.';
                break;
            }
            
            console.error('Geolocation error:', errorMsg, '(Code:', err.code, ')');
            setError(errorMsg);
            setLoading(false);
          },
          { 
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 30000
          }
        );
      },
      { 
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0
      }
    );
  }, []);

  useEffect(() => {
    let watchId;
    let timeoutId;
    
    // Only log initialization message on first mount, not on re-renders
    if (!isInitializedRef.current) {
      console.log('Initializing geolocation...');
      isInitializedRef.current = true;
    }
    
    const onSuccess = (pos) => {
      // Clear any pending timeouts
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
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
      retryCountRef.current = 0; // Reset retry count on success
    };

    const onError = (err) => {
      let errorMsg = err.message;
      
      // Provide more user-friendly error messages
      switch(err.code) {
        case 1: // PERMISSION_DENIED
          errorMsg = 'Location permission denied. Please enable location services in your browser settings.';
          break;
        case 2: // POSITION_UNAVAILABLE
          errorMsg = 'Location information is unavailable. Please check your device\'s GPS settings.';
          break;
        case 3: // TIMEOUT
          errorMsg = 'Location request timed out. Retrying...';
          break;
      }
      
      console.error('Geolocation error:', errorMsg, '(Code:', err.code, ')');
      setError(errorMsg);
      
      // Handle retries for timeout errors
      if (err.code === 3 && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`Retrying geolocation (attempt ${retryCountRef.current}/${maxRetries})...`);
        
        // Clear any existing timeouts
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        // Exponential backoff for retries
        const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000);
        
        // Retry with increased timeout and lower accuracy
        timeoutId = setTimeout(() => {
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            onError,
            {
              enableHighAccuracy: false,
              timeout: 30000,
              maximumAge: 30000,
              ...options
            }
          );
        }, backoffTime);
      } else if (retryCountRef.current >= maxRetries) {
        setError('Unable to get location after multiple attempts. Please check your device settings and try again.');
        setLoading(false);
      }
    };

    // Start watching position with high accuracy
    watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
        ...options
      }
    );

    // Cleanup function
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [optionsKey]);

  return { position, error, loading };
};