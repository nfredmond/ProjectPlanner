'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client';
import { UserProfile, ProjectStatus } from '@/types';
import {
  PencilIcon,
  TrashIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface ProjectDetailHeaderProps {
  project: any; // The project data
  profile: UserProfile & { agencies: any }; // The user profile with agency info
}

export default function ProjectDetailHeader({ project, profile }: ProjectDetailHeaderProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // Check if user has edit rights
  const canEdit = profile.role === 'admin' || profile.role === 'editor';
  
  const handleSave = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('projects')
        .update({
          title,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);
      
      if (error) throw error;
      
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelEdit = () => {
    setTitle(project.title);
    setStatus(project.status);
    setIsEditing(false);
  };
  
  const handleDelete = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);
      
      if (error) throw error;
      
      router.push('/projects');
      router.refresh();
    } catch (error) {
      console.error('Error deleting project:', error);
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
    }
  };
  
  const handleDuplicate = async () => {
    try {
      setLoading(true);
      
      // Clone the project without the id, created_at, and updated_at fields
      const { id, created_at, updated_at, ...projectData } = project;
      
      // Create a new project with the cloned data
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          title: `Copy of ${project.title}`,
          created_by: profile.id,
          status: 'draft', // Set the status to draft for the new copy
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Redirect to the new project
      router.push(`/projects/${data.id}`);
    } catch (error) {
      console.error('Error duplicating project:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Get status badge style
  const getStatusBadgeStyle = (status: ProjectStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-indigo-100 text-indigo-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          {isEditing ? (
            <div className="flex flex-col space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500 sm:text-sm"
                placeholder="Project title"
              />
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500 sm:text-sm"
              >
                <option value="draft">Draft</option>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
              <div className="mt-2 flex items-center">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(
                    project.status
                  )}`}
                >
                  {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                </span>
                {project.primary_category && (
                  <span className="ml-2 text-sm text-gray-500">
                    Category: {project.primary_category}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
              >
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
                Save
              </button>
            </>
          ) : (
            canEdit && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
                >
                  <PencilIcon className="-ml-0.5 mr-2 h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleDuplicate}
                  disabled={loading}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
                >
                  <DocumentDuplicateIcon className="-ml-0.5 mr-2 h-4 w-4" />
                  Duplicate
                </button>
                <button
                  onClick={() => setDeleteModalOpen(true)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="-ml-0.5 mr-2 h-4 w-4" />
                  Delete
                </button>
              </>
            )
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Project</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this project? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setDeleteModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
