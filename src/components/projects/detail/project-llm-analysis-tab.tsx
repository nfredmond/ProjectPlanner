'use client';

import React from 'react';

interface ProjectLlmAnalysisTabProps {
  project: any;
  scores?: any[];
  profile?: any;
}

export default function ProjectLlmAnalysisTab({ 
  project,
  scores = [],
  profile
}: ProjectLlmAnalysisTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">AI Analysis</h2>
        <p className="text-sm text-gray-500 mb-4">
          This tab shows AI-generated insights about this project.
        </p>
        
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Project Analysis</h3>
          <p className="text-sm text-gray-600">
            AI analysis is not available for this project yet.
          </p>
        </div>
      </div>
    </div>
  );
} 