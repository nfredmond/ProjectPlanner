import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-client';
import { getLlmResponse } from '@/lib/llm/service';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { template_id, variables, purpose, user_id } = body;
    
    if (!template_id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Get template from database
    const supabase = createAdminClient();
    const { data: template, error } = await supabase
      .from('prompt_templates')
      .select('*')
      .eq('id', template_id)
      .single();
    
    if (error || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Apply variables to template
    let processedTemplate = template.template;
    if (variables) {
      Object.entries(variables).forEach(([name, value]) => {
        processedTemplate = processedTemplate.replace(
          new RegExp(`{{${name}}}`, 'g'),
          value as string
        );
      });
    }
    
    // Check if there are any remaining variables
    const remainingVars = processedTemplate.match(/{{([^{}]+)}}/g);
    if (remainingVars) {
      return NextResponse.json(
        { 
          error: 'Missing variables',
          missing: remainingVars.map((v: string) => v.replace(/{{|}}/g, ''))
        },
        { status: 400 }
      );
    }
    
    // Call LLM with the processed template
    const llmResponse = await getLlmResponse({
      prompt: processedTemplate,
      purpose: purpose || template.purpose,
      user_id,
      cache_key: `template_test_${template_id}_${JSON.stringify(variables)}`,
    });
    
    // Log template usage
    await supabase
      .from('prompt_template_usage_logs')
      .insert({
        template_id,
        template_version: template.version,
        user_id,
        variables: variables || {},
        success: true,
        tokens_used: llmResponse.tokens_used,
      });
    
    return NextResponse.json({
      text: llmResponse.text,
      model: llmResponse.model,
      provider: llmResponse.provider,
      tokens_used: llmResponse.tokens_used,
      cached: llmResponse.cached || false,
    });
  } catch (error) {
    console.error('Error testing template:', error);
    return NextResponse.json(
      { error: 'Failed to process template' },
      { status: 500 }
    );
  }
} 