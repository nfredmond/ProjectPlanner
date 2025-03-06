'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap, 
  GeoJSON,
  CircleMarker,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ProjectStatus } from '@/types';
import { MapFeedbackForm } from '@/components/community/map-feedback-form';

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

interface ProjectsMapProps {
  projects: any[];
  defaultCenter: [number, number];
  defaultZoom: number;
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

// Map click handler component
function MapClickHandler({ 
  onMapClick, 
  enableFeedback 
}: { 
  onMapClick: (latlng: L.LatLng) => void,
  enableFeedback: boolean
}) {
  const map = useMapEvents({
    click: (e) => {
      if (enableFeedback) {
        onMapClick(e.latlng);
      }
    },
  });
  
  return null;
}

export default function ProjectsMap({
  projects,
  defaultCenter,
  defaultZoom,
  agencyId,
  enableFeedback = false,
}: ProjectsMapProps & {
  agencyId?: string;
  enableFeedback?: boolean;
}) {
  const router = useRouter();
  const [mapReady, setMapReady] = useState(false);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [feedbackFormOpen, setFeedbackFormOpen] = useState(false);
  const [clickedLocation, setClickedLocation] = useState<L.LatLng | null>(null);
  
  useEffect(() => {
    // Fix Leaflet marker icons
    fixLeafletIcons();
    setMapReady(true);
    
    // Calculate bounds based on project geometries
    if (projects && projects.length > 0) {
      const latLngs: L.LatLng[] = [];
      
      projects.forEach(project => {
        if (project.geom && project.geom.coordinates) {
          if (project.geom.type === 'Point') {
            const [lng, lat] = project.geom.coordinates;
            latLngs.push(L.latLng(lat, lng));
          }
          // Handle other geometry types (LineString, Polygon, etc.) if needed
          // ...
        }
      });
      
      if (latLngs.length > 0) {
        const newBounds = L.latLngBounds(latLngs);
        setBounds(newBounds);
      }
    }
  }, [projects]);
  
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
    router.push(`/projects/${projectId}`);
  };
  
  // Format currency
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Handle map click for feedback
  const handleMapClick = (latlng: L.LatLng) => {
    setClickedLocation(latlng);
    setFeedbackFormOpen(true);
  };
  
  // Close feedback form
  const handleCloseFeedbackForm = () => {
    setFeedbackFormOpen(false);
    setClickedLocation(null);
  };
  
  if (!mapReady) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rtpa-blue-500"></div>
      </div>
    );
  }
  
  return (
    <>
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
        
        {/* Map click handler for feedback */}
        {enableFeedback && agencyId && (
          <MapClickHandler 
            onMapClick={handleMapClick} 
            enableFeedback={enableFeedback} 
          />
        )}
        
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
                      {project.cost_estimate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Cost:</span>
                          <span>{formatCurrency(project.cost_estimate)}</span>
                        </div>
                      )}
                      {project.score_total && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Score:</span>
                          <span>{project.score_total.toFixed(1)}/5</span>
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
          
          // Handle other geometry types here if needed
          return null;
        })}
        
        {/* Update map bounds based on projects */}
        {bounds && <MapBoundsUpdater bounds={bounds} />}
      </MapContainer>
      
      {/* Feedback form */}
      {enableFeedback && agencyId && clickedLocation && (
        <MapFeedbackForm
          isOpen={feedbackFormOpen}
          onClose={handleCloseFeedbackForm}
          coordinates={clickedLocation}
          agencyId={agencyId}
          projects={projects.map(p => ({ id: p.id, title: p.title }))}
        />
      )}
    </>
  );
}
