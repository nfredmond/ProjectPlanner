'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Define types for our data
interface Integration {
  id: string;
  name: string;
  provider: string;
  api_key: string;
  api_url?: string;
  is_active: boolean;
  rate_limit?: number;
  agency_id: string;
  created_at: string;
  updated_at: string;
  config?: Record<string, any>;
  last_used_at?: string | null;
  usage_count?: number;
}

interface IntegrationLog {
  id: string;
  integration_id: string;
  agency_id: string;
  endpoint: string;
  status: 'success' | 'error';
  response_time_ms: number;
  created_at: string;
  error_message?: string;
  request_params?: Record<string, any>;
}

export default function IntegrationsPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return redirect('/login');
      }
      setUser(user);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (!profile) {
        return redirect('/login');
      }
      
      // Check if user has admin role
      if (!profile.roles || !profile.roles.includes('admin')) {
        return redirect('/dashboard');
      }
      
      setProfile(profile);
      
      // Get integrations
      const { data: integrationsData } = await supabase
        .from('integrations')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .order('created_at', { ascending: false });
        
      setIntegrations(integrationsData || []);
      
      // Get integration logs
      const { data: logsData } = await supabase
        .from('integration_logs')
        .select('*')
        .eq('agency_id', profile.agency_id)
        .order('created_at', { ascending: false })
        .limit(100);
        
      setIntegrationLogs(logsData || []);
      setIsLoading(false);
    }
    
    loadData();
  }, [supabase]);
  
  if (!user || !profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Dynamically import the IntegrationsManager component
  const IntegrationsManager = dynamic(() => 
    import('@/components/admin/integrations/integrations-manager'), 
    { loading: () => <Loader2 className="h-8 w-8 animate-spin text-primary" /> }
  );

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Integration Management</h1>
        <p className="text-gray-600">
          Manage external API integrations for your transportation planning platform.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading integrations...</p>
          </div>
        </div>
      ) : (
        <IntegrationsManager 
          initialIntegrations={integrations} 
          integrationLogs={integrationLogs}
          agencyId={profile.agency_id || ''}
        />
      )}
    </div>
  );
} 