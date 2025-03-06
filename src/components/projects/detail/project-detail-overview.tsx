'use client';

import React from 'react';

interface ProjectDetailOverviewProps {
  project: any;
}

export default function ProjectDetailOverview({ project }: ProjectDetailOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Project Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-sm text-gray-900">
              {project?.description || 'No description provided.'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Objectives</h3>
            <p className="mt-1 text-sm text-gray-900">
              {project?.objectives || 'No objectives specified.'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Project Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <p className="mt-1 text-sm text-gray-900 capitalize">
              {project?.status || 'Not specified'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Category</h3>
            <p className="mt-1 text-sm text-gray-900 capitalize">
              {project?.primary_category || 'Not categorized'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Cost Estimate</h3>
            <p className="mt-1 text-sm text-gray-900">
              {project?.cost_estimate 
                ? `$${project.cost_estimate.toLocaleString()}`
                : 'Not estimated'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 