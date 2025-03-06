import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { getAvailableModelConfigs } from '@/lib/llm/model-config';

export async function GET(request: NextRequest) {
  try {
    // Validate the request
    const { session } = await validateRequest();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all available models
    const models = await getAvailableModelConfigs();
    
    // Sort models by provider and name
    const sortedModels = [...models].sort((a, b) => {
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider);
      }
      return a.name.localeCompare(b.name);
    });
    
    return NextResponse.json({ 
      models: sortedModels,
      count: sortedModels.length
    });
  } catch (error) {
    console.error('Error retrieving models:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve models' },
      { status: 500 }
    );
  }
} 