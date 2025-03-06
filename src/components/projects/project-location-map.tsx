'use client';

import React, { useState, useEffect } from 'react';

interface ProjectLocationMapProps {
  onLocationSelect?: (coordinates: [number, number]) => void;
  initialCoordinates?: [number, number];
  readOnly?: boolean;
}

export default function ProjectLocationMap({
  onLocationSelect,
  initialCoordinates = [40.7128, -74.0060], // Default to NYC
  readOnly = false
}: ProjectLocationMapProps) {
  const [coordinates, setCoordinates] = useState<[number, number]>(initialCoordinates);

  useEffect(() => {
    if (initialCoordinates) {
      setCoordinates(initialCoordinates);
    }
  }, [initialCoordinates]);

  const handleMapClick = (event: React.MouseEvent) => {
    if (readOnly) return;
    
    // In a real implementation, this would get coordinates from the map click
    // For now, we'll just slightly adjust the current coordinates
    const newCoordinates: [number, number] = [
      coordinates[0] + (Math.random() - 0.5) * 0.01,
      coordinates[1] + (Math.random() - 0.5) * 0.01
    ];
    
    setCoordinates(newCoordinates);
    
    if (onLocationSelect) {
      onLocationSelect(newCoordinates);
    }
  };

  return (
    <div 
      className="relative w-full h-[400px] bg-gray-100 rounded-lg overflow-hidden border border-gray-300"
      onClick={handleMapClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-gray-500 mb-2">Map Component Placeholder</p>
          <p className="text-sm text-gray-400">
            Current coordinates: {coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)}
          </p>
          {!readOnly && (
            <p className="text-xs text-gray-400 mt-2">
              Click anywhere to select a new location
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 