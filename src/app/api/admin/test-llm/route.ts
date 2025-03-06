import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { LlmSettings } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Get the current user from Supabase auth
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to test LLM connections' },
        { status: 401 }
      );
    }
    
    // Get the user's profile to check if they're an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, agency_id')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized: User profile not found' },
        { status: 401 }
      );
    }
    
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can test LLM connections' },
        { status: 403 }
      );
    }
    
    // Parse the request body
    const body = await request.json();
    const { agencyId, config } = body;
    
    // Verify the user belongs to the agency they're trying to configure
    if (profile.agency_id !== agencyId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only configure your own agency' },
        { status: 403 }
      );
    }
    
    // Test the LLM connection based on the provider
    const result = await testLlmConnection(config);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing LLM connection:', error);
    return NextResponse.json(
      { error: `Failed to test LLM connection: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

async function testLlmConnection(config: LlmSettings) {
  const { apiProvider, apiKey, apiEndpoint, model } = config;
  
  if (!apiKey) {
    return { error: 'API key is required' };
  }
  
  try {
    // Simple test prompt
    const prompt = "Respond with 'Connection successful!' if you can read this message.";
    
    // Handle different API providers
    switch (apiProvider) {
      case 'openai':
        return await testOpenAI(apiKey, model, prompt);
      
      case 'azure':
        if (!apiEndpoint) {
          return { error: 'API endpoint is required for Azure OpenAI' };
        }
        return await testAzureOpenAI(apiKey, apiEndpoint, model, prompt);
      
      case 'anthropic':
        return await testAnthropic(apiKey, model, prompt);
      
      case 'custom':
        if (!apiEndpoint) {
          return { error: 'API endpoint is required for custom providers' };
        }
        return { message: 'Custom provider connection test is not implemented yet' };
      
      default:
        return { error: `Unsupported API provider: ${apiProvider}` };
    }
  } catch (error) {
    console.error('Error in LLM test:', error);
    return { error: `LLM test failed: ${(error as Error).message}` };
  }
}

async function testOpenAI(apiKey: string, model: string, prompt: string) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 50
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error?.message || 'Unknown OpenAI API error' };
    }
    
    return { 
      message: data.choices[0]?.message?.content || 'No response content',
      model: data.model,
      usage: data.usage
    };
  } catch (error) {
    return { error: `OpenAI API error: ${(error as Error).message}` };
  }
}

async function testAzureOpenAI(apiKey: string, apiEndpoint: string, model: string, prompt: string) {
  try {
    // Ensure the endpoint doesn't end with a slash
    const endpoint = apiEndpoint.endsWith('/') 
      ? apiEndpoint.slice(0, -1) 
      : apiEndpoint;
    
    const deploymentName = model; // In Azure, the model is the deployment name
    const apiVersion = '2023-05-15'; // Use the appropriate API version
    
    const response = await fetch(
      `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 50
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error?.message || 'Unknown Azure OpenAI API error' };
    }
    
    return { 
      message: data.choices[0]?.message?.content || 'No response content',
      model: data.model,
      usage: data.usage
    };
  } catch (error) {
    return { error: `Azure OpenAI API error: ${(error as Error).message}` };
  }
}

async function testAnthropic(apiKey: string, model: string, prompt: string) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 50
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error?.message || 'Unknown Anthropic API error' };
    }
    
    return { 
      message: data.content[0]?.text || 'No response content',
      model: data.model
    };
  } catch (error) {
    return { error: `Anthropic API error: ${(error as Error).message}` };
  }
} 