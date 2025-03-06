'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { createClientComponentClient } from '@/lib/supabase/client';
import { Criterion, ProjectStatus, UserProfile } from '@/types';
import { 
  XMarkIcon, 
  ArrowPathIcon,
  MapPinIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';

// Import the map component dynamically to avoid SSR issues with Leaflet
const ProjectLocationMap = dynamic(
  () => import('@/components/projects/project-location-map'),
  { ssr: false }
);

// Common project categories
const DEFAULT_CATEGORIES = [
  'Road', 
  'Transit', 
  'Bicycle', 
  'Pedestrian', 
  'Bridge', 
  'Safety', 
  'Maintenance',
  'Highway',
  'Multimodal'
];

interface ProjectFormProps {
  profile: UserProfile & { agencies: { name: string } };
  criteria: Criterion[];
  categoryOptions?: string[];
  initialData?: any; // For editing existing projects
}

interface FormValues {
  title: string;
  description: string;
  status: ProjectStatus;
  primary_category?: string;
  custom_category?: string;
  cost_estimate?: number;
  location_coordinates?: [number, number]; // [lat, lng]
  location_type?: 'point' | 'line' | 'polygon';
}

export default function ProjectForm({ 
  profile, 
  criteria, 
  categoryOptions = [],
  initialData
}: ProjectFormProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  
  // Combine default categories with existing categories from the database
  const allCategories = Array.from(
    new Set([...DEFAULT_CATEGORIES, ...categoryOptions])
  ).sort();
  
  const defaultValues: FormValues = initialData || {
    title: '',
    description: '',
    status: 'draft',
    primary_category: '',
    custom_category: '',
    cost_estimate: undefined,
    location_coordinates: undefined,
    location_type: 'point',
  };
  
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    defaultValues,
  });
  
  const coordinates = watch('location_coordinates');
  
  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine the category to use (custom or selected)
      const categoryToUse = data.primary_category === 'other' && data.custom_category
        ? data.custom_category
        : data.primary_category;
      
      // Prepare GeoJSON for the location if coordinates are provided
      let geom = null;
      if (data.location_coordinates) {
        const [lat, lng] = data.location_coordinates;
        // Simple point for now, could be expanded for lines and polygons
        geom = {
          type: 'Point',
          coordinates: [lng, lat] // GeoJSON uses [longitude, latitude]
        };
      }
      
      // Create the project in the database
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title: data.title,
          description: data.description,
          status: data.status,
          primary_category: categoryToUse,
          cost_estimate: data.cost_estimate,
          geom: geom,
          agency_id: profile.agency_id,
          created_by: profile.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setSuccess('Project created successfully!');
      
      // Redirect to the project details page after a short delay
      setTimeout(() => {
        router.push(`/projects/${project.id}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error creating project:', error);
      setError(error.message || 'An error occurred while creating the project.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLocationSelect = (coordinates: [number, number]) => {
    setValue('location_coordinates', coordinates, { shouldDirty: true });
  };
  
  const handleClearLocation = () => {
    setValue('location_coordinates', undefined, { shouldDirty: true });
  };
  
  const handleCancel = () => {
    router.push('/projects');
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Success message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-700 flex items-center">
          <CheckIcon className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center">
          <XMarkIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Main project information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
              Project Details
            </h2>
            
            <div className="space-y-6">
              {/* Project title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    errors.title
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500'
                  } sm:text-sm`}
                  placeholder="Enter project title"
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
              
              {/* Project description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Project Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={6}
                  {...register('description', { required: 'Description is required' })}
                  className={`mt-1 block w-full rounded-md shadow-sm ${
                    errors.description
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500'
                  } sm:text-sm`}
                  placeholder="Describe the project, its purpose, and benefits"
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>
              
              {/* Project status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Project Status
                </label>
                <select
                  id="status"
                  {...register('status')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500 sm:text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="planned">Planned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              {/* Project category */}
              <div>
                <label htmlFor="primary_category" className="block text-sm font-medium text-gray-700">
                  Project Category
                </label>
                <select
                  id="primary_category"
                  {...register('primary_category')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500 sm:text-sm"
                  onChange={(e) => {
                    if (e.target.value === 'other') {
                      setShowCustomCategory(true);
                    } else {
                      setShowCustomCategory(false);
                    }
                  }}
                >
                  <option value="">Select a category</option>
                  {allCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                  <option value="other">Other (specify)</option>
                </select>
                
                {showCustomCategory && (
                  <div className="mt-3">
                    <label htmlFor="custom_category" className="block text-sm font-medium text-gray-700">
                      Specify Category
                    </label>
                    <input
                      id="custom_category"
                      type="text"
                      {...register('custom_category')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500 sm:text-sm"
                      placeholder="Enter custom category"
                    />
                  </div>
                )}
              </div>
              
              {/* Project cost */}
              <div>
                <label htmlFor="cost_estimate" className="block text-sm font-medium text-gray-700">
                  Estimated Cost
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="cost_estimate"
                    {...register('cost_estimate', {
                      valueAsNumber: true,
                      min: { value: 0, message: 'Cost must be a positive number' },
                    })}
                    className={`block w-full pl-7 pr-12 rounded-md ${
                      errors.cost_estimate
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500'
                    } sm:text-sm`}
                    placeholder="0.00"
                    aria-describedby="price-currency"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm" id="price-currency">
                      USD
                    </span>
                  </div>
                </div>
                {errors.cost_estimate && (
                  <p className="mt-2 text-sm text-red-600">{errors.cost_estimate.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - Location */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-gray-500" />
              Project Location
            </h2>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Click on the map to set the project location, or search for an address.
              </p>
              
              {/* Map for selecting location */}
              <div className="h-64 rounded-md border border-gray-300 overflow-hidden">
                <ProjectLocationMap
                  onLocationSelect={handleLocationSelect}
                  initialCoordinates={coordinates}
                />
              </div>
              
              {/* Display selected coordinates */}
              {coordinates && (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md text-sm">
                  <div>
                    <span className="font-medium">Selected location: </span>
                    <span className="text-gray-700">
                      {coordinates[0].toFixed(6)}, {coordinates[1].toFixed(6)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
              
              {/* Future: Location type selector (point, line, polygon) */}
              {/* Future: Address search */}
            </div>
          </div>
          
          {/* Project Information - Agency */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">
              Project Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Agency</div>
                <div className="mt-1 text-sm text-gray-900">{profile.agencies.name}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Created By</div>
                <div className="mt-1 text-sm text-gray-900">
                  {profile.first_name} {profile.last_name}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !isDirty}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Saving...
            </>
          ) : (
            'Create Project'
          )}
        </button>
      </div>
    </form>
  );
}
