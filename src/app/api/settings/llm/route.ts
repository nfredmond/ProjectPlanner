import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { createServerComponentClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

// Define interfaces for LLM settings
interface LlmSettings {
  enabled: boolean;
  provider: string;
  openai?: {
    apiKey?: string;
    model?: string;
  };
  anthropic?: {
    apiKey?: string;
    model?: string;
  };
  llama?: {
    apiKey?: string;
    model?: string;
  };
  local?: {
    model?: string;
  };
}

// Get settings, different methods based on portable mode
async function getSettings(): Promise<LlmSettings> {
  // Check if we're in portable mode
  const isPortable = process.env.PORTABLE_MODE === 'true';
  
  if (isPortable) {
    // In portable mode, read from .env file or from a local settings file
    try {
      const settingsPath = path.join(process.cwd(), 'data', 'llm-settings.json');
      
      if (fs.existsSync(settingsPath)) {
        const fileContent = fs.readFileSync(settingsPath, 'utf8');
        return JSON.parse(fileContent);
      }
      
      // Default portable settings if file doesn't exist
      return {
        enabled: process.env.ENABLE_LLM_FEATURES === 'true',
        provider: process.env.LLM_PROVIDER || 'local',
        local: {
          model: process.env.LOCAL_LLM_MODEL || 'llama3'
        }
      };
    } catch (error) {
      console.error('Error reading settings file:', error);
      // Return default settings
      return {
        enabled: true,
        provider: 'local',
        local: {
          model: 'llama3'
        }
      };
    }
  } else {
    // In online mode, get from database
    const { supabase } = await createServerComponentClient();
    
    try {
      const { data, error } = await supabase
        .from('llm_configs')
        .select('*')
        .single();
        
      if (error) throw error;
      
      if (!data) {
        return {
          enabled: true,
          provider: 'openai',
          openai: {
            model: 'gpt-4o'
          }
        };
      }
      
      return {
        enabled: data.enabled !== false,
        provider: data.provider || 'openai',
        openai: {
          apiKey: '••••••••', // Masked for security
          model: data.openai_model
        },
        anthropic: {
          apiKey: data.anthropic_api_key ? '••••••••' : undefined,
          model: data.anthropic_model
        },
        llama: {
          apiKey: data.llama_api_key ? '••••••••' : undefined,
          model: data.llama_model
        },
        local: {
          model: data.local_model
        }
      };
    } catch (error) {
      console.error('Error getting LLM settings:', error);
      throw error;
    }
  }
}

// Save settings, different methods based on portable mode
async function saveSettings(settings: LlmSettings): Promise<void> {
  // Check if we're in portable mode
  const isPortable = process.env.PORTABLE_MODE === 'true';
  
  if (isPortable) {
    // In portable mode, save to a local settings file
    try {
      const dataDir = path.join(process.cwd(), 'data');
      const settingsPath = path.join(dataDir, 'llm-settings.json');
      
      // Ensure data directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Write settings to file
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      
      // If settings change the LLM model, also update the .env file
      if (settings.local?.model && settings.provider === 'local') {
        updatePortableEnvFile('LOCAL_LLM_MODEL', settings.local.model);
        updatePortableEnvFile('LLM_PROVIDER', settings.provider);
        updatePortableEnvFile('ENABLE_LLM_FEATURES', settings.enabled.toString());
      }
      
    } catch (error) {
      console.error('Error saving settings file:', error);
      throw error;
    }
  } else {
    // In online mode, save to database
    const { supabase } = await createServerComponentClient();
    
    try {
      const { error } = await supabase
        .from('llm_configs')
        .upsert({
          enabled: settings.enabled,
          provider: settings.provider,
          openai_model: settings.openai?.model,
          openai_api_key: settings.openai?.apiKey === '••••••••' ? undefined : settings.openai?.apiKey,
          anthropic_model: settings.anthropic?.model,
          anthropic_api_key: settings.anthropic?.apiKey === '••••••••' ? undefined : settings.anthropic?.apiKey,
          llama_model: settings.llama?.model,
          llama_api_key: settings.llama?.apiKey === '••••••••' ? undefined : settings.llama?.apiKey,
          local_model: settings.local?.model,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });
        
      if (error) throw error;
    } catch (error) {
      console.error('Error saving LLM settings:', error);
      throw error;
    }
  }
}

// Helper function to update a value in the .env file
function updatePortableEnvFile(key: string, value: string): void {
  try {
    const envPath = path.join(process.cwd(), '.env');
    
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Check if the key exists
      const regex = new RegExp(`^${key}=.*$`, 'm');
      
      if (regex.test(envContent)) {
        // Update existing key
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        // Add key if it doesn't exist
        envContent += `\n${key}=${value}`;
      }
      
      fs.writeFileSync(envPath, envContent);
    }
  } catch (error) {
    console.error(`Error updating ${key} in .env file:`, error);
  }
}

// GET handler - Retrieve current LLM settings
export async function GET(request: NextRequest) {
  try {
    // Validate the request
    const { session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const settings = await getSettings();
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error retrieving LLM settings:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve LLM settings' },
      { status: 500 }
    );
  }
}

// POST handler - Update LLM settings
export async function POST(request: NextRequest) {
  try {
    // Validate the request
    const { session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current user role
    const { supabase } = await createServerComponentClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    // Only admins can update LLM settings
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can update LLM settings.' },
        { status: 403 }
      );
    }
    
    const newSettings = await request.json();
    
    // Basic validation
    if (!newSettings || typeof newSettings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data provided' },
        { status: 400 }
      );
    }
    
    await saveSettings(newSettings);
    
    return NextResponse.json({
      success: true,
      message: 'LLM settings updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating LLM settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update LLM settings',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 