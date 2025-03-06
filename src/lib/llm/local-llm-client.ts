/**
 * Local LLM Client
 * 
 * This module provides a client for interacting with local LLMs through Ollama.
 * Ollama allows running open-source models like Llama, Mistral, etc. locally.
 * https://ollama.ai/
 */

export interface LocalLlmConfig {
  apiUrl: string;
  defaultModel: string;
}

export interface LocalLlmRequest {
  prompt: string;
  model?: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface LocalLlmResponse {
  text: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface LocalLlmClient {
  generate(request: LocalLlmRequest): Promise<LocalLlmResponse>;
  getAvailableModels(): Promise<string[]>;
}

/**
 * Create a client for interacting with local LLMs via Ollama
 */
export function createLocalLlmClient(config: LocalLlmConfig): LocalLlmClient {
  const { apiUrl, defaultModel } = config;
  
  /**
   * Generate completion using local LLM
   */
  async function generate(request: LocalLlmRequest): Promise<LocalLlmResponse> {
    try {
      const model = request.model || defaultModel;
      
      // Format in a way compatible with Ollama API
      const requestBody = {
        model: model,
        prompt: request.prompt,
        system: request.system,
        options: {
          temperature: request.temperature || 0.7,
          num_predict: request.max_tokens || 1000
        }
      };
      
      const response = await fetch(`${apiUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        let errorText = '';
        try {
          const errorData = await response.json();
          errorText = errorData.error || response.statusText;
        } catch (e) {
          errorText = response.statusText;
        }
        throw new Error(`Local LLM API error: ${errorText}`);
      }
      
      const result = await response.json();
      
      return {
        text: result.response || '',
        model: result.model || model,
        usage: {
          prompt_tokens: result.prompt_eval_count || 0,
          completion_tokens: result.eval_count || 0,
          total_tokens: (result.prompt_eval_count || 0) + (result.eval_count || 0)
        }
      };
    } catch (error) {
      console.error('Error calling local LLM:', error);
      throw error;
    }
  }
  
  /**
   * Get list of available models from Ollama
   */
  async function getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${apiUrl}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get available models: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Extract model names from the response
      return data.models?.map((model: any) => model.name) || [];
    } catch (error) {
      console.error('Error getting available models:', error);
      return [defaultModel]; // Return default model as fallback
    }
  }
  
  return {
    generate,
    getAvailableModels
  };
} 