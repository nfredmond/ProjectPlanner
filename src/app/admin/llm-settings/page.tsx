'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ModelList } from '@/components/admin/llm/ModelList';
import { AgencyPreferences } from '@/components/admin/llm/AgencyPreferences';
import { UsageStats } from '@/components/admin/llm/UsageStats';

export default function LlmSettingsPage() {
  const [activeTab, setActiveTab] = useState('models');
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const { toast } = useToast();
  
  // Fetch data on load
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const supabase = createClientComponentClient();
        
        // Fetch models
        const { data: modelsData, error: modelsError } = await supabase
          .from('llm_configs')
          .select('*')
          .order('provider', { ascending: true })
          .order('name', { ascending: true });
        
        if (modelsError) throw modelsError;
        setModels(modelsData || []);
        
        // Fetch agency preferences
        const { data: prefsData, error: prefsError } = await supabase
          .from('agency_llm_preferences')
          .select('*, agencies(name)')
          .order('purpose', { ascending: true });
        
        if (prefsError) throw prefsError;
        setPreferences(prefsData || []);
        
        // Fetch usage statistics
        const { data: usageData, error: usageError } = await supabase
          .rpc('get_llm_usage_stats');
        
        if (!usageError) {
          setUsageStats(usageData);
        }
      } catch (error) {
        console.error('Error fetching LLM data:', error);
        toast({
          title: 'Error loading data',
          description: 'There was a problem loading the LLM settings data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [toast]);
  
  // Handle model update
  const handleModelUpdate = async (model: any) => {
    try {
      const supabase = createClientComponentClient();
      
      const { data, error } = await supabase
        .from('llm_configs')
        .update({
          is_active: model.is_active,
          default_for_tasks: model.default_for_tasks,
          cost_per_1k_tokens: model.cost_per_1k_tokens,
        })
        .eq('id', model.id)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setModels(models.map(m => m.id === model.id ? data[0] : m));
      
      toast({
        title: 'Model updated',
        description: `${model.name} has been updated successfully.`,
      });
    } catch (error) {
      console.error('Error updating model:', error);
      toast({
        title: 'Error updating model',
        description: 'There was a problem updating the model settings.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle preference update
  const handlePreferenceUpdate = async (preference: any) => {
    try {
      const supabase = createClientComponentClient();
      
      const { data, error } = await supabase
        .from('agency_llm_preferences')
        .update({
          preferred_provider: preference.preferred_provider,
          preferred_model: preference.preferred_model,
          temperature: preference.temperature,
          max_tokens: preference.max_tokens,
        })
        .eq('id', preference.id)
        .select();
      
      if (error) throw error;
      
      // Update local state
      setPreferences(preferences.map(p => p.id === preference.id ? data[0] : p));
      
      toast({
        title: 'Preference updated',
        description: `Preferences for ${preference.purpose} have been updated.`,
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      toast({
        title: 'Error updating preference',
        description: 'There was a problem updating the preference settings.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">LLM Settings</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="preferences">Agency Preferences</TabsTrigger>
          <TabsTrigger value="usage">Usage Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>LLM Models</CardTitle>
              <CardDescription>
                Configure available LLM models and their settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModelList 
                models={models} 
                loading={loading} 
                onUpdate={handleModelUpdate} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Agency Preferences</CardTitle>
              <CardDescription>
                Configure default LLM preferences for each purpose
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AgencyPreferences 
                preferences={preferences} 
                models={models}
                loading={loading} 
                onUpdate={handlePreferenceUpdate} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                View LLM usage statistics and costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageStats 
                stats={usageStats} 
                loading={loading} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 