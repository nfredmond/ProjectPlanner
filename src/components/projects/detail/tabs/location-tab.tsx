'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client';
import { MapPinIcon, PencilIcon, CheckIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

// Import the map component dynamically to avoid SSR issues with Leaflet
const ProjectLocationMap = dynamic(
  () => import('@/components/projects/project-location-map'),
  { ssr: false }
);

interface ProjectLocationTabProps {
  project: any;
  profile: any;
}

export default function ProjectLocationTab({ project, profile }: ProjectLocationTabProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isEditing, setIsEditing] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number] | undefined>(
    project.geom?.coordinates ? 
      [project.geom.coordinates[1], project.geom.coordinates[0]] : // Convert [lng, lat] to [lat, lng]
      undefined
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Check if user has edit rights
  const canEdit = profile.role === 'admin' || profile.role === 'editor';
  
  const handleLocationSelect = (newCoordinates: [number, number]) => {
    setCoordinates(newCoordinates);
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Create GeoJSON Point from coordinates
      let geom = null;
      if (coordinates) {
        geom = {
          type: 'Point',
          coordinates: [coordinates[1], coordinates[0]] // Convert [lat, lng] to [lng, lat] for GeoJSON
        };
      }
      
      const { error } = await supabase
        .from('projects')
        .update({
          geom,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);
      
      if (error) throw error;
      
      setSuccess('Location updated successfully');
      setIsEditing(false);
      
      // Refresh the page to get updated data
      router.refresh();
    } catch (error: any) {
      console.error('Error updating location:', error);
      setError(error.message || 'An error occurred while updating location');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setCoordinates(
      project.geom?.coordinates ? 
        [project.geom.coordinates[1], project.geom.coordinates[0]] : 
        undefined
    );
    setIsEditing(false);
    setError(null);
  };
  
  const handleClear = () => {
    setCoordinates(undefined);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MapPinIcon className="h-5 w-5 mr-2 text-gray-500" />
            Project Location
          </h3>
          <p className="text-sm text-gray-500">
            View and manage the geographic location of this project
          </p>
        </div>
        
        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
          >
            <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" />
            Edit Location
          </button>
        )}
        
        {canEdit && isEditing && (
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
            >
              <XMarkIcon className="-ml-0.5 mr-2 h-4 w-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
            >
              {loading ? (
                <ArrowPathIcon className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
              ) : (
                <CheckIcon className="-ml-0.5 mr-2 h-4 w-4" />
              )}
              {loading ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        )}
      </div>
      
      {/* Success message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-700">
          <div className="flex">
            <CheckIcon className="h-5 w-5 text-green-400 mr-3" />
            <span>{success}</span>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <div className="flex">
            <XMarkIcon className="h-5 w-5 text-red-400 mr-3" />
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {/* Instructions (only show when editing) */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-700">
          <p>Click on the map to set the project location.</p>
        </div>
      )}
      
      {/* Map */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="h-96">
          <ProjectLocationMap
            onLocationSelect={handleLocationSelect}
            initialCoordinates={coordinates}
            readOnly={!isEditing}
          />
        </div>
      </div>
      
      {/* Location coordinates */}
      {coordinates && (
        <div className="bg-gray-50 p-4 rounded-md flex justify-between items-center">
          <div>
            <h4 className="text-sm font-medium text-gray-700">Current Location</h4>
            <p className="text-sm text-gray-500">
              Latitude: {coordinates[0].toFixed(6)}, Longitude: {coordinates[1].toFixed(6)}
            </p>
          </div>
          
          {isEditing && (
            <button
              onClick={handleClear}
              className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <XMarkIcon className="h-4 w-4" />
              <span className="sr-only">Clear</span>
            </button>
          )}
        </div>
      )}
      
      {/* No location message */}
      {!coordinates && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
          <p>No location has been set for this project yet.</p>
        </div>
      )}
    </div>
  );
}
