'use client';

import React from 'react';

interface ProjectFeedbackTabProps {
  project: any;
  feedback?: any[];
  profile?: any;
}

export default function ProjectFeedbackTab({ 
  project,
  feedback = [],
  profile
}: ProjectFeedbackTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Community Feedback</h2>
        <p className="text-sm text-gray-500 mb-4">
          This tab shows community feedback related to this project.
        </p>
        
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            {feedback.length > 0 
              ? `${feedback.length} feedback items available.` 
              : 'No feedback has been submitted for this project yet.'}
          </p>
        </div>
      </div>
    </div>
  );
} 