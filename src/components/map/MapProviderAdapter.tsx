'use client';

import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer,
  ZoomControl,
  ScaleControl,
  AttributionControl
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layer } from './LayerManager';

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

// Provider configuration interface
export interface ProviderConfig {
  id: string;
  name: string;
  type: string;
  url?: string;
  apiKey?: string;
  attribution?: string;
  metadata?: {
    mapId?: string;
    [key: string]: any;
  };
}

// Props for the MapProviderAdapter component
interface MapProviderAdapterProps {
  provider: ProviderConfig;
  center: [number, number];
  zoom: number;
  layers?: Layer[];
  height?: string;
  width?: string;
  onMapReady?: (map: any) => void;
  children?: ReactNode;
  className?: string;
}

type LeafletMapInstance = L.Map;
type MapInstance = LeafletMapInstance | null;

/**
 * Map Provider Adapter Component
 * 
 * This component adapts different map providers (Leaflet, Google Maps, Mapbox)
 * into a consistent interface for the application.
 */
export default function MapProviderAdapter({
  provider,
  center,
  zoom,
  layers = [],
  height = '100%',
  width = '100%',
  onMapReady,
  children,
  className = '',
}: MapProviderAdapterProps) {
  const [mapInstance, setMapInstance] = useState<MapInstance>(null);
  const mapRef = useRef<MapInstance>(null);
  
  // Initialize Leaflet icons
  useEffect(() => {
    if (provider.type === 'leaflet') {
      fixLeafletIcons();
    }
  }, [provider.type]);
  
  // Render the appropriate map provider
  const renderMapProvider = () => {
    switch (provider.type) {
      case 'leaflet':
      default:
        return (
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height, width }}
            className={className}
            zoomControl={false}
            attributionControl={false}
            ref={(map) => {
              if (map) {
                setMapInstance(map);
                mapRef.current = map;
                onMapReady?.(map);
              }
            }}
          >
            <TileLayer
              url={provider.url || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
              attribution={provider.attribution || '&copy; OpenStreetMap contributors'}
            />
            <ZoomControl position="bottomright" />
            <ScaleControl position="bottomleft" />
            <AttributionControl position="bottomright" />
            {children}
          </MapContainer>
        );
        
      case 'google':
        return (
          <div className={`${className} relative`} style={{ height, width }}>
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center p-4">
                <p className="text-gray-500 mb-2">Google Maps Placeholder</p>
                <p className="text-sm text-gray-400">
                  Center: {center[0].toFixed(4)}, {center[1].toFixed(4)} | Zoom: {zoom}
                </p>
              </div>
            </div>
            {children}
          </div>
        );
        
      case 'mapbox':
        return (
          <div className={`${className} relative`} style={{ height, width }}>
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center p-4">
                <p className="text-gray-500 mb-2">Mapbox Placeholder</p>
                <p className="text-sm text-gray-400">
                  Center: {center[0].toFixed(4)}, {center[1].toFixed(4)} | Zoom: {zoom}
                </p>
              </div>
            </div>
            {children}
          </div>
        );
    }
  };
  
  return (
    <div className="map-provider-adapter">
      {renderMapProvider()}
    </div>
  );
} 