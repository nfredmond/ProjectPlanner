import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { createServerComponentClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/settings';
import { getModelCapabilities } from '@/lib/llm/service';
import fs from 'fs';
import path from 'path';

// Feature to capability mapping
const featureCapabilityMap: Record<string, string[]> = {
  'project-recommendations': ['text_generation', 'reasoning'],
  'feedback-analysis': ['text_generation', 'reasoning'],
  'automated-reporting': ['text_generation', 'long_form_content'],
  'code-generation': ['code_generation'],
  'semantic-search': ['text_generation', 'instruction_following']
};

// Get the currently configured LLM model
async function getCurrentModel(): Promise<string> {
  // Check if we're in portable mode
  const isPortable = process.env.PORTABLE_MODE === 'true';
  
  if (isPortable) {
    // In portable mode, read from settings file or .env
    try {
      const settingsPath = path.join(process.cwd(), 'data', 'llm-settings.json');
      
      if (fs.existsSync(settingsPath)) {
        const fileContent = fs.readFileSync(settingsPath, 'utf8');
        const settings = JSON.parse(fileContent);
        
        if (settings.provider === 'local' && settings.local?.model) {
          return settings.local.model;
        }
      }
      
      // Fallback to .env
      return process.env.LOCAL_LLM_MODEL || 'llama3';
    } catch (error) {
      console.error('Error reading LLM settings:', error);
      return 'llama3'; // Default fallback
    }
  } else {
    // In online mode, get from database
    try {
      const supabase = await createServerComponentClient();
      const { data, error } = await supabase
        .from('llm_configs')
        .select('provider, openai_model, anthropic_model, llama_model, local_model')
        .single();
        
      if (error || !data) {
        return 'gpt-4o'; // Default to a capable model
      }
      
      // Get the appropriate model based on provider
      switch (data.provider) {
        case 'openai':
          return data.openai_model || 'gpt-4o';
        case 'anthropic':
          return data.anthropic_model || 'claude-3-sonnet-20240229';
        case 'llama':
          return data.llama_model || 'llama-3-8b-instruct';
        case 'local':
          return data.local_model || 'llama3';
        default:
          return 'gpt-4o';
      }
    } catch (error) {
      console.error('Error getting current model:', error);
      return 'gpt-4o'; // Default fallback
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate the request
    const { session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get feature from query parameters
    const { searchParams } = new URL(request.url);
    const feature = searchParams.get('feature');
    
    // If no specific feature is requested, return all feature availability
    if (!feature) {
      const currentModel = await getCurrentModel();
      const capabilities = await getModelCapabilities(currentModel);
      
      // Determine which features are available based on capabilities
      const featureAvailability: Record<string, boolean> = {};
      
      for (const [featureName, requiredCapabilities] of Object.entries(featureCapabilityMap)) {
        featureAvailability[featureName] = requiredCapabilities.every(cap => 
          capabilities.includes(cap)
        );
      }
      
      return NextResponse.json({
        model: currentModel,
        capabilities,
        features: featureAvailability
      });
    }
    
    // Check if a specific feature is available
    const requiredCapabilities = featureCapabilityMap[feature];
    if (!requiredCapabilities) {
      return NextResponse.json({ error: 'Unknown feature' }, { status: 400 });
    }
    
    const currentModel = await getCurrentModel();
    const capabilities = await getModelCapabilities(currentModel);
    
    const isAvailable = requiredCapabilities.every(cap => capabilities.includes(cap));
    
    return NextResponse.json({
      feature,
      available: isAvailable,
      model: currentModel,
      requiredCapabilities,
      availableCapabilities: capabilities
    });
    
  } catch (error) {
    console.error('Error checking feature availability:', error);
    return NextResponse.json(
      { error: 'Failed to check feature availability' },
      { status: 500 }
    );
  }
} 