import { NextRequest, NextResponse } from 'next/server';
import { validateRequest } from '@/lib/auth';
import { searchCaltransProjects, getCaltransProject, getNearbyProjects } from '@/lib/integrations/caltrans';

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
    const nearby = searchParams.get('nearby') === 'true';
    const latitude = searchParams.get('latitude') ? parseFloat(searchParams.get('latitude') || '0') : undefined;
    const longitude = searchParams.get('longitude') ? parseFloat(searchParams.get('longitude') || '0') : undefined;
    const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius') || '10') : 10;
    const county = searchParams.get('county');
    const district = searchParams.get('district');
    const route = searchParams.get('route');
    const status = searchParams.get('status');
    const phase = searchParams.get('phase');
    const keyword = searchParams.get('keyword');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minCost = searchParams.get('minCost') ? parseFloat(searchParams.get('minCost') || '0') : undefined;
    const maxCost = searchParams.get('maxCost') ? parseFloat(searchParams.get('maxCost') || '0') : undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') || '100') : 100;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') || '0') : 0;
    
    // If a project ID is provided, fetch a single project
    if (projectId) {
      const project = await getCaltransProject(projectId);
      return NextResponse.json(project);
    }
    
    // If nearby flag is set and coordinates are provided, fetch nearby projects
    if (nearby && latitude !== undefined && longitude !== undefined) {
      const nearbyProjects = await getNearbyProjects(
        latitude,
        longitude,
        radius,
        { limit, offset }
      );
      return NextResponse.json(nearbyProjects);
    }
    
    // Otherwise, search for projects based on provided parameters
    const searchCriteria = {
      county: county || undefined,
      district: district || undefined,
      route: route || undefined,
      status: status || undefined,
      phase: phase || undefined,
      keyword: keyword || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      minCost,
      maxCost
    };
    
    const projects = await searchCaltransProjects(
      searchCriteria,
      { limit, offset }
    );
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching Caltrans data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transportation project data' },
      { status: 500 }
    );
  }
} 