'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { InfoCircledIcon } from '@radix-ui/react-icons';

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  is_secret: boolean;
  description: string;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Customer {
  id: string;
  name: string;
}

export default function EnvSettingsPage() {
  const [activeTab, setActiveTab] = useState('global');
  const [loading, setLoading] = useState(true);
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [newVar, setNewVar] = useState({ 
    key: '', 
    value: '', 
    is_secret: false, 
    description: '',
    customer_id: null as string | null
  });
  
  const { toast } = useToast();
  const supabase = createClientComponentClient();
  
  // Fetch data on load
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch customers
        const { data: customersData, error: customersError } = await supabase
          .from('agencies')
          .select('id, name')
          .order('name');
        
        if (customersError) throw customersError;
        setCustomers(customersData || []);
        
        // Fetch environment variables
        await loadEnvironmentVariables();
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error loading data',
          description: 'There was a problem loading the environment variables data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [toast]);
  
  // Load environment variables based on active tab
  const loadEnvironmentVariables = async () => {
    try {
      let query = supabase
        .from('environment_variables')
        .select('*')
        .order('key');
      
      if (activeTab === 'global') {
        query = query.is('customer_id', null);
      } else if (selectedCustomerId) {
        query = query.eq('customer_id', selectedCustomerId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setEnvVars(data || []);
    } catch (error) {
      console.error('Error loading environment variables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load environment variables.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle tab change
  useEffect(() => {
    loadEnvironmentVariables();
  }, [activeTab, selectedCustomerId]);
  
  // Add new environment variable
  const handleAddVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVar.key || !newVar.value) {
      toast({
        title: 'Validation Error',
        description: 'Key and value are required.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const insertData = {
        key: newVar.key,
        value: newVar.value,
        is_secret: newVar.is_secret,
        description: newVar.description,
        customer_id: activeTab === 'customer' ? selectedCustomerId : null
      };
      
      const { data, error } = await supabase
        .from('environment_variables')
        .insert(insertData)
        .select();
      
      if (error) throw error;
      
      setEnvVars([...envVars, data[0]]);
      setNewVar({ key: '', value: '', is_secret: false, description: '', customer_id: null });
      
      toast({
        title: 'Success',
        description: 'Environment variable added successfully.',
      });
    } catch (error) {
      console.error('Error adding variable:', error);
      toast({
        title: 'Error',
        description: 'Failed to add environment variable.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update environment variable
  const handleUpdateVariable = async (id: string, updates: Partial<EnvironmentVariable>) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('environment_variables')
        .update(updates)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      setEnvVars(envVars.map(v => v.id === id ? data[0] : v));
      
      toast({
        title: 'Success',
        description: 'Environment variable updated successfully.',
      });
    } catch (error) {
      console.error('Error updating variable:', error);
      toast({
        title: 'Error',
        description: 'Failed to update environment variable.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Delete environment variable
  const handleDeleteVariable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this environment variable? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('environment_variables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setEnvVars(envVars.filter(v => v.id !== id));
      
      toast({
        title: 'Success',
        description: 'Environment variable deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting variable:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete environment variable.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Environment Variables Settings</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="global">Global Variables</TabsTrigger>
          <TabsTrigger value="customer">Customer-Specific Variables</TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle>Global Environment Variables</CardTitle>
              <CardDescription>
                These variables apply to all customers unless overridden by customer-specific variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Add New Variable Form */}
                <form onSubmit={handleAddVariable} className="space-y-4 border p-4 rounded-md">
                  <h3 className="text-lg font-medium">Add New Variable</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-key">Key</Label>
                      <Input
                        id="new-key"
                        value={newVar.key}
                        onChange={(e) => setNewVar({...newVar, key: e.target.value})}
                        placeholder="e.g., NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="new-value">Value</Label>
                      <Input
                        id="new-value"
                        type={newVar.is_secret ? "password" : "text"}
                        value={newVar.value}
                        onChange={(e) => setNewVar({...newVar, value: e.target.value})}
                        placeholder="Variable value"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-description">Description</Label>
                    <Input
                      id="new-description"
                      value={newVar.description}
                      onChange={(e) => setNewVar({...newVar, description: e.target.value})}
                      placeholder="What is this variable used for?"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="new-is-secret"
                      checked={newVar.is_secret}
                      onCheckedChange={(checked) => setNewVar({...newVar, is_secret: checked})}
                    />
                    <Label htmlFor="new-is-secret">Sensitive value (display as password)</Label>
                  </div>
                  
                  <Button type="submit" disabled={loading}>
                    Add Variable
                  </Button>
                </form>
                
                {/* Variables List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Current Variables</h3>
                  
                  {loading ? (
                    <div className="text-center p-4">Loading...</div>
                  ) : envVars.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">No variables found</div>
                  ) : (
                    <div className="border rounded-md overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {envVars.map((variable) => (
                            <tr key={variable.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{variable.key}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Input
                                    type={variable.is_secret ? "password" : "text"}
                                    value={variable.value}
                                    onChange={(e) => handleUpdateVariable(variable.id, { value: e.target.value })}
                                    className="text-sm"
                                  />
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="sm"
                                          onClick={() => handleUpdateVariable(variable.id, { is_secret: !variable.is_secret })}
                                        >
                                          <InfoCircledIcon className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Toggle visibility</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Input
                                  value={variable.description || ''}
                                  onChange={(e) => handleUpdateVariable(variable.id, { description: e.target.value })}
                                  className="text-sm"
                                  placeholder="Add description..."
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onClick={() => handleDeleteVariable(variable.id)}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="customer">
          <Card>
            <CardHeader>
              <CardTitle>Customer-Specific Environment Variables</CardTitle>
              <CardDescription>
                These variables apply only to specific customers and override global settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Customer Selector */}
                <div className="space-y-2">
                  <Label htmlFor="customer-select">Select Customer</Label>
                  <Select 
                    value={selectedCustomerId || ''} 
                    onValueChange={(value) => setSelectedCustomerId(value || null)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedCustomerId ? (
                  <>
                    {/* Add New Variable Form */}
                    <form onSubmit={handleAddVariable} className="space-y-4 border p-4 rounded-md">
                      <h3 className="text-lg font-medium">Add New Variable for Selected Customer</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-key">Key</Label>
                          <Input
                            id="new-customer-key"
                            value={newVar.key}
                            onChange={(e) => setNewVar({...newVar, key: e.target.value})}
                            placeholder="e.g., NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="new-customer-value">Value</Label>
                          <Input
                            id="new-customer-value"
                            type={newVar.is_secret ? "password" : "text"}
                            value={newVar.value}
                            onChange={(e) => setNewVar({...newVar, value: e.target.value})}
                            placeholder="Variable value"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-customer-description">Description</Label>
                        <Input
                          id="new-customer-description"
                          value={newVar.description}
                          onChange={(e) => setNewVar({...newVar, description: e.target.value})}
                          placeholder="What is this variable used for?"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="new-customer-is-secret"
                          checked={newVar.is_secret}
                          onCheckedChange={(checked) => setNewVar({...newVar, is_secret: checked})}
                        />
                        <Label htmlFor="new-customer-is-secret">Sensitive value (display as password)</Label>
                      </div>
                      
                      <Button type="submit" disabled={loading}>
                        Add Variable
                      </Button>
                    </form>
                    
                    {/* Variables List */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Current Customer Variables</h3>
                      
                      {loading ? (
                        <div className="text-center p-4">Loading...</div>
                      ) : envVars.length === 0 ? (
                        <div className="text-center p-4 text-gray-500">No customer-specific variables found</div>
                      ) : (
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {envVars.map((variable) => (
                                <tr key={variable.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{variable.key}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <Input
                                        type={variable.is_secret ? "password" : "text"}
                                        value={variable.value}
                                        onChange={(e) => handleUpdateVariable(variable.id, { value: e.target.value })}
                                        className="text-sm"
                                      />
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button 
                                              variant="ghost" 
                                              size="sm"
                                              onClick={() => handleUpdateVariable(variable.id, { is_secret: !variable.is_secret })}
                                            >
                                              <InfoCircledIcon className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>Toggle visibility</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Input
                                      value={variable.description || ''}
                                      onChange={(e) => handleUpdateVariable(variable.id, { description: e.target.value })}
                                      className="text-sm"
                                      placeholder="Add description..."
                                    />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      onClick={() => handleDeleteVariable(variable.id)}
                                    >
                                      Delete
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-12 text-gray-500">
                    Please select a customer to manage their environment variables
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 