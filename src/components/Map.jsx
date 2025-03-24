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
import { MemoryDetailsModal } from './MemoryDetailsModal';
import API from '../services/api';
import 'ol/ol.css';

export const MapView = () => {
  const mapRef = useRef();
  const mapInstance = useRef(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
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
  const [showModal, setShowModal] = useState(false);

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
            }),
            // Add label with distance if available
            text: memory.distanceInMeters ? new Text({
              text: `${(memory.distanceInMeters / 1000).toFixed(1)}km`,
              offsetY: 20,
              fill: new Fill({ color: '#333' }),
              stroke: new Stroke({ color: '#fff', width: 2 })
            }) : undefined
          });
        }
      });
      map.addLayer(memoryLayer);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined);
        mapInstance.current = null;
      }
    };
  }, []);

  // Update user location and memories on map
  useEffect(() => {
    if (!mapInstance.current) return;
    if (isAnimatingRef.current) return; // Skip if animation is in progress

    const source = mapInstance.current.getLayers().getArray()[1].getSource();
    source.clear();

    // Add memory markers
    if (memories.length > 0) {
      console.log('Adding memory markers to map:', memories.map(m => ({
        id: m.id,
        lat: m.latitude,
        lng: m.longitude,
        description: m.description,
        mediaType: m.mediaType
      })));
    }
    
    memories.forEach(memory => {
      if (memory.latitude && memory.longitude) {
      const feature = new Feature({
        geometry: new Point(fromLonLat([memory.longitude, memory.latitude])),
        properties: memory
      });
      source.addFeature(feature);
        console.log(`Added marker for memory ${memory.id} at position ${memory.latitude}, ${memory.longitude}`);
      } else {
        console.warn('Memory missing coordinates:', memory);
      }
    });

    // Always zoom to user's position first when it becomes available
    if (position) {
        const view = mapInstance.current.getView();
      
      // Get current map state
      const currentCenter = toLonLat(view.getCenter());
      const currentDistance = calculateDistance(
        position.latitude, position.longitude,
        currentCenter[1], currentCenter[0]
      );
      const currentZoom = view.getZoom();
      
      // Only zoom if:
      // 1. We haven't done initial zoom yet, OR
      // 2. User is far from current center AND we're not currently animating
      const needsInitialZoom = !hasInitialZoom.current;
      const needsRepositioning = currentDistance > 5 && currentZoom < 12;
      
      if (needsInitialZoom || needsRepositioning) {
        // Set flag to prevent recursive animations
        isAnimatingRef.current = true;
        
        // Set initial zoom flag
        hasInitialZoom.current = true;
        
        console.log('Animating map to user position:', {
          lat: position.latitude,
          lng: position.longitude,
          isInitial: needsInitialZoom
        });
        
        view.animate({
          center: fromLonLat([position.longitude, position.latitude]),
          zoom: 15,
          duration: 1000
        }, () => {
          // After animation completes, update memories if needed
          if (memories.length > 0) {
            fitMapToMemoriesAndUser(view, position, memories);
          }
          
          // Release animation lock after a small delay
          setTimeout(() => {
            isAnimatingRef.current = false;
          }, 200);
        });
      } else if (memories.length > 0 && !isAnimatingRef.current) {
        // Only fit memories if we're not already animating
        isAnimatingRef.current = true;
        fitMapToMemoriesAndUser(view, position, memories);
        
        // Release animation lock after a delay
        setTimeout(() => {
          isAnimatingRef.current = false;
        }, 200);
      }
    }
  }, [position, memories]);
  
  // Function to fit map view to include user and all memories
  const fitMapToMemoriesAndUser = (view, userPosition, memoriesToFit) => {
    if (!memoriesToFit.length || !userPosition || isAnimatingRef.current) return;
    
    console.log('Fitting map to include user and memories', {
      userPosition: {
        lat: userPosition.latitude,
        lng: userPosition.longitude
      },
      memoryCount: memoriesToFit.length
    });
    
    // Find the memory that is furthest from the user
    let maxDistance = 0;
    let furthestMemory = null;
    
    memoriesToFit.forEach(memory => {
      const distance = calculateDistance(
        userPosition.latitude, userPosition.longitude,
        memory.latitude, memory.longitude
      );
      
      if (distance > maxDistance) {
        maxDistance = distance;
        furthestMemory = memory;
      }
    });
    
    // Always adjust the view to include memories, even if they're close
    // This makes sure we can see both the user and memories
    if (furthestMemory) {
      // Calculate appropriate zoom to fit all memories
      const zoom = calculateZoomLevel(
        userPosition.latitude, userPosition.longitude,
        furthestMemory.latitude, furthestMemory.longitude
      );
      
      // Calculate center between user and furthest memory
      const centerLat = (userPosition.latitude + furthestMemory.latitude) / 2;
      const centerLon = (userPosition.longitude + furthestMemory.longitude) / 2;
      
      console.log('Fitting map with calculated parameters', {
        maxDistance,
        zoom,
        center: [centerLon, centerLat]
      });
      
      // Use a gentler animation for the adjustment
      view.animate({
        center: fromLonLat([centerLon, centerLat]),
        zoom: Math.min(zoom, 16), // Cap zoom to avoid getting too close
        duration: 800
      }, () => {
        // Release animation lock after animation completes
        setTimeout(() => {
          isAnimatingRef.current = false;
        }, 200);
      });
    } else {
      // If no adjustment needed, release animation lock
      isAnimatingRef.current = false;
    }
  };

  // Handle click events
  useEffect(() => {
    if (!mapInstance.current) return;

    const handleClick = (event) => {
      const feature = mapInstance.current.forEachFeatureAtPixel(
        event.pixel,
        feature => feature
      );

      if (feature) {
        const memory = feature.get('properties');
        setSelectedMemory(memory);
        setShowModal(true);
      }
    };

    mapInstance.current.on('click', handleClick);
    return () => mapInstance.current?.un('click', handleClick);
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const calculateZoomLevel = (lat1, lon1, lat2, lon2) => {
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    const baseZoom = 15;
    const zoomReduction = Math.log2(distance + 1);
    return Math.max(baseZoom - zoomReduction, 10);
  };

  const closeModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedMemory(null), 300); // Clear after animation
  };

  // Verify that all memories are properly displayed every few seconds
  useEffect(() => {
    if (!memories.length || !mapInstance.current) return;
    
    // Set up a periodic check to verify memories are on the map
    const memoryCheckInterval = setInterval(() => {
      if (!mapInstance.current) return;
      
      const source = mapInstance.current.getLayers().getArray()[1]?.getSource();
      if (!source) return;
      
      const featuresCount = source.getFeatures().length;
      
      // If we have memories but no features, something's wrong - try to redraw
      if (memories.length > 0 && featuresCount === 0) {
        console.warn(`Memory display issue detected: ${memories.length} memories but ${featuresCount} features on map. Redrawing...`);
        
        // Force redraw by clearing and re-adding
        source.clear();
        
        memories.forEach(memory => {
          if (memory.latitude && memory.longitude) {
            const feature = new Feature({
              geometry: new Point(fromLonLat([memory.longitude, memory.latitude])),
              properties: memory
            });
            source.addFeature(feature);
            console.log(`Re-added memory ${memory.id} to map`);
          }
        });
      } else {
        console.log(`Memory display verification: ${featuresCount}/${memories.length} memories on map`);
      }
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(memoryCheckInterval);
  }, [memories]);

  return (
    <div className="w-full h-[calc(100vh-4rem)] relative">
      <div ref={mapRef} className="w-full h-full cursor-pointer" />
      
      {/* Memory Modal */}
      <MemoryDetailsModal 
        memory={selectedMemory}
        isOpen={showModal}
        onClose={closeModal}
      />

      {/* Loading State */}
      {loading && (
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full shadow">
          Loading memories...
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-100 text-red-700 px-4 py-2 rounded-full shadow">
          Error loading memories
        </div>
      )}

      {/* Refresh Button */}
      <button 
        className="absolute top-4 right-4 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
        style={{ zIndex: 1000, display: loading ? 'none' : 'block' }}
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

      {/* Geolocation States */}
      {!position && !geoError && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 px-6 py-3 rounded-full shadow-lg text-center">
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Finding your location...
          </div>
        </div>
      )}
      
      {/* Geolocation Error */}
      {geoError && (
        <div className="absolute top-4 left-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full shadow max-w-xs">
          {geoError}
        </div>
      )}

      {/* Memory Count */}
      {memories.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-full shadow">
          {memories.length} {memories.length === 1 ? 'memory' : 'memories'} nearby
        </div>
      )}
    </div>
  );
};
