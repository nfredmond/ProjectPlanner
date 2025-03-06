/**
 * LLM Service for interacting with AI models
 * 
 * This service handles interactions with LLM providers (OpenAI, Anthropic, LLaMA)
 * based on agency settings and configurations.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createLlamaClient, LlamaClient } from './llama-client';
import { createLocalLlmClient, LocalLlmClient } from './local-llm-client';
import { createCache } from './cache';
import { getModelConfig } from './model-config';

// LLM Provider Types
export type LlmProvider = 'openai' | 'anthropic' | 'llama' | 'local' | 'custom';

// LLM Request Interface
export interface LlmRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  user_id?: string;
  purpose: string;
  system_message?: string;
  cache_key?: string; // Optional caching key
}

// LLM Response Interface
export interface LlmResponse {
  text: string;
  model: string;
  tokens_used: number;
  created_at: string;
  provider: LlmProvider;
  cached?: boolean;
}

// LLM Model Configuration
export interface LlmModelConfig {
  name: string;
  provider: LlmProvider;
  contextSize: number;
  costPer1kTokens: number;
  capabilities: string[];
  defaultForTasks?: string[];
}

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const llamaClient = createLlamaClient({
  apiKey: process.env.LLAMA_API_KEY || '',
  baseUrl: process.env.LLAMA_API_URL || 'https://api.llama-api.com',
});

const localLlmClient = createLocalLlmClient({
  apiUrl: process.env.LOCAL_LLM_API_URL || 'http://localhost:11434',
  defaultModel: process.env.LOCAL_LLM_MODEL || 'llama3',
});

// Initialize cache
const responseCache = createCache();

/**
 * Send a request to an LLM provider and get a response
 */
export async function getLlmResponse(
  request: LlmRequest,
  provider?: LlmProvider
): Promise<LlmResponse> {
  try {
    // Check if we have a cached response
    if (request.cache_key) {
      const cachedResponse = responseCache.get(request.cache_key);
      if (cachedResponse) {
        return {
          ...cachedResponse,
          cached: true,
        };
      }
    }
    
    // If provider not specified, get from config
    if (!provider) {
      provider = await getProviderForPurpose(request.purpose);
    }
    
    // Default values
    const model = request.model || getDefaultModel(provider);
    const temperature = request.temperature || 0.7;
    const max_tokens = request.max_tokens || 1000;
    
    // Log request for auditing (in a real app, store in database)
    console.log(`LLM Request: ${provider} - ${model} - ${request.purpose}`);
    
    // Route to appropriate provider
    let response: LlmResponse;
    
    try {
      switch (provider) {
        case 'openai':
          response = await getOpenAiResponse(request, model, temperature, max_tokens);
          break;
        case 'anthropic':
          response = await getAnthropicResponse(request, model, temperature, max_tokens);
          break;
        case 'llama':
          response = await getLlamaResponse(request, model, temperature, max_tokens);
          break;
        case 'local':
          response = await getLocalLlmResponse(request, model, temperature, max_tokens);
          break;
        default:
          throw new Error(`Unsupported LLM provider: ${provider}`);
      }
      
      // Cache response if cache_key provided
      if (request.cache_key) {
        responseCache.set(request.cache_key, response);
      }
      
      return response;
    } catch (error) {
      // Try fallback if primary provider fails
      return await tryFallbackProviders(request, provider, error);
    }
  } catch (error) {
    console.error('Error calling LLM:', error);
    throw error;
  }
}

/**
 * Attempt to use fallback providers if the primary provider fails
 */
async function tryFallbackProviders(
  request: LlmRequest, 
  failedProvider: LlmProvider,
  originalError: any
): Promise<LlmResponse> {
  // Get fallback providers (excluding the one that just failed)
  const fallbackProviders = ['openai', 'anthropic', 'llama'].filter(
    p => p !== failedProvider
  ) as LlmProvider[];
  
  // Log fallback attempt
  console.log(`Primary provider ${failedProvider} failed, trying fallbacks: ${fallbackProviders.join(', ')}`);
  
  // Try each fallback in sequence
  for (const provider of fallbackProviders) {
    try {
      const model = getDefaultModel(provider);
      const temperature = request.temperature || 0.7;
      const max_tokens = request.max_tokens || 1000;
      
      let response: LlmResponse;
      
      switch (provider) {
        case 'openai':
          response = await getOpenAiResponse(request, model, temperature, max_tokens);
          break;
        case 'anthropic':
          response = await getAnthropicResponse(request, model, temperature, max_tokens);
          break;
        case 'llama':
          response = await getLlamaResponse(request, model, temperature, max_tokens);
          break;
        default:
          continue; // Skip unsupported provider
      }
      
      // If we got here, the fallback worked
      console.log(`Fallback to ${provider} successful`);
      return {
        ...response,
        text: `[Note: Response provided by fallback provider ${provider}]\n\n${response.text}`
      };
    } catch (fallbackError) {
      // This fallback failed, try the next one
      console.error(`Fallback to ${provider} failed:`, fallbackError);
    }
  }
  
  // If we get here, all fallbacks failed
  console.error('All LLM providers failed');
  throw originalError;
}

/**
 * Get a response from OpenAI
 */
