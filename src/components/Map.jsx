import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { fromLonLat } from 'ol/proj';
import { Style, Icon } from 'ol/style';
import { useMemories } from '../hooks/useMemories';
import { useGeolocation } from '../hooks/useGeolocation';
import 'ol/ol.css';

export const MapView = () => {
  const mapRef = useRef();
  const mapInstance = useRef(null);
  const [selectedMemory, setSelectedMemory] = useState(null);
  const { memories, loading, error } = useMemories();
  const { position } = useGeolocation();

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
        style: new Style({
          image: new Icon({
            anchor: [0.5, 1],
            src: '/markers/marker.png'
          })
        })
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

  const findNearestMemory = (userPosition, memories) => {
    if (!userPosition || !memories || memories.length === 0) return null;

    return memories.reduce((nearest, memory) => {
      const distance = calculateDistance(
        userPosition.latitude,
        userPosition.longitude,
        memory.latitude,
        memory.longitude
      );

      if (!nearest || distance < nearest.distance) {
        return { memory, distance };
      }
      return nearest;
    }, null)?.memory;
  };

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
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Calculate appropriate zoom level based on distance
    // Each zoom level doubles the scale
    const baseZoom = 15; // Maximum zoom level for very close points
    const zoomReduction = Math.log2(distance + 1); // +1 to avoid log(0)
    return Math.max(baseZoom - zoomReduction, 10); // Don't zoom out too far
  };

  // Update user location and memories on map
  useEffect(() => {
    if (!mapInstance.current || !memories) return;

    const source = mapInstance.current.getLayers().getArray()[1].getSource();
    source.clear();

    // Add memory markers
    memories.forEach(memory => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([memory.longitude, memory.latitude])),
        properties: memory
      });
      source.addFeature(feature);
    });

    // If we have user position and memories, focus on the nearest memory
    if (position && memories.length > 0) {
      const nearestMemory = findNearestMemory(position, memories);
      if (nearestMemory) {
        const view = mapInstance.current.getView();
        // Calculate center point between user and nearest memory
        const centerLon = (position.longitude + nearestMemory.longitude) / 2;
        const centerLat = (position.latitude + nearestMemory.latitude) / 2;
        
        // Calculate appropriate zoom level based on distance
        const zoom = calculateZoomLevel(
          position.latitude,
          position.longitude,
          nearestMemory.latitude,
          nearestMemory.longitude
        );
        
        view.animate({
          center: fromLonLat([centerLon, centerLat]),
          zoom: zoom,
          duration: 1000
        });
        
        setSelectedMemory(nearestMemory);
      }
    }
    // If we only have user position, center on that
    else if (position) {
      const view = mapInstance.current.getView();
      view.animate({
        center: fromLonLat([position.longitude, position.latitude]),
        zoom: 15,
        duration: 1000
      });
    }
  }, [position, memories]);

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
      } else {
        setSelectedMemory(null);
      }
    };

    mapInstance.current.on('click', handleClick);
    return () => mapInstance.current?.un('click', handleClick);
  }, []);

  return (
    <div className="w-full h-[calc(100vh-4rem)]">
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Memory Details Popup */}
      {selectedMemory && (
        <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-lg">
          <h3 className="font-bold">{selectedMemory.description}</h3>
          <p className="text-sm text-gray-600">
            Created by: {selectedMemory.username}
          </p>
          {selectedMemory.audioUrl && (
            <audio controls className="mt-2">
              <source src={selectedMemory.audioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          )}
          <button
            onClick={() => setSelectedMemory(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      )}

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
    </div>
  );
};
