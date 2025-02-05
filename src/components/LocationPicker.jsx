import { useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, useMapEvents, Marker } from 'react-leaflet';
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@changey/react-leaflet-markercluster/dist/styles.min.css';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition, disabled }) {
  const map = useMapEvents({
    click(e) {
      if (!disabled) {
        setPosition(e.latlng);
      }
    },
  });

  useEffect(() => {
    if (!disabled && !position) {
      map.locate();
    }
  }, [map, disabled, position]);

  const handleLocationFound = useCallback((e) => {
    if (!disabled) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    }
  }, [map, setPosition, disabled]);

  useEffect(() => {
    map.on('locationfound', handleLocationFound);
    return () => {
      map.off('locationfound', handleLocationFound);
    };
  }, [map, handleLocationFound]);

  return position ? (
    <MarkerClusterGroup>
      <Marker position={position} />
    </MarkerClusterGroup>
  ) : null;
}

export const LocationPicker = ({ value, onChange, disabled }) => {
  const defaultPosition = [14.5995, 120.9842]; // Default to Manila

  return (
    <div 
      className={`w-full h-60 rounded-xl overflow-hidden border border-gray-200/80 shadow-sm ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <MapContainer
        center={value || defaultPosition}
        zoom={13}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          position={value}
          setPosition={onChange}
          disabled={disabled}
        />
      </MapContainer>
    </div>
  );
};