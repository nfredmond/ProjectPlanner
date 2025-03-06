/**
 * LLaMA API Client
 * 
 * This module provides a client for interacting with LLaMA models through their API.
 */

export interface LlamaConfig {
  apiKey: string;
  baseUrl: string;
}

export interface LlamaCompletionRequest {
  prompt: string;
  model: string;
  max_tokens: number;
  temperature: number;
  stop?: string[];
}

export interface LlamaCompletionResponse {
  text: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface LlamaClient {
  complete(request: LlamaCompletionRequest): Promise<LlamaCompletionResponse>;
}

/**
 * Create a client for the LLaMA API
 */
export function createLlamaClient(config: LlamaConfig): LlamaClient {
  const { apiKey, baseUrl } = config;
  
  /**
   * Generate a completion using LLaMA models
   */
  async function complete(request: LlamaCompletionRequest): Promise<LlamaCompletionResponse> {
    try {
      // In a real implementation, this would call the actual LLaMA API
      // For this example, we're simulating the API call structure
      const response = await fetch(`${baseUrl}/v1/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: request.model,
          prompt: request.prompt,
          max_tokens: request.max_tokens,
          temperature: request.temperature,
          stop: request.stop
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`LLaMA API error: ${error.error?.message || response.statusText}`);
      }
      
      const result = await response.json();
      
      return {
        text: result.choices[0]?.text || '',
        usage: result.usage
      };
    } catch (error) {
      console.error('Error calling LLaMA API:', error);
      throw error;
    }
  }
  
  return {
    complete
  };
} 