import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { createServerComponentClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createLocalLlmClient } from '@/lib/llm/local-llm-client';

export async function POST(request: NextRequest) {
  try {
    // Validate the request
    const { session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get current user role
    const supabase = await createServerComponentClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    // Only admins can test LLM connections
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can test LLM connections.' },
        { status: 403 }
      );
    }
    
    const { provider, apiKey, model, prompt } = await request.json();
    
    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 });
    }
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    
    switch (provider) {
      case 'openai':
        return await testOpenAI(apiKey, model, prompt);
      
      case 'anthropic':
        return await testAnthropic(apiKey, model, prompt);
      
      case 'llama':
        return await testLlama(apiKey, model, prompt);
      
      case 'local':
        return await testLocal(model, prompt);
      
      default:
        return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error testing LLM:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test LLM connection', 
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function testOpenAI(apiKey: string, model: string, prompt: string) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key is required' }, { status: 400 });
    }
    
    const openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
    
    const response = await openai.chat.completions.create({
      model: model || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50
    });
    
    return NextResponse.json({ 
      message: response.choices[0]?.message?.content || 'No response content',
      model: response.model
    });
  } catch (error) {
    return NextResponse.json({ error: `OpenAI API error: ${(error as Error).message}` }, { status: 500 });
  }
}

async function testAnthropic(apiKey: string, model: string, prompt: string) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key is required' }, { status: 400 });
    }
    
    const anthropic = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
    });
    
    const response = await anthropic.messages.create({
      model: model || 'claude-3-sonnet-20240229',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 50
    });
    
    return NextResponse.json({ 
      message: response.content[0]?.text || 'No response content',
      model: response.model
    });
  } catch (error) {
    return NextResponse.json({ error: `Anthropic API error: ${(error as Error).message}` }, { status: 500 });
  }
}

async function testLlama(apiKey: string, model: string, prompt: string) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: 'LLaMA API key is required' }, { status: 400 });
    }
    
    // This is just a placeholder - in a real implementation, you would
    // have an actual LLaMA API client here
    const response = await fetch(process.env.LLAMA_API_URL || 'https://api.llama-api.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'llama-3-8b-instruct',
        prompt: prompt,
        max_tokens: 50
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.message || 'LLaMA API error' }, { status: 500 });
    }
    
    const data = await response.json();
    
    return NextResponse.json({ 
      message: data.content || 'No response content',
      model: model
    });
  } catch (error) {
    return NextResponse.json({ error: `LLaMA API error: ${(error as Error).message}` }, { status: 500 });
  }
}

async function testLocal(model: string, prompt: string) {
  try {
    const localClient = createLocalLlmClient({
      apiUrl: process.env.LOCAL_LLM_API_URL || 'http://localhost:11434',
      defaultModel: model || process.env.LOCAL_LLM_MODEL || 'llama3'
    });
    
    try {
      const response = await localClient.generate({
        prompt: prompt,
        model: model,
        system: 'You are a helpful assistant. Respond briefly and concisely.',
        max_tokens: 50
      });
      
      return NextResponse.json({ 
        message: response.text || 'No response content',
        model: response.model
      });
    } catch (error) {
      // If first attempt fails with specified model, try with a fallback model
      console.error('Error with primary model, trying fallback:', error);
      
      try {
        const fallbackResponse = await localClient.generate({
          prompt: prompt,
          model: 'phi3', // Try with a smaller model
          system: 'You are a helpful assistant. Respond briefly and concisely.',
          max_tokens: 50
        });
        
        return NextResponse.json({ 
          message: fallbackResponse.text || 'No response content (fallback model)',
          model: 'phi3 (fallback)',
          warning: 'Used fallback model because the specified model failed.'
        });
      } catch (fallbackError) {
        return NextResponse.json({ 
          error: `Local LLM error: ${(fallbackError as Error).message}. Make sure Ollama is running.` 
        }, { status: 500 });
      }
    }
  } catch (error) {
    return NextResponse.json({ 
      error: `Local LLM error: ${(error as Error).message}. Make sure Ollama is running.` 
    }, { status: 500 });
  }
} 