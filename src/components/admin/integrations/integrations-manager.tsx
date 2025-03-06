'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit, Trash2, RefreshCw, Key, Eye, EyeOff, TimerReset, Server, Link, LineChart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

interface IntegrationsManagerProps {
  initialIntegrations: Integration[];
  integrationLogs: IntegrationLog[];
  agencyId: string;
}

const INTEGRATION_TYPES = [
  { id: 'census', name: 'Census API', description: 'US Census Bureau data for demographic analysis' },
  { id: 'caltrans', name: 'Caltrans', description: 'California Department of Transportation project data' },
  { id: 'fhwa', name: 'FHWA', description: 'Federal Highway Administration data' },
  { id: 'dot', name: 'US DOT', description: 'US Department of Transportation data' },
  { id: 'ctc', name: 'CTC', description: 'California Transportation Commission data' },
  { id: 'google_maps', name: 'Google Maps', description: 'Mapping and geocoding services' },
  { id: 'mapbox', name: 'Mapbox', description: 'Mapping, geocoding, and routing services' },
  { id: 'weather', name: 'Weather API', description: 'Weather and climate data' },
  { id: 'custom', name: 'Custom API', description: 'Connect to your own APIs' }
];

export default function IntegrationsManager({
  initialIntegrations,
  integrationLogs,
  agencyId
}: IntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [logs, setLogs] = useState<IntegrationLog[]>(integrationLogs);
  const [activeTab, setActiveTab] = useState('configured');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [currentIntegration, setCurrentIntegration] = useState<Integration | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    api_key: '',
    api_url: '',
    is_active: true,
    rate_limit: 60,
    config: {}
  });
  
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  
  const handleOpenDialog = (integration: Integration | null = null) => {
    if (integration) {
      setCurrentIntegration(integration);
      setFormData({
        name: integration.name,
        provider: integration.provider,
        api_key: integration.api_key,
        api_url: integration.api_url || '',
        is_active: integration.is_active,
        rate_limit: integration.rate_limit || 60,
        config: integration.config || {}
      });
    } else {
      setCurrentIntegration(null);
      setFormData({
        name: '',
        provider: '',
        api_key: '',
        api_url: '',
        is_active: true,
        rate_limit: 60,
        config: {}
      });
    }
    setIsDialogOpen(true);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSelectChange = (name: string, value: string) => {
    if (name === 'provider') {
      // Set default name based on provider if name is empty
      const providerInfo = INTEGRATION_TYPES.find(type => type.id === value);
      if (providerInfo && !formData.name) {
        setFormData({ 
          ...formData, 
          provider: value,
          name: providerInfo.name
        });
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };
  
  const handleSwitchChange = (checked: boolean) => {
    setFormData({ ...formData, is_active: checked });
  };
  
  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const integrationData = {
        ...formData,
        agency_id: agencyId,
        updated_at: new Date().toISOString()
      };
      
      if (currentIntegration) {
        // Update existing integration
        const { data, error } = await supabase
          .from('integrations')
          .update(integrationData)
          .eq('id', currentIntegration.id)
          .select()
          .single();
          
        if (error) throw error;
        
        setIntegrations(integrations.map(i => 
          i.id === currentIntegration.id ? data : i
        ));
        
        toast({
          title: 'Integration updated',
          description: `${data.name} integration has been updated successfully.`
        });
      } else {
        // Create new integration
        const { data, error } = await supabase
          .from('integrations')
          .insert({
            ...integrationData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) throw error;
        
        setIntegrations([...integrations, data]);
        
        toast({
          title: 'Integration created',
          description: `${data.name} integration has been created successfully.`
        });
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving integration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save integration. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration? This cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setIntegrations(integrations.filter(i => i.id !== id));
      
      toast({
        title: 'Integration deleted',
        description: 'The integration has been deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting integration:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete integration. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTestIntegration = async (integration: Integration) => {
    setIsTesting(true);
    
    try {
      // Build the test endpoint based on the provider
      let testEndpoint = '';
      switch (integration.provider) {
        case 'census':
          testEndpoint = '/api/integrations/census?state=06&county=075';
          break;
        case 'caltrans':
          testEndpoint = '/api/integrations/caltrans?limit=1';
          break;
        case 'fhwa':
          testEndpoint = '/api/integrations/fhwa/test';
          break;
        case 'dot':
          testEndpoint = '/api/integrations/dot/test';
          break;
        case 'ctc':
          testEndpoint = '/api/integrations/ctc/test';
          break;
        case 'google_maps':
          testEndpoint = '/api/integrations/maps/test?provider=google';
          break;
        case 'mapbox':
          testEndpoint = '/api/integrations/maps/test?provider=mapbox';
          break;
        default:
          testEndpoint = `/api/integrations/test?provider=${integration.provider}`;
      }
      
      // Add a test parameter to indicate this is a test request
      const separator = testEndpoint.includes('?') ? '&' : '?';
      testEndpoint += `${separator}test=true&integration_id=${integration.id}`;
      
      const startTime = Date.now();
      const response = await fetch(testEndpoint);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const result = await response.json();
      
      // Log the test result
      const logEntry = {
        integration_id: integration.id,
        agency_id: agencyId,
        endpoint: testEndpoint,
        status: response.ok ? 'success' : 'error',
        response_time_ms: responseTime,
        created_at: new Date().toISOString(),
        error_message: !response.ok ? result.error || 'Unknown error' : undefined,
        request_params: { test: true }
      };
      
      // Save the log to the database
      const { data: logData, error: logError } = await supabase
        .from('integration_logs')
        .insert(logEntry)
        .select()
        .single();
        
      if (!logError && logData) {
        setLogs([logData, ...logs]);
      }
      
      // Show success or error toast
      if (response.ok) {
        toast({
          title: 'Test successful',
          description: `Connection to ${integration.name} is working properly.`
        });
      } else {
        toast({
          title: 'Test failed',
          description: result.error || 'Failed to connect to the integration.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error testing integration:', error);
      toast({
        title: 'Test failed',
        description: 'An error occurred while testing the integration.',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  const toggleApiKeyVisibility = (id: string) => {
    setShowApiKey({
      ...showApiKey,
      [id]: !showApiKey[id]
    });
  };
  
  const resetUsageStats = async (id: string) => {
    try {
      const { error } = await supabase
        .from('integrations')
        .update({
          usage_count: 0,
          last_used_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      setIntegrations(integrations.map(i => 
        i.id === id ? { ...i, usage_count: 0, last_used_at: null } : i
      ));
      
      toast({
        title: 'Usage stats reset',
        description: 'The usage statistics have been reset successfully.'
      });
    } catch (error) {
      console.error('Error resetting usage stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset usage statistics.',
        variant: 'destructive'
      });
    }
  };
  
  // Group integrations by provider
  const integrationsByProvider = integrations.reduce((acc, integration) => {
    const provider = integration.provider;
    if (!acc[provider]) {
      acc[provider] = [];
    }
    acc[provider].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);
  
  // For available integrations tab, filter out already configured providers
  const configuredProviders = new Set(integrations.map(i => i.provider));
  const availableIntegrations = INTEGRATION_TYPES.filter(
    type => !configuredProviders.has(type.id) || type.id === 'custom'
  );
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="configured" className="flex items-center gap-1">
            <Link className="h-4 w-4" />
            <span>Configured Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="available" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            <span>Available Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1">
            <Server className="h-4 w-4" />
            <span>Integration Logs</span>
            {logs.length > 0 && (
              <Badge variant="outline" className="ml-2">{logs.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-1">
            <LineChart className="h-4 w-4" />
            <span>Usage Statistics</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="configured">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Configured Integrations</h2>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </div>
          
          {integrations.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <p className="text-lg text-gray-500 mb-4">No integrations configured</p>
                  <Button onClick={() => handleOpenDialog()}>Configure Your First Integration</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(integrationsByProvider).map(([provider, providerIntegrations]) => (
              <div key={provider} className="mb-6">
                <h3 className="text-lg font-medium mb-3 capitalize">
                  {INTEGRATION_TYPES.find(t => t.id === provider)?.name || provider} Integrations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providerIntegrations.map(integration => (
                    <Card key={integration.id} className={!integration.is_active ? 'opacity-70' : undefined}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <CardTitle>{integration.name}</CardTitle>
                          <Badge variant={integration.is_active ? 'default' : 'outline'}>
                            {integration.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <CardDescription>
                          Last used: {integration.last_used_at 
                            ? new Date(integration.last_used_at).toLocaleString() 
                            : 'Never'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">API Key:</span>
                          <div className="flex items-center">
                            <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded max-w-[180px] truncate">
                              {showApiKey[integration.id] 
                                ? integration.api_key 
                                : '••••••••••••••••'}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-1"
                              onClick={() => toggleApiKeyVisibility(integration.id)}
                            >
                              {showApiKey[integration.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                        
                        {integration.rate_limit && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Rate Limit:</span>
                            <span className="text-sm">{integration.rate_limit} requests/minute</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">Usage Count:</span>
                          <div className="flex items-center">
                            <span className="text-sm">{integration.usage_count || 0} requests</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="ml-1"
                              onClick={() => resetUsageStats(integration.id)}
                            >
                              <TimerReset className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex justify-between">
                        <div className="flex space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenDialog(integration)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600" 
                            onClick={() => handleDelete(integration.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTestIntegration(integration)}
                          disabled={isTesting}
                        >
                          {isTesting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                          Test
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="available">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Available Integrations</h2>
            <p className="text-gray-600">
              Connect with external data sources and APIs to enhance your transportation planning platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableIntegrations.map(integration => (
              <Card key={integration.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{integration.name}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <Button 
                    onClick={() => {
                      setFormData({
                        ...formData,
                        provider: integration.id,
                        name: integration.name
                      });
                      handleOpenDialog(null);
                    }}
                  >
                    Configure
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="logs">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Integration Logs</h2>
            <p className="text-gray-600">
              View recent integration activities and troubleshoot issues.
            </p>
          </div>
          
          {logs.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <p className="text-lg text-gray-500">No integration logs available</p>
                  <p className="text-gray-500">Logs will appear here when integrations are used</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recent Integration Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Time</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Integration</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Endpoint</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Response Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(log => {
                        const integration = integrations.find(i => i.id === log.integration_id);
                        return (
                          <tr key={log.id} className="border-b">
                            <td className="py-2 px-3">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="py-2 px-3">
                              {integration?.name || log.integration_id}
                            </td>
                            <td className="py-2 px-3">
                              <code className="text-xs">{log.endpoint}</code>
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                                {log.status}
                              </Badge>
                            </td>
                            <td className="py-2 px-3">
                              {log.response_time_ms}ms
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="usage">
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Usage Statistics</h2>
            <p className="text-gray-600">
              Monitor API usage, rate limits, and costs.
            </p>
          </div>
          
          {integrations.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <p className="text-lg text-gray-500 mb-4">No integrations configured</p>
                  <Button onClick={() => handleOpenDialog()}>Configure Your First Integration</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Integration Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Integration</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Usage Count</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Last Used</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Rate Limit</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Status</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {integrations.map(integration => (
                        <tr key={integration.id} className="border-b">
                          <td className="py-2 px-3 font-medium">{integration.name}</td>
                          <td className="py-2 px-3">{integration.usage_count || 0} requests</td>
                          <td className="py-2 px-3">
                            {integration.last_used_at 
                              ? new Date(integration.last_used_at).toLocaleString() 
                              : 'Never'}
                          </td>
                          <td className="py-2 px-3">
                            {integration.rate_limit || 'Unlimited'} req/min
                          </td>
                          <td className="py-2 px-3">
                            <Badge variant={integration.is_active ? 'default' : 'outline'}>
                              {integration.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-2 px-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => resetUsageStats(integration.id)}
                            >
                              <TimerReset className="h-4 w-4 mr-1" />
                              Reset
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentIntegration ? 'Edit Integration' : 'Add Integration'}</DialogTitle>
            <DialogDescription>
              Configure an external API integration for your agency.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right">
                Provider
              </Label>
              <div className="col-span-3">
                <Select
                  value={formData.provider}
                  onValueChange={(value) => handleSelectChange('provider', value)}
                  disabled={!!currentIntegration}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTEGRATION_TYPES.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Integration name"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api_key" className="text-right">
                API Key
              </Label>
              <div className="col-span-3 relative">
                <Input
                  id="api_key"
                  name="api_key"
                  type={showApiKey.new ? 'text' : 'password'}
                  value={formData.api_key}
                  onChange={handleInputChange}
                  placeholder="Enter API key"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => toggleApiKeyVisibility('new')}
                >
                  {showApiKey.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="api_url" className="text-right">
                API URL
              </Label>
              <Input
                id="api_url"
                name="api_url"
                value={formData.api_url}
                onChange={handleInputChange}
                placeholder="Optional custom API URL"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rate_limit" className="text-right">
                Rate Limit
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="rate_limit"
                  name="rate_limit"
                  type="number"
                  value={formData.rate_limit}
                  onChange={handleInputChange}
                  className="w-24"
                  min="1"
                />
                <span className="text-sm text-gray-500">requests per minute</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="is_active">
                  {formData.is_active ? 'Integration is active' : 'Integration is disabled'}
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentIntegration ? 'Update' : 'Add'} Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 