async function getOpenAiResponse(
  request: LlmRequest,
  model: string,
  temperature: number,
  max_tokens: number
): Promise<LlmResponse> {
  const messages = [];
  
  // Add system message if provided
  if (request.system_message) {
    messages.push({
      role: 'system' as const,
      content: request.system_message,
    });
  } else {
    // Default system message
    messages.push({
      role: 'system' as const,
      content: 'You are a helpful assistant for transportation planning professionals. Provide concise, accurate information about transportation projects.',
    });
  }
  
  // Add user message (the prompt)
  messages.push({
    role: 'user' as const,
    content: request.prompt,
  });
  
  // Call OpenAI API
  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens,
    user: request.user_id,
  });
  
  // Extract response
  const responseText = completion.choices[0]?.message?.content || '';
  const tokensUsed = completion.usage?.total_tokens || 0;
  
  return {
    text: responseText,
    model,
    tokens_used: tokensUsed,
    created_at: new Date().toISOString(),
    provider: 'openai'
  };
}

/**
 * Get a response from Anthropic
 */
async function getAnthropicResponse(
  request: LlmRequest,
  model: string,
  temperature: number,
  max_tokens: number
): Promise<LlmResponse> {
  // Build system prompt and format according to Anthropic's requirements
  const systemPrompt = request.system_message || 
    'You are a helpful assistant for transportation planning professionals. Provide concise, accurate information about transportation projects.';
  
  // Format prompt using Anthropic's constants (which should be available in the SDK)
  const prompt = `${systemPrompt}\n\nHuman: ${request.prompt}\n\nAssistant:`;
  
  // Call Anthropic API using completions endpoint
  try {
    const response = await anthropic.completions.create({
      model,
      prompt,
      max_tokens_to_sample: max_tokens,
      temperature,
    });

    // Extract completion from response
    return {
      text: response.completion,
      model,
      tokens_used: response.stop_reason === 'max_tokens' ? max_tokens : 0, // Estimate tokens used
      created_at: new Date().toISOString(),
      provider: 'anthropic',
    };
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    throw error;
  }
}

/**
 * Get a response from LLaMA
 */
async function getLlamaResponse(
  request: LlmRequest,
  model: string,
  temperature: number,
  max_tokens: number
): Promise<LlmResponse> {
  // Build system prompt
  const systemPrompt = request.system_message || 
    'You are a helpful assistant for transportation planning professionals. Provide concise, accurate information about transportation projects.';
  
  // Call LLaMA API
  const completion = await llamaClient.complete({
    prompt: `${systemPrompt}\n\nUser: ${request.prompt}\nAssistant:`,
    model,
    max_tokens,
    temperature,
  });
  
  // Extract response
  const responseText = completion.text || '';
  
  return {
    text: responseText,
    model,
    tokens_used: completion.usage?.total_tokens || 0,
    created_at: new Date().toISOString(),
    provider: 'llama'
  };
}

/**
 * Get a response from the local LLM through Ollama
 */
async function getLocalLlmResponse(
  request: LlmRequest,
  model: string,
  temperature: number,
  max_tokens: number
): Promise<LlmResponse> {
  // Build system prompt
  const systemPrompt = request.system_message || 
    'You are a helpful assistant for transportation planning professionals. Provide concise, accurate information about transportation projects.';
  
  // Call the local LLM through Ollama
  const completion = await localLlmClient.generate({
    prompt: request.prompt,
    model,
    system: systemPrompt,
    temperature,
    max_tokens,
  });
  
  // Extract response
  return {
    text: completion.text,
    model,
    tokens_used: completion.usage?.total_tokens || 0,
    created_at: new Date().toISOString(),
    provider: 'local'
  };
}

/**
 * Get the default model for a provider
 */
function getDefaultModel(provider: LlmProvider): string {
  switch (provider) {
    case 'openai':
      return 'gpt-4o';
    case 'anthropic':
      return 'claude-3-sonnet-20240229';
    case 'llama':
      return 'llama-3-8b-instruct';
    case 'local':
      return process.env.LOCAL_LLM_MODEL || 'llama3';
    default:
      return 'gpt-3.5-turbo'; // Fallback
  }
}

/**
 * Get the recommended provider for a specific purpose
 */
async function getProviderForPurpose(purpose: string): Promise<LlmProvider> {
  // In a real implementation, this would check database settings
  // For now, we'll use hardcoded defaults
  const purposeMap: Record<string, LlmProvider> = {
    'generate-report': 'anthropic', // Claude is better for long-form content
    'grant-analysis': 'openai',     // GPT is better for structured analysis
    'project-recommendations': 'openai',
    'analyze': 'openai',
    'feedback-response': 'anthropic',
  };
  
  return purposeMap[purpose] || 'openai'; // Default to OpenAI
}

/**
 * Get available models and their capabilities
 */
export async function getAvailableModels(): Promise<LlmModelConfig[]> {
  return await getModelConfig();
}

/**
 * Check if a model supports a specific capability
 */
export async function modelSupportsCapability(
  modelName: string,
  capability: string
): Promise<boolean> {
  const model = await getModelConfig(modelName);
  if (!model) return false;
  
  return model.capabilities.includes(capability);
}

/**
 * Get list of supported capabilities for a model
 */
export async function getModelCapabilities(modelName: string): Promise<string[]> {
  const model = await getModelConfig(modelName);
  if (!model) return [];
  
  return model.capabilities;
}
