'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
const hotelIcon = new Icon({
  iconUrl: '/markers/hotel.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const attractionIcon = new Icon({
  iconUrl: '/markers/attraction.png',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

// Fallback icons using Leaflet's default CDN
const defaultHotelIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Location {
  lat: number;
  lng: number;
  name: string;
  type?: string;
}

interface HotelMapProps {
  hotel: Location;
  attractions?: Location[];
  className?: string;
  zoom?: number;
}

export function HotelMap({
  hotel,
  attractions = [],
  className = 'h-64',
  zoom = 14,
}: HotelMapProps) {
  const center: LatLngExpression = [hotel.lat, hotel.lng];

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`rounded-lg ${className}`}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Hotel marker */}
      <Marker position={[hotel.lat, hotel.lng]} icon={defaultHotelIcon}>
        <Popup>
          <strong>{hotel.name}</strong>
          <br />
          Your hotel
        </Popup>
      </Marker>

      {/* Attraction markers */}
      {attractions.map((attraction, index) => (
        <Marker
          key={index}
          position={[attraction.lat, attraction.lng]}
          icon={defaultHotelIcon}
        >
          <Popup>
            <strong>{attraction.name}</strong>
            {attraction.type && (
              <>
                <br />
                {attraction.type}
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
