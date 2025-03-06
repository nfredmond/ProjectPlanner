import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getCachedDemographicData } from '@/lib/api/census-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get the project ID from the URL params
    const projectId = params.id;
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    // Get the authenticated user
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the project data to get coordinates
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Extract coordinates from project geometry
    // This depends on how you're storing geometry - if using PostGIS, you'd do something like:
    let latitude, longitude;
    
    if (project.geom) {
      // If it's a PostGIS point, extract coordinates
      // This is a simplified approach - actual implementation depends on your schema
      try {
        // For PostGIS point stored as JSON
        if (typeof project.geom === 'object' && project.geom.coordinates) {
          [longitude, latitude] = project.geom.coordinates;
        } 
        // If it's a string representation of a point geometry
        else if (typeof project.geom === 'string' && project.geom.includes('POINT')) {
          const match = project.geom.match(/POINT\(([^ ]+) ([^)]+)\)/);
          if (match) {
            longitude = parseFloat(match[1]);
            latitude = parseFloat(match[2]);
          }
        }
        // Fallback to separate lat/lng fields if they exist
        else if (project.latitude !== undefined && project.longitude !== undefined) {
          latitude = project.latitude;
          longitude = project.longitude;
        }
      } catch (e) {
        console.error('Error parsing geometry:', e);
      }
    } else if (project.latitude !== undefined && project.longitude !== undefined) {
      // If stored as separate columns
      latitude = project.latitude;
      longitude = project.longitude;
    }

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Project location data unavailable' }, { status: 400 });
    }

    // Get radius from query param or use default
    const url = new URL(request.url);
    const radius = parseFloat(url.searchParams.get('radius') || '1');
    
    // Get the demographic data from the Census API via our service
    const demographicData = await getCachedDemographicData(
      projectId,
      latitude,
      longitude,
      radius
    );

    return NextResponse.json(demographicData);
    
  } catch (error) {
    console.error('Error fetching project demographics:', error);
    return NextResponse.json({ error: 'Failed to fetch demographic data' }, { status: 500 });
  }
} 