import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Icon, Text, Fill, Stroke } from 'ol/style';
import { useGeolocation } from '../hooks/useGeolocation';
import { MemoryClusterPopup } from './MemoryClusterPopup';
import API from '../services/api';
import 'ol/ol.css';

export const MapView = () => {
  const mapRef = useRef();
  const mapInstance = useRef(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [clusterMemories, setClusterMemories] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchPosition = useRef(null);
  const lastFetchTime = useRef(0);
  const isFetchingRef = useRef(false);
  const backoffTimeRef = useRef(2000); // Start with 2 seconds backoff
  const errorCountRef = useRef(0);
  const hasInitialZoom = useRef(false);
  const isAnimatingRef = useRef(false);
  const memoryFetchedRef = useRef(false); // Track if memories have been loaded already
  
  // Use memoized geolocation options to prevent unnecessary re-renders
  const geoOptions = useMemo(() => ({ 
    enableHighAccuracy: true, 
    timeout: 15000,
    maximumAge: 5000 
  }), []);
  
  // Use the geolocation hook with stable options
  const { position, error: geoError, loading: geoLoading } = useGeolocation(geoOptions);
  const [showClusterPopup, setShowClusterPopup] = useState(false);

  // Add some debugging to help us understand what's happening with geolocation
  useEffect(() => {
    if (position) {
      console.log('Map received position update:', {
        lat: position.latitude.toFixed(7),
        lng: position.longitude.toFixed(7),
        accuracy: Math.round(position.accuracy)
      });
    }
    
    if (geoError) {
      console.error('Map received geolocation error:', geoError);
    }
    
    if (geoLoading) {
      console.log('Geolocation is loading...');
    }
  }, [position, geoError, geoLoading]);

  // Calculate distance between two coordinates in km
  const getDistanceBetweenPositions = useCallback((pos1, pos2) => {
    if (!pos1 || !pos2) return Infinity;
    
    const R = 6371; // Earth's radius in km
    const dLat = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const dLon = (pos2.longitude - pos1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(pos1.latitude * Math.PI / 180) * Math.cos(pos2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Reset backoff time when component mounts
  useEffect(() => {
    backoffTimeRef.current = 2000;
    errorCountRef.current = 0;
    
    // Debug monitor for memory usage
    const memoryDebugMonitor = setInterval(() => {
      // Chrome-specific memory monitoring
      if (window.performance && 'memory' in window.performance) {
        console.debug('Memory usage (MB):', {
          used: Math.round(window.performance.memory.usedJSHeapSize / (1024 * 1024)),
          total: Math.round(window.performance.memory.totalJSHeapSize / (1024 * 1024)),
          limit: Math.round(window.performance.memory.jsHeapSizeLimit / (1024 * 1024))
        });
      }
      
      if (position) {
        console.debug('Current position:', {
          lat: position.latitude.toFixed(6),
          lng: position.longitude.toFixed(6),
          acc: position.accuracy?.toFixed(2) || 'unknown',
          memories: memories.length,
          fetched: memoryFetchedRef.current
        });
      }
    }, 10000); // Log every 10 seconds
    
    return () => {
      // Clean up any pending operations
      isFetchingRef.current = false;
      clearInterval(memoryDebugMonitor);
    };
  }, [position, memories.length]);

  // Fetch nearby memories when position changes
  useEffect(() => {
    if (!position || isFetchingRef.current) return;
    
    // Skip if we've already loaded memories once and already have memories
    // But always fetch at least once when position is available
    if (memoryFetchedRef.current && memories.length > 0) {
      console.log('Skipping memory fetch - already loaded memories:', memories.length);
      return;
    }

    // Create a stable function for fetching memories
    const fetchNearbyMemories = async () => {
      // Skip fetch if position hasn't changed significantly (less than 100 meters)
      // or if we fetched recently (less than backoff time)
      const distance = getDistanceBetweenPositions(lastFetchPosition.current, position);
      const timeSinceLastFetch = Date.now() - lastFetchTime.current;
      
      if (
        lastFetchPosition.current && 
        distance < 0.1 && // 100 meters threshold
        timeSinceLastFetch < backoffTimeRef.current &&
        memories.length > 0 // Only skip if we already have memories
      ) {
        console.log(`Skipping memory fetch - not enough change or too soon (${timeSinceLastFetch}ms < ${backoffTimeRef.current}ms)`);
        return;
      }
      
      try {
        isFetchingRef.current = true;
        setLoading(true);
        setError(null);
        
        console.log('Fetching memories at position:', {
          lat: position.latitude,
          lng: position.longitude,
          backoffTime: backoffTimeRef.current
        });
        
        // Use the public endpoint if user is not logged in
        const endpoint = '/api/memories/nearby/public';
        const response = await API.get(endpoint, {
          params: {
            lat: position.latitude,
            lng: position.longitude,
            radius: 10 // 10km radius
          },
          // Add timeout to prevent hanging requests
          timeout: 10000
        });
        
        console.log(`Found ${response.data.length} memories nearby`);
        setMemories(response.data);
        
        // Mark that we've successfully loaded memories
        memoryFetchedRef.current = true;
        
        // Update last fetch position and time
        lastFetchPosition.current = {
          latitude: position.latitude,
          longitude: position.longitude
        };
        lastFetchTime.current = Date.now();
        
        // Reset backoff on success
        backoffTimeRef.current = 2000;
        errorCountRef.current = 0;
      } catch (err) {
        console.error('Error fetching nearby memories:', err);
        setError('Failed to load memories');
        
        // Increase backoff time exponentially on error (max 60 seconds)
        errorCountRef.current += 1;
        if (errorCountRef.current > 3) {
          backoffTimeRef.current = Math.min(backoffTimeRef.current * 2, 60000);
          console.log(`Increasing backoff time to ${backoffTimeRef.current}ms`);
        }
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    // Use setTimeout to ensure we don't trigger immediate fetches
    // when position updates rapidly
    const timerId = setTimeout(() => {
      fetchNearbyMemories();
    }, 500);
    
    return () => clearTimeout(timerId);
  }, [position, getDistanceBetweenPositions, memories.length]);

  useEffect(() => {
    if (!mapInstance.current) {
      // Initialize map
      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM()
          })
        ],
        view: new View({
          center: fromLonLat([0, 0]),
          zoom: 2
        })
      });
      mapInstance.current = map;

      // Add vector layer for memories
      const memorySource = new VectorSource();
      const memoryLayer = new VectorLayer({
        source: memorySource,
        style: function(feature) {
          const memory = feature.get('properties');
          
          // Use LOGOicon.png as marker for all memory types
          const iconSrc = '/LOGOicon.png';
          
          return new Style({
            image: new Icon({
              anchor: [0.5, 1.0], // Set anchor to bottom center of the icon
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
              scale: 0.01, // Smaller fixed scale for the logo icon
              src: iconSrc,
              maxWidth: 24, // Limit maximum width
              maxHeight: 24 // Limit maximum height
            })
            // Title text removed to keep map cleaner
          });
        }
      });
      
      map.addLayer(memoryLayer);

      // Handle click events on the map
      map.on('click', function(event) {
        const features = map.getFeaturesAtPixel(event.pixel);
        if (features && features.length > 0) {
          // Get the first feature that has memory properties
          const feature = features.find(f => f.get('properties'));
          
          if (feature) {
            const clickedMemory = feature.get('properties');
            
            // Get current zoom level
            const currentZoom = map.getView().getZoom();
            
            // Calculate dynamic proximity threshold based on zoom level
            // Higher zoom = smaller threshold (less clustering)
            // Base threshold is 0.05 km (50 meters) at zoom level 15
            const baseThreshold = 0.05; // 50 meters at zoom level 15
            const zoomFactor = Math.max(0.001, Math.pow(0.5, (currentZoom - 15))); // Exponential reduction with smaller minimum
            
            // For very high zoom levels (> 20), use an even smaller threshold
            let proximityThreshold;
            if (currentZoom > 20) {
              // Calculate super-precise threshold for high zoom (5cm at zoom level 21+)
              proximityThreshold = 0.00005;
            } else {
              proximityThreshold = baseThreshold * zoomFactor;
            }
            
            console.log(`Current zoom: ${currentZoom}, using proximity threshold: ${proximityThreshold.toFixed(5)} km`);
            
            // Check if there are other memories nearby the clicked one
            const clickedCoords = {
              latitude: clickedMemory.latitude,
              longitude: clickedMemory.longitude
            };
            
            // Find memories within dynamic threshold
            const closeMemories = memories.filter(memory => {
              const memoryCoords = {
                latitude: memory.latitude,
                longitude: memory.longitude
              };
              
              const distance = getDistanceBetweenPositions(clickedCoords, memoryCoords);
              return distance <= proximityThreshold;
            });
            
            console.log(`Found ${closeMemories.length} memories within ${proximityThreshold.toFixed(5)}km of clicked memory`);
            
            // If multiple memories are close, show them in a cluster
            if (closeMemories.length > 1) {
              setClusterMemories(closeMemories);
              setShowClusterPopup(true);
            } else {
              // For single memory, also use the cluster popup component with just one memory
              setClusterMemories([clickedMemory]);
              setShowClusterPopup(true);
            }
          }
        }
      });
      
      // Center on user's location once we have position data
      map.on('postrender', function() {
        if (position && !hasInitialZoom.current && !isAnimatingRef.current) {
          const userCoords = fromLonLat([position.longitude, position.latitude]);
          isAnimatingRef.current = true;
          
          // Smoothly animate to user's location
          const view = map.getView();
          view.animate({
            center: userCoords,
            zoom: 15,
            duration: 1000
          }, function() {
            hasInitialZoom.current = true;
            isAnimatingRef.current = false;
          });
        }
      });
    }
    
    // Clean up map when component unmounts
    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined);
        mapInstance.current = null;
      }
    };
  }, [position, getDistanceBetweenPositions, memories]);

  // Update memory markers on the map when memories change
  useEffect(() => {
    if (!mapInstance.current || !memories || memories.length === 0) return;
    
    console.log('Updating map with memories:', memories.length);
    
    const map = mapInstance.current;
    const memoryLayer = map.getLayers().getArray().find(layer => 
      layer instanceof VectorLayer && layer.getSource() instanceof VectorSource
    );
    
    if (!memoryLayer) {
      console.error('Memory layer not found');
      return;
    }
    
    const source = memoryLayer.getSource();
    source.clear();
    
    // Add memory features
    memories.forEach(memory => {
      if (!memory.latitude || !memory.longitude) {
        console.warn('Memory missing coordinates:', memory.id);
        return;
      }
      
      try {
        const coords = fromLonLat([memory.longitude, memory.latitude]);
        const feature = new Feature({
          geometry: new Point(coords),
          properties: memory
        });
        feature.setId(memory.id);
        source.addFeature(feature);
      } catch (e) {
        console.error('Error adding memory feature:', e, memory);
      }
    });
    
    // If we haven't zoomed to user location yet and we have memories,
    // center on the first memory (fallback)
    if (!hasInitialZoom.current && !position && memories.length > 0 && !isAnimatingRef.current) {
      const firstMemory = memories[0];
      if (firstMemory.latitude && firstMemory.longitude) {
        isAnimatingRef.current = true;
        const memoryCoords = fromLonLat([firstMemory.longitude, firstMemory.latitude]);
        const view = map.getView();
        
        view.animate({
          center: memoryCoords,
          zoom: 15, 
          duration: 1000
        }, function() {
          hasInitialZoom.current = true;
          isAnimatingRef.current = false;
        });
      }
    }
  }, [memories, position]);

  // Handle closing memory details modal
  const closeClusterPopup = () => {
    // Add a small delay to avoid conflicts with potential immediate reopening
    setTimeout(() => {
      setShowClusterPopup(false);
      setClusterMemories([]);
    }, 50);
  };

  // Handle selecting a memory from the cluster popup to view details
  const handleSelectMemoryFromCluster = (memory) => {
    // No longer needed to set selected memory, as we'll use the cluster popup for individual memories too
    console.log('Selected memory from cluster:', memory.id);
  };

  return (
    <div className="w-full h-[calc(100vh-4rem)] relative">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md">
          <div className="flex items-center space-x-2">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium">Loading memories...</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-50 text-red-700 px-4 py-2 rounded-full shadow-md">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button 
        className="absolute top-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-10"
        style={{ display: loading ? 'none' : 'block' }}
        onClick={() => {
          // Reset fetch flag and trigger a new fetch
          console.log('Manual refresh requested - resetting memory fetch state');
          memoryFetchedRef.current = false;
          // Force re-render to trigger useEffect
          setMemories([]);
        }}
        aria-label="Refresh memories"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Memory Count */}
      {memories.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-full shadow-md z-10">
          <span className="text-sm font-medium">
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'} nearby
          </span>
        </div>
      )}

      {/* My Location Button */}
      <button 
        className="absolute bottom-4 right-4 bg-white p-3 mb-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
        onClick={() => {
          if (!position || !mapInstance.current) return;
          
          // Center map on user's current location
          const userCoords = fromLonLat([position.longitude, position.latitude]);
          isAnimatingRef.current = true;
          
          const view = mapInstance.current.getView();
          view.animate({
            center: userCoords,
            zoom: 17, // Slightly higher zoom for better detail
            duration: 750
          }, function() {
            isAnimatingRef.current = false;
          });
        }}
        aria-label="Center on my location"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Memory Cluster Popup */}
      <MemoryClusterPopup
        memories={clusterMemories}
        isOpen={showClusterPopup}
        onClose={closeClusterPopup}
        onSelectMemory={handleSelectMemoryFromCluster}
      />
    </div>
  );
};
