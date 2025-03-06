import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { createLocalLlmClient } from '@/lib/llm/local-llm-client';

export async function GET(request: NextRequest) {
  try {
    // Validate the request
    const { session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Initialize local LLM client
    const localClient = createLocalLlmClient({
      apiUrl: process.env.LOCAL_LLM_API_URL || 'http://localhost:11434',
      defaultModel: process.env.LOCAL_LLM_MODEL || 'llama3'
    });
    
    // Default model list in case the fetch fails
    let models = ['llama3', 'mistral', 'phi3', 'gemma'];
    
    try {
      // Try to get available models from Ollama
      const availableModels = await localClient.getAvailableModels();
      if (availableModels && availableModels.length > 0) {
        models = availableModels;
      }
    } catch (error) {
      console.error('Error fetching models from Ollama:', error);
      // Use the default model list if fetching fails
    }
    
    return NextResponse.json({ 
      models: models,
      count: models.length,
      source: 'ollama'
    });
  } catch (error) {
    console.error('Error retrieving local models:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve local models',
        models: ['llama3', 'mistral', 'phi3', 'gemma'], // Fallback models
        count: 4,
        source: 'fallback'
      },
      { status: 200 } // Still return a 200 with fallback models
    );
  }
} 