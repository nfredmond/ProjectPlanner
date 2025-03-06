import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const provider = searchParams.get('provider');
  const integrationId = searchParams.get('integration_id');
  const isTest = searchParams.get('test') === 'true';
  
  // Create Supabase client
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('agency_id, roles')
      .eq('id', session.user.id)
      .single();
      
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    // Get the integration if an ID was provided
    let integration = null;
    if (integrationId) {
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('agency_id', profile.agency_id)
        .single();
        
      integration = data;
      
      if (!integration) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
      }
      
      // Update usage stats if this is not a test
      if (!isTest) {
        await supabase
          .from('integrations')
          .update({
            usage_count: (integration.usage_count || 0) + 1,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', integration.id);
      }
    }
    
    // Return a mock response based on the provider
    let mockResponse: any = {
      success: true,
      message: 'Test successful',
      provider: provider || integration?.provider || 'unknown',
      timestamp: new Date().toISOString()
    };
    
    // Add provider-specific mock data
    switch (provider || integration?.provider) {
      case 'census':
        mockResponse.data = {
          state: '06',
          county: '075',
          population: 874961,
          median_income: 119136,
          demographics: {
            white: 0.47,
            black: 0.02,
            hispanic: 0.25,
            asian: 0.38,
            other: 0.08
          }
        };
        break;
        
      case 'caltrans':
        mockResponse.data = {
          projects: [
            {
              id: 'CT-2023-001',
              name: 'Highway 101 Expansion',
              status: 'In Progress',
              budget: 12500000,
              start_date: '2023-03-15',
              end_date: '2024-06-30',
              location: {
                latitude: 37.7749,
                longitude: -122.4194
              }
            }
          ]
        };
        break;
        
      case 'fhwa':
        mockResponse.data = {
          funding: {
            total: 25000000,
            federal: 15000000,
            state: 7500000,
            local: 2500000
          },
          programs: [
            {
              name: 'Surface Transportation Block Grant',
              allocation: 8500000
            },
            {
              name: 'Highway Safety Improvement Program',
              allocation: 6500000
            }
          ]
        };
        break;
        
      case 'google_maps':
      case 'mapbox':
        mockResponse.data = {
          geocoding: {
            address: '1600 Amphitheatre Parkway, Mountain View, CA',
            coordinates: {
              latitude: 37.4224,
              longitude: -122.0841
            }
          },
          directions: {
            distance: 15.2,
            duration: 25,
            units: 'miles'
          }
        };
        break;
        
      case 'weather':
        mockResponse.data = {
          location: 'San Francisco, CA',
          current: {
            temperature: 62,
            conditions: 'Partly Cloudy',
            humidity: 75,
            wind_speed: 12
          },
          forecast: [
            { day: 'Monday', high: 65, low: 52, conditions: 'Sunny' },
            { day: 'Tuesday', high: 68, low: 54, conditions: 'Clear' },
            { day: 'Wednesday', high: 64, low: 53, conditions: 'Foggy' }
          ]
        };
        break;
        
      default:
        mockResponse.data = {
          message: 'Generic test response',
          random_number: Math.floor(Math.random() * 1000)
        };
    }
    
    return NextResponse.json(mockResponse);
  } catch (error: any) {
    console.error('Error in test integration endpoint:', error);
    
    return NextResponse.json(
      { error: error.message || 'An error occurred during the integration test' },
      { status: 500 }
    );
  }
} 