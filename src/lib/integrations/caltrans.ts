import axios from 'axios';

interface CaltransOptions {
  apiKey?: string;
  limit?: number;
  offset?: number;
}

interface CaltransProject {
  id: string;
  title: string;
  description?: string;
  status?: string;
  phase?: string;
  county?: string;
  district?: string;
  route?: string;
  start_date?: string;
  end_date?: string;
  cost?: number;
  funding_source?: string[];
  project_manager?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    postmile_start?: string;
    postmile_end?: string;
  };
  documents?: Array<{
    id: string;
    title: string;
    url: string;
    type: string;
    date: string;
  }>;
}

interface CaltransSearchParams {
  county?: string;
  district?: string;
  route?: string;
  status?: string;
  phase?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  minCost?: number;
  maxCost?: number;
}

interface CaltransResponse {
  projects: CaltransProject[];
  total: number;
  offset: number;
  limit: number;
  error?: string;
}

// Default options
const DEFAULT_OPTIONS: CaltransOptions = {
  apiKey: process.env.CALTRANS_API_KEY || '',
  limit: 100,
  offset: 0
};

/**
 * Fetches projects from the Caltrans API based on search parameters
 */
export async function searchCaltransProjects(
  params: CaltransSearchParams,
  options: CaltransOptions = {}
): Promise<CaltransResponse> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Note: This is a simulated API endpoint - replace with the actual Caltrans API endpoint
    // when available. Currently, Caltrans doesn't have a public API for projects,
    // but this code structure would work with a real API.
    const baseUrl = 'https://data.ca.gov/api/3/action/datastore_search';
    
    // Prepare query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('resource_id', 'c304b40d-c15d-4a0e-b4ab-94d0a069364f'); // Caltrans projects resource
    queryParams.append('limit', opts.limit?.toString() || '100');
    queryParams.append('offset', opts.offset?.toString() || '0');
    
    // Build filter query
    const filters: Record<string, any> = {};
    if (params.county) filters.county = params.county;
    if (params.district) filters.district = params.district;
    if (params.route) filters.route = params.route;
    if (params.status) filters.status = params.status;
    if (params.phase) filters.phase = params.phase;
    if (params.keyword) filters.description = { $like: `%${params.keyword}%` };
    if (params.startDate) filters.start_date = { $gte: params.startDate };
    if (params.endDate) filters.end_date = { $lte: params.endDate };
    if (params.minCost) filters.cost = { $gte: params.minCost };
    if (params.maxCost) filters.cost = { ...filters.cost, $lte: params.maxCost };
    
    if (Object.keys(filters).length > 0) {
      queryParams.append('filters', JSON.stringify(filters));
    }
    
    // Add API key if available
    if (opts.apiKey) {
      queryParams.append('api_key', opts.apiKey);
    }
    
    // Make the API request
    const url = `${baseUrl}?${queryParams.toString()}`;
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data || !data.result || !data.result.records) {
      return { 
        projects: [],
        total: 0,
        offset: opts.offset || 0,
        limit: opts.limit || 100,
        error: 'Invalid or empty response from Caltrans API'
      };
    }
    
    // Transform the data to our internal format
    const projects = data.result.records.map((record: any) => ({
      id: record.id || record._id,
      title: record.title || 'Untitled Project',
      description: record.description,
      status: record.status,
      phase: record.phase,
      county: record.county,
      district: record.district,
      route: record.route,
      start_date: record.start_date,
      end_date: record.end_date,
      cost: parseFloat(record.cost) || undefined,
      funding_source: record.funding_source 
        ? (typeof record.funding_source === 'string' ? [record.funding_source] : record.funding_source)
        : [],
      project_manager: record.project_manager,
      location: {
        latitude: record.latitude !== undefined ? parseFloat(record.latitude) : undefined,
        longitude: record.longitude !== undefined ? parseFloat(record.longitude) : undefined,
        postmile_start: record.postmile_start,
        postmile_end: record.postmile_end
      },
      documents: (record.documents || []).map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        url: doc.url,
        type: doc.type,
        date: doc.date
      }))
    }));
    
    return {
      projects,
      total: data.result.total || projects.length,
      offset: opts.offset || 0,
      limit: opts.limit || 100
    };
  } catch (error) {
    console.error('Error fetching Caltrans projects:', error);
    return {
      projects: [],
      total: 0,
      offset: options.offset || 0,
      limit: options.limit || 100,
      error: error instanceof Error ? error.message : 'Unknown error fetching Caltrans projects'
    };
  }
}

