'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ProjectStatus } from '@/types';

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

interface CommunityMapPreviewProps {
  agencyId: string;
}

// Map bounds updater component
function MapBoundsUpdater({ bounds }: { bounds: L.LatLngBounds | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  
  return null;
}

export default function CommunityMapPreview({ agencyId }: CommunityMapPreviewProps) {
  const router = useRouter();
  const [mapReady, setMapReady] = useState(false);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Default map center (California)
  const defaultCenter: [number, number] = [36.7783, -119.4179];
  const defaultZoom = 6;
  
  useEffect(() => {
    // Fix Leaflet marker icons
    fixLeafletIcons();
    setMapReady(true);
    
    // Fetch projects with locations
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const supabase = createClientComponentClient();
        
        const { data, error } = await supabase
          .from('projects')
          .select('id, title, status, primary_category, geom')
          .eq('agency_id', agencyId)
          .not('geom', 'is', null)
          .in('status', ['active', 'planned'] as ProjectStatus[]);
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setProjects(data);
          
          // Calculate bounds based on project geometries
          const latLngs: L.LatLng[] = [];
          
          data.forEach(project => {
            if (project.geom && project.geom.coordinates) {
              if (project.geom.type === 'Point') {
                const [lng, lat] = project.geom.coordinates;
                latLngs.push(L.latLng(lat, lng));
              }
              // Handle other geometry types if needed
            }
          });
          
          if (latLngs.length > 0) {
            const newBounds = L.latLngBounds(latLngs);
            setBounds(newBounds);
          }
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, [agencyId]);
  
  // Get color for project status
  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'draft':
        return '#94a3b8'; // slate-400
      case 'planned':
        return '#60a5fa'; // blue-400
      case 'active':
        return '#4ade80'; // green-400
      case 'completed':
        return '#2563eb'; // blue-600
      case 'cancelled':
        return '#ef4444'; // red-500
      default:
        return '#94a3b8'; // slate-400
    }
  };
  
  // Handle click on project marker
  const handleProjectClick = (projectId: string) => {
    router.push(`/community/projects/${projectId}`);
  };
  
  if (!mapReady) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rtpa-blue-500"></div>
      </div>
    );
  }
  
  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={true}
    >
      {/* Base tile layer */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Project markers */}
      {projects.map(project => {
        if (project.geom && project.geom.type === 'Point') {
          const [lng, lat] = project.geom.coordinates;
          const color = getStatusColor(project.status);
          
          return (
            <CircleMarker
              key={project.id}
              center={[lat, lng]}
              radius={8}
              pathOptions={{
                color: 'white',
                fillColor: color,
                fillOpacity: 0.8,
                weight: 2,
              }}
              eventHandlers={{
                click: () => handleProjectClick(project.id)
              }}
            >
              <Popup>
                <div className="text-sm max-w-md">
                  <h3 className="font-medium text-base">{project.title}</h3>
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="capitalize">{project.status}</span>
                    </div>
                    {project.primary_category && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span>{project.primary_category}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => handleProjectClick(project.id)}
                      className="w-full px-3 py-1.5 bg-rtpa-blue-600 text-white text-xs font-medium rounded hover:bg-rtpa-blue-700"
                    >
                      View Project Details
                    </button>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        }
        
        return null;
      })}
      
      {/* Update map bounds based on projects */}
      {bounds && <MapBoundsUpdater bounds={bounds} />}
      
      {/* Loading or empty state overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-[1000]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rtpa-blue-500"></div>
        </div>
      )}
      
      {!loading && projects.length === 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-[1000]">
          <div className="text-center p-4 bg-white rounded-lg shadow-md">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No projects on map</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no mapped projects available at this time.
            </p>
          </div>
        </div>
      )}
    </MapContainer>
  );
}
