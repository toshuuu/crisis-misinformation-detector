import { Fragment, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS = {
  active: '#FF3B3B',
  verified: '#10B981',
  uncertain: '#F59E0B',
  false: '#6B7280',
};

// Custom SVG icon generator for Crisis Reports
const createCustomIcon = (color) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" stroke="white" stroke-width="1"/>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: svg,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

// User Location Blue Dot
const userLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `
    <svg width="20" height="20" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="#3B82F6" stroke="white" stroke-width="3" />
    </svg>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Selected Crisis Location Marker
const selectedLocationIcon = L.divIcon({
  className: 'selected-location-marker',
  html: `
    <svg width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="transparent" stroke="#10B981" stroke-width="4" stroke-dasharray="4 4" />
      <circle cx="12" cy="12" r="4" fill="#10B981" />
    </svg>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Component to dynamically fly to user location on load
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);
  return null;
};

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick && onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
};

const MapComponent = ({ center, reports, userLocation, onMarkerClick, onMapClick, selectedCrisisLocation }) => {
  const defaultCenter = [18.5204, 73.8567]; // Pune coords fallback
  const mapCenter = center ? [center.lat, center.lng] : defaultCenter;

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer 
        center={mapCenter} 
        zoom={13} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <MapController center={center} />
        <MapClickHandler onMapClick={onMapClick} />
        
        {/* OpenStreetMap Base Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* User Location */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          />
        )}

        {/* Selected Crisis Location */}
        {selectedCrisisLocation && (
          <Marker
            position={[selectedCrisisLocation.lat, selectedCrisisLocation.lng]}
            icon={selectedLocationIcon}
          />
        )}

        {/* Crisis Reports */}
        {reports.map((report) => {
          const lat = report.location?.coordinates?.[1];
          const lng = report.location?.coordinates?.[0];
          if (lat == null || lng == null) return null;

          const color = STATUS_COLORS[report.status] || '#FF3B3B';

          return (
            <Fragment key={report._id}>
              <Marker
                position={[lat, lng]}
                icon={createCustomIcon(color)}
                eventHandlers={{
                  click: () => onMarkerClick(report),
                }}
              />
              {report.status === 'active' && (
                <Circle
                  center={[lat, lng]}
                  radius={2000}
                  pathOptions={{
                    fillColor: '#FF3B3B',
                    fillOpacity: 0.08,
                    color: '#FF3B3B',
                    opacity: 0.2,
                    weight: 1,
                  }}
                />
              )}
            </Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
