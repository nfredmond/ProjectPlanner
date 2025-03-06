import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { getDemographicData, getProjectDemographics, getDemographicTrends } from '@/lib/integrations/census';

export async function GET(request: NextRequest) {
  // Validate the request
  const { session } = await validateRequest();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const state = searchParams.get('state');
    const county = searchParams.get('county');
    const tract = searchParams.get('tract');
    const zip = searchParams.get('zip');
    const trends = searchParams.get('trends') === 'true';
    const years = searchParams.get('years') ? parseInt(searchParams.get('years') || '5') : 5;
    
    // Check if we have at least a project ID or geographic parameters
    if (!projectId && !state && !county && !tract && !zip) {
      return NextResponse.json(
        { error: 'Missing required parameters. Provide projectId or geographic parameters.' },
        { status: 400 }
      );
    }
    
    // If project ID is provided, get demographics based on project location
    if (projectId) {
      const demographics = await getProjectDemographics(projectId);
      return NextResponse.json(demographics);
    }
    
    // Otherwise, use the provided geographic parameters
    const geography = {
      state: state || undefined,
      county: county || undefined,
      tract: tract || undefined,
      zip: zip || undefined
    };
    
    // Fetch demographic trends if requested
    if (trends) {
      const demographicTrends = await getDemographicTrends(geography, years);
      return NextResponse.json(demographicTrends);
    }
    
    // Otherwise, fetch current demographic data
    const demographics = await getDemographicData(geography);
    return NextResponse.json(demographics);
  } catch (error) {
    console.error('Error fetching census data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch demographic data' },
      { status: 500 }
    );
  }
} 