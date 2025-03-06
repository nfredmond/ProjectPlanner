import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Brain, CircleCheck, CircleX, AlertCircle } from 'lucide-react';
import { LlmProvider } from '@/lib/llm/service';

interface LlmModel {
  name: string;
  provider: string;
  contextSize: number;
  capabilities: string[];
}

export default function LlmSettings() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPortable, setIsPortable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [llmEnabled, setLlmEnabled] = useState(true);
  
  // Provider settings
  const [provider, setProvider] = useState<LlmProvider>('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [anthropicModel, setAnthropicModel] = useState('claude-3-sonnet-20240229');
  const [llamaKey, setLlamaKey] = useState('');
  const [llamaModel, setLlamaModel] = useState('llama-3-8b-instruct');
  const [localModel, setLocalModel] = useState('llama3');
  
  // Available models
  const [availableModels, setAvailableModels] = useState<LlmModel[]>([]);
  const [localModels, setLocalModels] = useState<string[]>([]);
  
  // Test result
  const [testResult, setTestResult] = useState<{success?: boolean; message?: string; model?: string}>({});

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        
        // Check if we're in portable mode
        const portableMode = process.env.NEXT_PUBLIC_PORTABLE_MODE === 'true' || 
                           window.location.hostname === 'localhost';
        setIsPortable(portableMode);
        
        // Load available models
        const modelsResponse = await fetch('/api/llm/models');
        if (modelsResponse.ok) {
          const data = await modelsResponse.json();
          setAvailableModels(data.models || []);
        }
        
        // If portable, get local models from Ollama
        if (portableMode) {
          try {
            const localModelsResponse = await fetch('/api/llm/local-models');
            if (localModelsResponse.ok) {
              const data = await localModelsResponse.json();
              setLocalModels(data.models || ['llama3', 'mistral', 'phi3']);
            }
          } catch (error) {
            console.error('Error fetching local models:', error);
            // Fallback to default models
            setLocalModels(['llama3', 'mistral', 'phi3']);
          }
        }
        
        // Load current settings
        const settingsResponse = await fetch('/api/settings/llm');
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          
          setLlmEnabled(settings.enabled !== false);
          setProvider(settings.provider || (portableMode ? 'local' : 'openai'));
          
          // API Keys (masked in response)
          if (settings.openai?.apiKey) setOpenaiKey(settings.openai.apiKey);
          if (settings.anthropic?.apiKey) setAnthropicKey(settings.anthropic.apiKey);
          if (settings.llama?.apiKey) setLlamaKey(settings.llama.apiKey);
          
          // Models
          if (settings.openai?.model) setOpenaiModel(settings.openai.model);
          if (settings.anthropic?.model) setAnthropicModel(settings.anthropic.model);
          if (settings.llama?.model) setLlamaModel(settings.llama.model);
          if (settings.local?.model) setLocalModel(settings.local.model);
        }
      } catch (error) {
        console.error('Error loading LLM settings:', error);
        toast({
          title: 'Error loading settings',
          description: 'Could not load LLM settings. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadSettings();
  }, [toast]);

  const saveSettings = async () => {
    try {
      setLoading(true);
      
      const settings = {
        enabled: llmEnabled,
        provider,
        openai: {
          apiKey: openaiKey,
          model: openaiModel
        },
        anthropic: {
          apiKey: anthropicKey,
          model: anthropicModel
        },
        llama: {
          apiKey: llamaKey,
          model: llamaModel
        },
        local: {
          model: localModel
        }
      };
      
      const response = await fetch('/api/settings/llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        toast({
          title: 'Settings saved',
          description: 'LLM settings have been updated successfully.'
        });
        
        // Reload the page to apply new settings
        setTimeout(() => {
          router.reload();
        }, 1500);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving LLM settings:', error);
      toast({
        title: 'Error saving settings',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);
      setTestResult({});
      
      // Prepare the test data based on the current provider
      let testData: any = {
        provider,
        prompt: 'Briefly introduce yourself in one sentence.'
      };
      
      switch (provider) {
        case 'openai':
          testData.apiKey = openaiKey;
          testData.model = openaiModel;
          break;
        case 'anthropic':
          testData.apiKey = anthropicKey;
          testData.model = anthropicModel;
          break;
        case 'llama':
          testData.apiKey = llamaKey;
          testData.model = llamaModel;
          break;
        case 'local':
          testData.model = localModel;
          break;
      }
      
      const response = await fetch('/api/admin/test-llm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      
      if (response.ok && !result.error) {
        setTestResult({
          success: true,
          message: result.message,
          model: result.model
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Test failed with no specific error'
        });
      }
    } catch (error) {
      console.error('Error testing LLM connection:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      });
    } finally {
      setTesting(false);
    }
  };

  const getModelsByProvider = (providerName: string): LlmModel[] => {
    return availableModels.filter(model => model.provider === providerName);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>LLM Settings</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Language Model Settings</CardTitle>
        <CardDescription>
          Configure the AI language models used for recommendations, analysis, and reporting.
          {isPortable && (
            <span className="block mt-2 text-amber-500 font-medium">
              Running in portable mode with local LLM support through Ollama.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center space-x-2">
          <Switch 
            id="llm-enabled" 
            checked={llmEnabled} 
            onCheckedChange={setLlmEnabled} 
          />
          <Label htmlFor="llm-enabled">Enable AI features</Label>
          <p className="text-sm text-muted-foreground ml-2">
            {llmEnabled ? 'AI features are enabled' : 'AI features are disabled'}
          </p>
        </div>

        {llmEnabled && (
          <>
            <div className="mb-6">
              <Label htmlFor="provider" className="block mb-2">LLM Provider</Label>
              <Select 
                value={provider} 
                onValueChange={(value) => setProvider(value as LlmProvider)}
                disabled={isPortable && !['local', 'custom'].includes(provider)}
              >
                <SelectTrigger id="provider" className="w-full">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {!isPortable && (
                    <>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="llama">LLaMA</SelectItem>
                    </>
                  )}
                  <SelectItem value="local">Local (Ollama)</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue={isPortable ? "local" : provider} value={provider}>
              {!isPortable && (
                <>
                  <TabsContent value="openai">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="openai-key" className="block mb-2">OpenAI API Key</Label>
                        <Input 
                          id="openai-key" 
                          type="password" 
                          value={openaiKey} 
                          onChange={(e) => setOpenaiKey(e.target.value)}
                          placeholder="sk-..." 
                        />
                      </div>
                      <div>
                        <Label htmlFor="openai-model" className="block mb-2">Model</Label>
                        <Select value={openaiModel} onValueChange={setOpenaiModel}>
                          <SelectTrigger id="openai-model" className="w-full">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {getModelsByProvider('openai').map(model => (
                              <SelectItem key={model.name} value={model.name}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="anthropic">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="anthropic-key" className="block mb-2">Anthropic API Key</Label>
                        <Input 
                          id="anthropic-key" 
                          type="password" 
                          value={anthropicKey} 
                          onChange={(e) => setAnthropicKey(e.target.value)}
                          placeholder="sk-ant-..." 
                        />
                      </div>
                      <div>
                        <Label htmlFor="anthropic-model" className="block mb-2">Model</Label>
                        <Select value={anthropicModel} onValueChange={setAnthropicModel}>
                          <SelectTrigger id="anthropic-model" className="w-full">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {getModelsByProvider('anthropic').map(model => (
                              <SelectItem key={model.name} value={model.name}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="llama">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="llama-key" className="block mb-2">LLaMA API Key</Label>
                        <Input 
                          id="llama-key" 
                          type="password" 
                          value={llamaKey} 
                          onChange={(e) => setLlamaKey(e.target.value)}
                          placeholder="Your LLaMA API key" 
                        />
                      </div>
                      <div>
                        <Label htmlFor="llama-model" className="block mb-2">Model</Label>
                        <Select value={llamaModel} onValueChange={setLlamaModel}>
                          <SelectTrigger id="llama-model" className="w-full">
                            <SelectValue placeholder="Select model" />
                          </SelectTrigger>
                          <SelectContent>
                            {getModelsByProvider('llama').map(model => (
                              <SelectItem key={model.name} value={model.name}>
                                {model.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </>
              )}

              <TabsContent value="local">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="local-model" className="block mb-2">Local Model (via Ollama)</Label>
                    <Select value={localModel} onValueChange={setLocalModel}>
                      <SelectTrigger id="local-model" className="w-full">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {localModels.map(model => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground mt-2">
                      These models are running locally through Ollama. 
                      {isPortable ? ' They work offline without an internet connection.' : 
                        ' You need to have Ollama installed and running.'}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="custom">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Custom LLM provider support is coming soon. This will allow you to connect 
                    to any OpenAI-compatible API endpoint.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 p-4 bg-muted rounded-md">
              <h3 className="text-sm font-medium mb-2">Test Connection</h3>
              <Button 
                onClick={testConnection} 
                disabled={testing || (provider !== 'local' && (
                  (provider === 'openai' && !openaiKey) || 
                  (provider === 'anthropic' && !anthropicKey) || 
                  (provider === 'llama' && !llamaKey)
                ))}
                variant="outline"
                className="mb-3"
              >
                {testing ? 'Testing...' : 'Test LLM Connection'}
              </Button>
              
              {testResult.success === true && (
                <div className="p-3 bg-green-50 text-green-700 rounded-md">
                  <p className="font-medium">Success! Model responded:</p>
                  <p className="text-sm mt-1">{testResult.message}</p>
                  <p className="text-xs mt-2">Model: {testResult.model}</p>
                </div>
              )}
              
              {testResult.success === false && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md">
                  <p className="font-medium">Test failed:</p>
                  <p className="text-sm mt-1">{testResult.message}</p>
                </div>
              )}
            </div>
          </>
        )}

      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={saveSettings} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
} 