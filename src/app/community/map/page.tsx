'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CommunityMapPreview from '@/components/community/map-preview';
import { createClientComponentClient } from '@/lib/supabase/client';

export default function CommunityMapPage() {
  const router = useRouter();
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Try to get the default agency
    const fetchDefaultAgency = async () => {
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('agencies')
          .select('id')
          .limit(1)
          .single();
        
        if (error) {
          console.error('Error fetching default agency:', error);
          return;
        }
        
        if (data) {
          setAgencyId(data.id);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDefaultAgency();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rtpa-blue-500"></div>
      </div>
    );
  }
  
  if (!agencyId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-600">
        <h2 className="text-2xl font-semibold mb-4">Agency Not Found</h2>
        <p className="mb-6">Unable to load the community map. Please try again later.</p>
        <button 
          onClick={() => router.push('/community')}
          className="px-4 py-2 bg-rtpa-blue-600 text-white rounded hover:bg-rtpa-blue-700"
        >
          Return to Community Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 py-6 px-4 md:px-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Community Project Map</h1>
          <p className="mt-2 text-gray-600">
            Explore active and planned projects across the community
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <button 
            onClick={() => router.push('/community/feedback')}
            className="px-4 py-2 bg-rtpa-blue-600 text-white rounded hover:bg-rtpa-blue-700"
          >
            Provide Feedback
          </button>
        </div>
      </div>
      
      <div className="h-[70vh] w-full bg-gray-100 rounded-lg shadow-md overflow-hidden">
        <CommunityMapPreview agencyId={agencyId} />
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Map</h2>
        <p className="text-gray-600">
          This interactive map shows active and planned transportation projects across the community. 
          Click on any project marker to view more details and provide your feedback.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-blue-400 mr-2"></div>
            <span className="text-sm text-gray-600">Planned Projects</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-green-400 mr-2"></div>
            <span className="text-sm text-gray-600">Active Projects</span>
          </div>
        </div>
      </div>
    </div>
  );
} 