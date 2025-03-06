'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icons in Next.js
const fixLeafletIcons = () => {
  // Only run on client-side
  if (typeof window !== 'undefined') {
    // @ts-ignore - TS doesn't know about L.Icon.Default
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      iconUrl: '/leaflet/marker-icon.png',
      shadowUrl: '/leaflet/marker-shadow.png',
    });
  }
};

interface ProjectLocationMapProps {
  onLocationSelect: (coordinates: [number, number]) => void;
  initialCoordinates?: [number, number];
  readOnly?: boolean;
}

// Map Click Handler Component
function LocationMarker({ 
  onLocationSelect, 
  initialPosition
}: { 
  onLocationSelect: (coordinates: [number, number]) => void;
  initialPosition?: [number, number];
}) {
  const [position, setPosition] = useState<[number, number] | null>(initialPosition || null);
  
  const map = useMapEvents({
    click(e) {
      if (!initialPosition) { // Only allow setting marker if not in read-only mode
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        onLocationSelect([lat, lng]);
      }
    },
  });

  useEffect(() => {
    // When initialPosition changes (e.g., cleared from parent), update the marker
    setPosition(initialPosition || null);
    
    // If initialPosition is set, center the map on it
    if (initialPosition && map) {
      map.setView(initialPosition, map.getZoom());
    }
  }, [initialPosition, map]);

  return position === null ? null : (
    <Marker position={position} />
  );
}

export default function ProjectLocationMap({
  onLocationSelect,
  initialCoordinates,
  readOnly = false,
}: ProjectLocationMapProps) {
  const [mapReady, setMapReady] = useState(false);
  
  // Default map center (California)
  const defaultCenter: [number, number] = [36.7783, -119.4179];
  const defaultZoom = 6;
  
  useEffect(() => {
    // Fix Leaflet marker icons
    fixLeafletIcons();
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rtpa-blue-500"></div>
      </div>
    );
  }

  return (
    <MapContainer
      center={initialCoordinates || defaultCenter}
      zoom={initialCoordinates ? 13 : defaultZoom}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker 
        onLocationSelect={onLocationSelect} 
        initialPosition={initialCoordinates}
      />
    </MapContainer>
  );
}