/**
 * Fetches a single project from the Caltrans API by ID
 */
export async function getCaltransProject(
  projectId: string,
  options: CaltransOptions = {}
): Promise<CaltransProject | { error: string }> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Note: This is a simulated API endpoint - replace with the actual Caltrans API endpoint
    const baseUrl = 'https://data.ca.gov/api/3/action/datastore_search';
    
    // Prepare query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('resource_id', 'c304b40d-c15d-4a0e-b4ab-94d0a069364f'); // Caltrans projects resource
    queryParams.append('filters', JSON.stringify({ id: projectId }));
    
    // Add API key if available
    if (opts.apiKey) {
      queryParams.append('api_key', opts.apiKey);
    }
    
    // Make the API request
    const url = `${baseUrl}?${queryParams.toString()}`;
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data || !data.result || !data.result.records || data.result.records.length === 0) {
      return { error: 'Project not found' };
    }
    
    // Transform the data to our internal format
    const record = data.result.records[0];
    return {
      id: record.id || record._id,
      title: record.title || 'Untitled Project',
      description: record.description,
      status: record.status,
      phase: record.phase,
      county: record.county,
      district: record.district,
      route: record.route,
      start_date: record.start_date,
      end_date: record.end_date,
      cost: parseFloat(record.cost) || undefined,
      funding_source: record.funding_source 
        ? (typeof record.funding_source === 'string' ? [record.funding_source] : record.funding_source)
        : [],
      project_manager: record.project_manager,
      location: {
        latitude: record.latitude !== undefined ? parseFloat(record.latitude) : undefined,
        longitude: record.longitude !== undefined ? parseFloat(record.longitude) : undefined,
        postmile_start: record.postmile_start,
        postmile_end: record.postmile_end
      },
      documents: (record.documents || []).map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        url: doc.url,
        type: doc.type,
        date: doc.date
      }))
    };
  } catch (error) {
    console.error('Error fetching Caltrans project:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error fetching Caltrans project'
    };
  }
}

/**
 * Fetches nearby projects from the Caltrans API based on location
 */
export async function getNearbyProjects(
  latitude: number,
  longitude: number,
  radiusMiles: number = 10,
  options: CaltransOptions = {}
): Promise<CaltransResponse> {
  try {
    // Note: This is a simulated function - Caltrans API might not support 
    // geospatial queries directly. In a real implementation, you might need
    // to fetch all projects and filter them by distance client-side.
    
    // For demonstration purposes, we're using the search function with county
    // This is a simplified approach - a real implementation would use 
    // more accurate geospatial queries
    
    // Convert lat/long to a county (this would require a geocoding step in a real implementation)
    const county = await getCountyFromCoordinates(latitude, longitude);
    
    if (!county) {
      return {
        projects: [],
        total: 0,
        offset: options.offset || 0,
        limit: options.limit || 100,
        error: 'Could not determine county from coordinates'
      };
    }
    
    // Search for projects in that county
    return searchCaltransProjects({ county }, options);
  } catch (error) {
    console.error('Error fetching nearby Caltrans projects:', error);
    return {
      projects: [],
      total: 0,
      offset: options.offset || 0,
      limit: options.limit || 100,
      error: error instanceof Error ? error.message : 'Unknown error fetching nearby projects'
    };
  }
}

/**
 * Helper function to convert latitude/longitude to a county name
 * In a real implementation, this would use a geocoding service
 */
async function getCountyFromCoordinates(
  latitude: number,
  longitude: number
): Promise<string | null> {
  try {
    // This is a placeholder - in a real implementation, you would use
    // a geocoding service like Google Maps API, Mapbox, or similar
    
    // Example:
    // const response = await axios.get(
    //   `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    // );
    // 
    // Parse the response to find the county
    // const county = parseCountyFromGeocodingResponse(response.data);
    
    // For now, we'll return a hardcoded county based on coordinates
    // This is just for demonstration purposes
    if (latitude > 38.5 && longitude < -121.5) {
      return 'Sacramento';
    } else if (latitude > 37.5 && longitude < -122.5) {
      return 'San Francisco';
    } else if (latitude > 34.0 && longitude < -118.0) {
      return 'Los Angeles';
    } else if (latitude > 32.5 && longitude < -117.0) {
      return 'San Diego';
    } else {
      return 'Alameda'; // Default fallback
    }
  } catch (error) {
    console.error('Error determining county from coordinates:', error);
    return null;
  }
} 