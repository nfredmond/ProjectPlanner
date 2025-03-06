/**
 * LLM Model Configuration
 * 
 * This module manages model configurations for all the supported LLM providers.
 * It handles default model selections and capabilities.
 */

import { LlmModelConfig, LlmProvider } from './service';
import { createAdminClient } from '../../lib/supabase-client';

// Cache for model configurations
let modelConfigs: LlmModelConfig[] | null = null;

/**
 * Get the model configuration for a specific model
 */
export async function getModelConfig(modelName: string): Promise<LlmModelConfig | null> {
  const configs = await getAvailableModelConfigs();
  return configs.find(config => config.name === modelName) || null;
}

/**
 * Get all available model configurations
 */
export async function getAvailableModelConfigs(): Promise<LlmModelConfig[]> {
  if (!modelConfigs) {
    modelConfigs = getDefaultModelConfigs();
  }
  return modelConfigs;
}

/**
 * Get configuration for available LLM models
 */
export async function getModelConfig(): Promise<LlmModelConfig[]> {
  // Try to get config from database
  const supabase = createAdminClient();
  const { data: dbConfigs, error } = await supabase
    .from('llm_configs')
    .select('*');
  
  // If database has configs, return them
  if (dbConfigs && dbConfigs.length > 0 && !error) {
    return dbConfigs as LlmModelConfig[];
  }
  
  // Otherwise, return default configurations
  return getDefaultModelConfigs();
}

/**
 * Get default configurations for supported models
 */
function getDefaultModelConfigs(): LlmModelConfig[] {
  return [
    // OpenAI models
    {
      name: 'gpt-4o',
      provider: 'openai',
      contextSize: 128000,
      costPer1kTokens: 0.01,
      capabilities: ['text_generation', 'code_generation', 'instruction_following', 'reasoning'],
      defaultForTasks: ['analyze', 'project-recommendations'],
    },
    {
      name: 'gpt-4-turbo',
      provider: 'openai',
      contextSize: 128000,
      costPer1kTokens: 0.01,
      capabilities: ['text_generation', 'code_generation', 'instruction_following', 'reasoning'],
    },
    {
      name: 'gpt-3.5-turbo',
      provider: 'openai',
      contextSize: 16000,
      costPer1kTokens: 0.001,
      capabilities: ['text_generation', 'instruction_following'],
    },
    
    // Anthropic models
    {
      name: 'claude-3-opus-20240229',
      provider: 'anthropic',
      contextSize: 200000,
      costPer1kTokens: 0.015,
      capabilities: ['text_generation', 'instruction_following', 'reasoning', 'long_form_content'],
      defaultForTasks: ['generate-report', 'feedback-response'],
    },
    {
      name: 'claude-3-sonnet-20240229',
      provider: 'anthropic',
      contextSize: 180000,
      costPer1kTokens: 0.008,
      capabilities: ['text_generation', 'instruction_following', 'reasoning'],
    },
    {
      name: 'claude-3-haiku-20240307',
      provider: 'anthropic',
      contextSize: 160000,
      costPer1kTokens: 0.003,
      capabilities: ['text_generation', 'instruction_following'],
    },
    
    // LLaMA models
    {
      name: 'llama-3-70b-instruct',
      provider: 'llama',
      contextSize: 8000,
      costPer1kTokens: 0.0008,
      capabilities: ['text_generation', 'instruction_following'],
    },
    {
      name: 'llama-3-8b-instruct',
      provider: 'llama',
      contextSize: 4000,
      costPer1kTokens: 0.0002,
      capabilities: ['text_generation', 'instruction_following'],
    },
    
    // Local LLM models through Ollama
    {
      name: 'llama3',
      provider: 'local',
      contextSize: 4000,
      costPer1kTokens: 0,
      capabilities: ['text_generation', 'instruction_following'],
      defaultForTasks: ['analyze', 'generate-report'],
    },
    {
      name: 'mistral',
      provider: 'local',
      contextSize: 8000,
      costPer1kTokens: 0,
      capabilities: ['text_generation', 'instruction_following'],
    },
    {
      name: 'gemma',
      provider: 'local',
      contextSize: 4000, 
      costPer1kTokens: 0,
      capabilities: ['text_generation', 'instruction_following'],
    },
    {
      name: 'phi3',
      provider: 'local',
      contextSize: 2000,
      costPer1kTokens: 0,
      capabilities: ['text_generation', 'instruction_following'],
      defaultForTasks: ['summarize', 'classify'],
    },
  ];
}

/**
 * Get recommended model for a specific task
 */
export function getRecommendedModel(
  models: LlmModelConfig[],
  task: string,
  provider?: LlmProvider
): string | undefined {
  // First, try to find a model that's specifically marked as default for this task
  // and matches the requested provider if specified
  const defaultModel = models.find(model => 
    model.defaultForTasks?.includes(task) && 
    (!provider || model.provider === provider)
  );
  
  if (defaultModel) {
    return defaultModel.name;
  }
  
  // If no specific default for task, return highest capability model for the provider
  if (provider) {
    const providerModels = models
      .filter(model => model.provider === provider)
      .sort((a, b) => b.capabilities.length - a.capabilities.length);
    
    return providerModels[0]?.name;
  }
  
  // If no provider specified and no task default, return overall best model
  const bestModel = models
    .sort((a, b) => b.capabilities.length - a.capabilities.length)[0];
  
  return bestModel?.name;
} 