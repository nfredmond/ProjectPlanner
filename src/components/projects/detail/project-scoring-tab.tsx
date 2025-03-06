'use client';

import React from 'react';

interface ProjectScoringTabProps {
  project: any;
  criteria?: any[];
  projectScores?: any[];
  profile?: any;
}

export default function ProjectScoringTab({ 
  project,
  criteria = [],
  projectScores = [],
  profile
}: ProjectScoringTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Project Scoring</h2>
        <p className="text-sm text-gray-500 mb-4">
          This tab shows the prioritization scoring for this project.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Total Score</h3>
            <p className="mt-1 text-2xl font-bold text-rtpa-blue-600">
              {project?.score_total || 'Not scored'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 