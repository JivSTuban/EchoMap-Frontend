import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { fromLonLat, transform } from 'ol/proj';
import { Style, Icon, Text, Fill, Stroke } from 'ol/style';
import { useGeolocation } from '../hooks/useGeolocation';

export const LocationPicker = ({ value, onChange, disabled }) => {
  const mapRef = useRef();
  const mapInstance = useRef(null);
  const markerLayer = useRef(null);
  const { position, error, loading, permissionDenied } = useGeolocation();
  const initialViewSet = useRef(false);
  const [pulseEffect, setPulseEffect] = useState(false);

  // Initialize map with a neutral starting point
  useEffect(() => {
    if (!mapInstance.current) {
      const map = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM()
          })
        ],
        view: new View({
          // Start with a view of the whole world if no initial position
          center: fromLonLat([0, 20]),
          zoom: 2,
          minZoom: 2,
          maxZoom: 19
        })
      });
      mapInstance.current = map;

      // Create marker layer
      const vectorSource = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: (feature) => {
          return new Style({
            image: new Icon({
              anchor: [0.5, 1.0],
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
              src: '/LOGOicon.png',
              scale: pulseEffect ? 0.008 : 0.005,
              maxWidth: 24,
              maxHeight: 24,
              opacity: pulseEffect ? 0.9 : 1
            })
          });
        }
      });
      map.addLayer(vectorLayer);
      markerLayer.current = vectorLayer;

      // Add click handler if not disabled
      if (!disabled) {
        map.on('click', (evt) => {
          const coordinate = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
          const latLng = { lat: coordinate[1], lng: coordinate[0] };
          onChange(latLng);
          // Trigger pulse animation when location is selected
          triggerPulseAnimation();
        });
      }
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined);
        mapInstance.current = null;
      }
    };
  }, []);

  // Trigger pulse animation for the marker when location is selected
  const triggerPulseAnimation = () => {
    let pulseCount = 0;
    const maxPulses = 3;
    const pulseInterval = setInterval(() => {
      setPulseEffect(prev => !prev);
      pulseCount++;
      if (pulseCount >= maxPulses * 2) { // *2 because each pulse has two states (on/off)
        clearInterval(pulseInterval);
        setPulseEffect(false);
      }
    }, 300);
  };

  // Handle position updates
  useEffect(() => {
    if (!mapInstance.current || !position || initialViewSet.current || disabled) return;

    // Only set initial view once when we get position
    initialViewSet.current = true;
    const latLng = { lat: position.latitude, lng: position.longitude };
    onChange(latLng);
    
    mapInstance.current.getView().animate({
      center: fromLonLat([position.longitude, position.latitude]),
      zoom: 15,
      duration: 1000
    });
    
    // Trigger pulse animation when initial location is set
    triggerPulseAnimation();
  }, [position, disabled, onChange]);

  // Update marker when value changes
  useEffect(() => {
    if (!mapInstance.current || !markerLayer.current) return;

    const source = markerLayer.current.getSource();
    source.clear();

    if (value) {
      const feature = new Feature({
        geometry: new Point(fromLonLat([value.lng, value.lat]))
      });
      source.addFeature(feature);

      // Only animate to the marker if it's a new selection
      if (!initialViewSet.current) {
        mapInstance.current.getView().animate({
          center: fromLonLat([value.lng, value.lat]),
          zoom: 15,
          duration: 500
        });
        
        // Trigger pulse animation when location is set programmatically
        triggerPulseAnimation();
      }
    }
  }, [value, pulseEffect]);
  
  // Force marker layer redraw when pulse effect changes
  useEffect(() => {
    if (markerLayer.current) {
      markerLayer.current.changed();
    }
  }, [pulseEffect]);

  return (
    <div className="space-y-2">
      <div 
        className={`w-full h-60 rounded-xl overflow-hidden border border-gray-200/80 shadow-sm ${
          disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
        }`}
      >
        <div ref={mapRef} className="w-full h-full" />
      </div>
      
      {loading && !value && (
        <div className="text-sm text-gray-500">
          Getting your location...
        </div>
      )}
      
      {permissionDenied && !value && (
        <div className="text-sm text-red-500">
          Location access denied. You can still click on the map to select a location.
        </div>
      )}
      
      {error && !permissionDenied && !value && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}
      
      {!value && !disabled && !loading && !error && (
        <div className="text-sm text-gray-500">
          Click on the map to select a location
        </div>
      )}
      
      {value && (
        <div className="text-sm text-indigo-600 font-medium">
          Memory will be placed at this marker location
        </div>
      )}
    </div>
  );
};