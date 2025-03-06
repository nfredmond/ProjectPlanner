'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LlmConfigurationProps {
  agencyId: string;
}

export default function LlmConfiguration({ agencyId }: LlmConfigurationProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    apiProvider: 'openai',
    apiKey: '',
    apiEndpoint: '',
    model: 'gpt-4o',
    systemPrompt: '',
    maxTokens: 4000,
    temperature: 0.7,
    presencePenalty: 0,
    frequencyPenalty: 0,
    contextWindow: 5,
  });

  const supabase = createClientComponentClient();
  const { toast } = useToast();

  // Fetch the current configuration
  useEffect(() => {
    async function fetchConfig() {
      setIsLoading(true);
      
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('settings')
        .eq('id', agencyId)
        .single();
      
      if (agencyError) {
        toast({
          title: "Error",
          description: "Failed to load LLM configuration: " + agencyError.message,
          variant: "destructive",
        });
      } else if (agencyData && agencyData.settings && agencyData.settings.llm) {
        // If LLM settings exist, populate the form
        const llmSettings = agencyData.settings.llm;
        setConfig({
          enabled: llmSettings.enabled || false,
          apiProvider: llmSettings.apiProvider || 'openai',
          apiKey: llmSettings.apiKey || '',
          apiEndpoint: llmSettings.apiEndpoint || '',
          model: llmSettings.model || 'gpt-4o',
          systemPrompt: llmSettings.systemPrompt || '',
          maxTokens: llmSettings.maxTokens || 4000,
          temperature: llmSettings.temperature || 0.7,
          presencePenalty: llmSettings.presencePenalty || 0,
          frequencyPenalty: llmSettings.frequencyPenalty || 0,
          contextWindow: llmSettings.contextWindow || 5,
        });
      }
      
      setIsLoading(false);
    }
    
    fetchConfig();
  }, [agencyId, supabase, toast]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number' || name === 'temperature' || name === 'presencePenalty' || name === 'frequencyPenalty' || name === 'maxTokens' || name === 'contextWindow') {
      setConfig({
        ...config,
        [name]: parseFloat(value),
      });
    } else {
      setConfig({
        ...config,
        [name]: value,
      });
    }
  };

  // Handle switch toggle for enabling/disabling LLM
  const handleToggleEnabled = (checked: boolean) => {
    setConfig({
      ...config,
      enabled: checked,
    });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setConfig({
      ...config,
      [name]: value,
    });
  };

  // Save configuration
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // First, fetch the current agency settings to avoid overwriting other settings
      const { data: agencyData, error: fetchError } = await supabase
        .from('agencies')
        .select('settings')
        .eq('id', agencyId)
        .single();
      
      if (fetchError) throw new Error(fetchError.message);
      
      // Prepare the updated settings object
      const currentSettings = agencyData.settings || {};
      const updatedSettings = {
        ...currentSettings,
        llm: { ...config },
      };
      
      // Update the agency settings
      const { error: updateError } = await supabase
        .from('agencies')
        .update({ 
          settings: updatedSettings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agencyId);
      
      if (updateError) throw new Error(updateError.message);
      
      toast({
        title: "Success",
        description: "LLM configuration saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save LLM configuration: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Test the LLM configuration
  const handleTestConnection = async () => {
    setIsSaving(true);
    
    try {
      // Call an API route to test the LLM connection
      const response = await fetch('/api/admin/test-llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agencyId,
          config,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to test LLM connection');
      }
      
      toast({
        title: "Success",
        description: "LLM connection tested successfully! Response: " + result.message,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `LLM test failed: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>LLM Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Configuration</CardTitle>
        <CardDescription>
          Configure how the Large Language Model integration works in your application.
          These settings control the AI assistant capabilities throughout the platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable LLM Integration */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Enable LLM Integration</h3>
            <p className="text-sm text-gray-500">
              Turn on AI assistant features across the platform
            </p>
          </div>
          <Switch 
            checked={config.enabled} 
            onCheckedChange={handleToggleEnabled} 
            id="llm-enabled"
          />
        </div>
        
        <div className="grid gap-6">
          {/* API Provider */}
          <div className="space-y-2">
            <Label htmlFor="apiProvider">API Provider</Label>
            <Select 
              value={config.apiProvider} 
              onValueChange={(value) => handleSelectChange('apiProvider', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select API provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="azure">Azure OpenAI</SelectItem>
                <SelectItem value="anthropic">Anthropic</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              name="apiKey"
              type="password"
              value={config.apiKey}
              onChange={handleChange}
              placeholder="Enter your API key"
              className="font-mono"
            />
            <p className="text-xs text-gray-500">
              This key is stored securely and used only for making API calls to the LLM provider.
            </p>
          </div>
          
          {/* API Endpoint (conditional for Azure or Custom) */}
          {(config.apiProvider === 'azure' || config.apiProvider === 'custom') && (
            <div className="space-y-2">
              <Label htmlFor="apiEndpoint">API Endpoint</Label>
              <Input
                id="apiEndpoint"
                name="apiEndpoint"
                type="text"
                value={config.apiEndpoint}
                onChange={handleChange}
                placeholder="https://your-resource-name.openai.azure.com/"
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                The base URL for your API calls.
              </p>
            </div>
          )}
          
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select 
              value={config.model} 
              onValueChange={(value) => handleSelectChange('model', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {config.apiProvider === 'openai' && (
                  <>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </>
                )}
                
                {config.apiProvider === 'anthropic' && (
                  <>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                    <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                  </>
                )}
                
                {config.apiProvider === 'azure' && (
                  <>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    <SelectItem value="gpt-35-turbo">GPT-3.5 Turbo</SelectItem>
                  </>
                )}
                
                {config.apiProvider === 'custom' && (
                  <SelectItem value="custom">Custom Model</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              name="systemPrompt"
              value={config.systemPrompt}
              onChange={handleChange}
              placeholder="You are an assistant for a transportation planning agency. Your purpose is to help users understand and analyze transportation projects..."
              rows={6}
            />
            <p className="text-xs text-gray-500">
              The system prompt defines how the AI assistant behaves. Be specific about the assistant&apos;s role, knowledge areas, and limitations.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Max Tokens */}
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                name="maxTokens"
                type="number"
                min="100"
                max="32000"
                step="100"
                value={config.maxTokens}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500">
                Maximum output tokens generated in a response
              </p>
            </div>
            
            {/* Temperature */}
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                name="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500">
                Controls randomness (0 = deterministic, 1 = creative)
              </p>
            </div>
            
            {/* Presence Penalty */}
            <div className="space-y-2">
              <Label htmlFor="presencePenalty">Presence Penalty</Label>
              <Input
                id="presencePenalty"
                name="presencePenalty"
                type="number"
                min="-2"
                max="2"
                step="0.1"
                value={config.presencePenalty}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500">
                Discourages repetition of already-mentioned topics
              </p>
            </div>
            
            {/* Frequency Penalty */}
            <div className="space-y-2">
              <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
              <Input
                id="frequencyPenalty"
                name="frequencyPenalty"
                type="number"
                min="-2"
                max="2"
                step="0.1"
                value={config.frequencyPenalty}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500">
                Discourages repetition of specific phrases
              </p>
            </div>
            
            {/* Context Window */}
            <div className="space-y-2">
              <Label htmlFor="contextWindow">Context Window</Label>
              <Input
                id="contextWindow"
                name="contextWindow"
                type="number"
                min="1"
                max="20"
                step="1"
                value={config.contextWindow}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500">
                Number of previous messages to include as context
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleTestConnection} disabled={isSaving || !config.apiKey}>
          {isSaving ? 'Testing...' : 'Test Connection'}
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </CardFooter>
    </Card>
  );
} 