import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icon function
const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

function LocationMarker({ onPositionChange, onMemoriesUpdate, onClickedPosChange, onNearbyMemoriesUpdate, memories }) {
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const map = useMap();
  
  const mapEvents = useMapEvents({
    click(e) {
      onClickedPosChange(e.latlng);
      findNearbyMemories(e.latlng);
    },
    locationfound(e) {
      console.log('User location:', e.latlng);
      onPositionChange(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      fetchMemories(e.latlng);
    },
    locationerror(e) {
      if (e.code === 1) {
        setPermissionBlocked(true);
      }
    },
  });

  const findNearbyMemories = (latlng) => {
    const clickPoint = turf.point([latlng.lng, latlng.lat]);
    const radius = 0.05; // 50 meters in kilometers

    const nearby = memories.filter(memory => {
      const memoryPoint = turf.point([memory.longitude, memory.latitude]);
      const distance = turf.distance(clickPoint, memoryPoint, { units: 'kilometers' });
      return distance <= radius;
    });

    onNearbyMemoriesUpdate(nearby);
  };

  const fetchMemories = async (latlng) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_ECHOMAP_API_URL}/api/memories/nearby?latitude=${latlng.lat}&longitude=${latlng.lng}`);
      const data = await response.json();
      console.log('Fetched memories:', data);
      onMemoriesUpdate(data);
    } catch (error) {
      console.error('Error fetching memories:', error);
    }
  };

  useEffect(() => {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        map.locate();
      } else if (result.state === 'prompt') {
        map.locate();
      } else if (result.state === 'denied') {
        setPermissionBlocked(true);
      }
      result.onchange = () => {
        if (result.state === 'granted') {
          map.locate();
        } else if (result.state === 'denied') {
          setPermissionBlocked(true);
        }
      };
    });
  }, [map]);

  return (
    <>
      {permissionBlocked && (
        <div className="permission-blocked-message bg-red-100 border-l-4 border-red-500 text-red-700 p-4 fixed top-20 right-4 z-50">
          Geolocation permission has been blocked. Please reset the permission in your browser settings.
          <a href="https://www.chromestatus.com/feature/6443143280984064" 
             className="underline ml-1" 
             target="_blank" 
             rel="noopener noreferrer">
            Learn more
          </a>
        </div>
      )}
    </>
  );
}

function MapControls() {
  const map = useMap();
  
  const goToUserLocation = () => {
    map.locate();
  };

  return (
    <button 
      onClick={goToUserLocation} 
      className="fixed top-20 left-4 z-40 px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
    >
      Go to My Location
    </button>
  );
}

export const Map = () => {
  const defaultPosition = [51.505, -0.09];
  const [position, setPosition] = useState(null);
  const [clickedPos, setClickedPos] = useState(null);
  const [memories, setMemories] = useState([]);
  const [nearbyMemories, setNearbyMemories] = useState([]);

  return (
    <div className="w-full h-[calc(100vh-4rem)] relative">
      <MapContainer
        center={defaultPosition}
        zoom={13}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <LocationMarker 
          onPositionChange={setPosition}
          onMemoriesUpdate={setMemories}
          onClickedPosChange={setClickedPos}
          onNearbyMemoriesUpdate={setNearbyMemories}
          memories={memories}
        />
        <MapControls />
        {position && (
          <Marker position={position} icon={createCustomIcon('blue')}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        
        <MarkerClusterGroup chunkedLoading>
          {clickedPos && (
            <Marker position={clickedPos} icon={createCustomIcon('red')}>
              <Popup>
                <div className="space-y-2">
                  <p>Clicked location: {clickedPos.toString()}</p>
                  <p>Nearby memories: {nearbyMemories.length}</p>
                  {nearbyMemories.length > 0 && (
                    <ul className="list-disc pl-4">
                      {nearbyMemories.map(memory => (
                        <li key={memory.id} className="text-sm">
                          Memory at {memory.latitude.toFixed(4)}, {memory.longitude.toFixed(4)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {memories.map((memory) => (
            <Marker 
              key={memory.id} 
              position={[memory.latitude, memory.longitude]}
              icon={createCustomIcon('purple')}
            >
              <Popup>
                <div className="memory-popup">
                  <audio controls className="w-full">
                    <source src={memory.audioUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                  <p className="text-sm text-gray-600 mt-2">
                    Created: {new Date(memory.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};
