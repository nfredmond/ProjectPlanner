'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClientComponentClient } from '@/lib/supabase/client';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRouter } from 'next/navigation';

// Fix Leaflet marker icons in Next.js
// (Leaflet expects the marker icons to be in a specific location)
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

interface MapPreviewProps {
  agencyId: string;
}

interface ProjectLocation {
  id: string;
  title: string;
  status: string;
  geom: any;
}

function MapBounds({ bounds }: { bounds: L.LatLngBounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.isValid()) {
      map.fitBounds(bounds);
    }
  }, [bounds, map]);
  return null;
}

export default function MapPreview({ agencyId }: MapPreviewProps) {
  const [projects, setProjects] = useState<ProjectLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [bounds, setBounds] = useState<L.LatLngBounds>(new L.LatLngBounds([0, 0], [0, 0]));
  const router = useRouter();
  
  // Default map center (California)
  const defaultCenter = [36.7783, -119.4179];
  const defaultZoom = 6;

  useEffect(() => {
    // Fix Leaflet marker icons
    fixLeafletIcons();
    setMapReady(true);

    const fetchProjectLocations = async () => {
      try {
        setLoading(true);
        const supabase = createClientComponentClient();
        
        // Query projects with geom (point geometries for this simple preview)
        const { data, error } = await supabase
          .from('projects')
          .select('id, title, status, geom')
          .eq('agency_id', agencyId)
          .not('geom', 'is', null);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setProjects(data);
          
          // Calculate bounds
          const latLngs: L.LatLng[] = [];
          data.forEach(project => {
            if (project.geom && project.geom.coordinates) {
              // Handle point geometries
              if (project.geom.type === 'Point') {
                const [lng, lat] = project.geom.coordinates;
                latLngs.push(L.latLng(lat, lng));
              }
              // Add handling for LineString and Polygon if needed
            }
          });
          
          if (latLngs.length > 0) {
            const newBounds = L.latLngBounds(latLngs);
            setBounds(newBounds);
          }
        }
      } catch (err) {
        console.error('Error fetching project locations:', err);
        setError('Failed to load project locations');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectLocations();
  }, [agencyId]);

  // Color function for project status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return 'blue';
      case 'active':
        return 'green';
      case 'completed':
        return 'purple';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  // Custom marker by status
  const getMarkerIcon = (status: string) => {
    const color = getStatusColor(status);
    return L.divIcon({
      className: 'custom-marker-icon',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };
  
  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rtpa-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="h-64 bg-gray-100 rounded-md overflow-hidden">
      {mapReady && (
        <MapContainer
          center={defaultCenter as [number, number]}
          zoom={defaultZoom}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {projects.map(project => {
            if (project.geom && project.geom.type === 'Point') {
              const [lng, lat] = project.geom.coordinates;
              return (
                <Marker 
                  key={project.id}
                  position={[lat, lng]}
                  icon={getMarkerIcon(project.status)}
                  eventHandlers={{
                    click: () => handleProjectClick(project.id)
                  }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-medium">{project.title}</div>
                      <div className="text-xs mt-1">
                        Status: 
                        <span className="ml-1 capitalize">{project.status}</span>
                      </div>
                      <button
                        className="mt-2 text-xs text-rtpa-blue-600 hover:text-rtpa-blue-800"
                        onClick={() => handleProjectClick(project.id)}
                      >
                        View details →
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            }
            return null;
          })}
          
          {bounds.isValid() && <MapBounds bounds={bounds} />}
        </MapContainer>
      )}
      
      {projects.length === 0 && (
        <div className="h-full flex items-center justify-center text-gray-400">
          No project locations available
        </div>
      )}
    </div>
  );
}
