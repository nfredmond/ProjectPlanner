import React from 'react';
import { createServerComponentClient } from '@/lib/supabase/server';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from '@/components/admin/user-management';
import AgencySettings from '@/components/admin/agency-settings';
import CriteriaManagement from '@/components/admin/criteria-management';
import LlmConfiguration from '@/components/admin/llm-configuration';
import AuditLogs from '@/components/admin/audit-logs';

export const metadata = {
  title: 'Admin | RTPA Project Prioritization',
  description: 'Admin dashboard for managing agency settings',
};

export default async function AdminPage() {
  const supabase = await createServerComponentClient();
  
  // Get current user session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return <div>Loading...</div>;
  }
  
  // Fetch user's agency
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id, agencies:agency_id(id, name, region, logo_url, settings, created_at, updated_at)')
    .eq('id', session.user.id)
    .single();
  
  if (!profile) {
    return <div>Error loading profile</div>;
  }
  
  return (
    <div>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid grid-cols-5 w-full mb-8">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="agency">Agency Settings</TabsTrigger>
          <TabsTrigger value="criteria">Scoring Criteria</TabsTrigger>
          <TabsTrigger value="llm">LLM Configuration</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-0">
          <UserManagement agencyId={profile.agency_id} />
        </TabsContent>
        
        <TabsContent value="agency" className="mt-0">
          <AgencySettings agency={profile.agencies[0]} />
        </TabsContent>
        
        <TabsContent value="criteria" className="mt-0">
          <CriteriaManagement agencyId={profile.agency_id} />
        </TabsContent>
        
        <TabsContent value="llm" className="mt-0">
          <LlmConfiguration agencyId={profile.agency_id} />
        </TabsContent>
        
        <TabsContent value="audit" className="mt-0">
          <AuditLogs agencyId={profile.agency_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 