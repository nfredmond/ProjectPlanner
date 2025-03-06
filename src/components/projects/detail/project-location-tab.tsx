'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const ProjectLocationMap = dynamic(
  () => import('@/components/projects/project-location-map'),
  { ssr: false }
);

interface ProjectLocationTabProps {
  project: any;
  profile?: any;
}

export default function ProjectLocationTab({ 
  project,
  profile
}: ProjectLocationTabProps) {
  const coordinates = project?.location_lat && project?.location_lng 
    ? [parseFloat(project.location_lat), parseFloat(project.location_lng)] as [number, number]
    : undefined;
    
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Project Location</h2>
        <p className="text-sm text-gray-500 mb-4">
          This tab shows the geographic location of this project.
        </p>
        
        <div className="mt-4">
          <ProjectLocationMap 
            initialCoordinates={coordinates}
            readOnly={true}
          />
        </div>
      </div>
    </div>
  );
} 