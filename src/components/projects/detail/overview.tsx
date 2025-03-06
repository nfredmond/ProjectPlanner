'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client';
import { ArrowPathIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ProjectDetailOverviewProps {
  project: any;
}

export default function ProjectDetailOverview({ project }: ProjectDetailOverviewProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(project.description || '');
  const [loading, setLoading] = useState(false);
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('projects')
        .update({
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);
      
      if (error) throw error;
      
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating project description:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setDescription(project.description || '');
    setIsEditing(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Project Description</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
          >
            <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" />
            Edit
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <textarea
            rows={10}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow-sm block w-full focus:ring-rtpa-blue-500 focus:border-rtpa-blue-500 sm:text-sm border border-gray-300 rounded-md"
            placeholder="Enter project description..."
          />
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="prose max-w-none">
          {project.description ? (
            <div className="whitespace-pre-wrap">{project.description}</div>
          ) : (
            <p className="text-gray-500 italic">No description provided.</p>
          )}
        </div>
      )}
      
      {/* Could add additional sections here like:
          - Project objectives
          - Project benefits
          - Timeline information
          - Related documents
          - etc. */}
    </div>
  );
}
