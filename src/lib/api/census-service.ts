/**
 * Census API Service
 * 
 * This service handles interactions with the U.S. Census Bureau API
 * to fetch demographic data for project areas.
 */

import axios from 'axios';

// Census API base URL
const CENSUS_API_BASE_URL = 'https://api.census.gov/data';

// Census API endpoints
const ENDPOINTS = {
  ACS5: (year: number) => `${CENSUS_API_BASE_URL}/${year}/acs/acs5`,
  ACS1: (year: number) => `${CENSUS_API_BASE_URL}/${year}/acs/acs1`,
  POP_EST: (year: number) => `${CENSUS_API_BASE_URL}/${year}/pep/population`,
};

// Census API variables mapping
const VARIABLES = {
  TOTAL_POPULATION: 'B01003_001E',
  MEDIAN_HOUSEHOLD_INCOME: 'B19013_001E',
  POVERTY_RATE: 'B17001_002E', // Count of people below poverty level
  MINORITY_POPULATION: 'B02001_002E', // White alone population (subtract from total for minority)
  HOUSEHOLDS_WITHOUT_VEHICLE: 'B08201_002E',
  MEDIAN_AGE: 'B01002_001E',
  TOTAL_HOUSING_UNITS: 'B25001_001E',
  RENTER_OCCUPIED_UNITS: 'B25003_003E',
};

/**
 * Fetch demographic data for a specific geography
 * 
 * @param geographyType The type of geography (e.g., 'tract', 'county', 'state')
 * @param geographyIds Array of geography IDs (e.g., FIPS codes)
 * @param variables Array of Census variables to fetch
 * @param year The year for the data
 * @returns Formatted demographic data
 */
export async function fetchDemographicData(
  geographyType: 'tract' | 'county' | 'state' | 'place',
  geographyIds: string[],
  variables: (keyof typeof VARIABLES)[] = Object.keys(VARIABLES) as (keyof typeof VARIABLES)[],
  year: number = new Date().getFullYear() - 2 // Default to 2 years ago as most recent reliable data
): Promise<any> {
  try {
    // Use ACS 5-year estimates for more reliable tract-level data
    const endpoint = ENDPOINTS.ACS5(year);
    
    // Convert variable names to Census codes
    const variableCodes = variables.map(v => VARIABLES[v]);
    
    // Construct the geography parameter
    const geographyParam = geographyType === 'tract' 
      ? `tract:*&in=state:*&in=county:*` 
      : `${geographyType}:${geographyIds.join(',')}`;
    
    // Construct the URL
    const url = `${endpoint}?get=NAME,${variableCodes.join(',')}&for=${geographyParam}`;
    
    console.log('Census API request:', url);
    
    // Make the request
    const response = await axios.get(url);
    
    // Process the response (Census API returns an array with header row and data rows)
    if (!response.data || !Array.isArray(response.data) || response.data.length < 2) {
      throw new Error('Invalid response from Census API');
    }
    
    // Extract header and data rows
    const [headers, ...dataRows] = response.data;
    
    // Map to more usable format
    const formattedData = dataRows.map((row: any) => {
      const result: Record<string, any> = {};
      
      // Map each column to its header
      headers.forEach((header: string, index: number) => {
        // Convert numeric strings to numbers where appropriate
        const value = row[index];
        result[header] = !isNaN(Number(value)) ? Number(value) : value;
      });
      
      return result;
    });
    
    // Filter to only include the requested geographies if specific IDs were provided
    const filteredData = geographyIds.length > 0 && geographyType !== 'tract'
      ? formattedData.filter((d: any) => geographyIds.includes(d[geographyType]))
      : formattedData;
    
    // Transform to more user-friendly format
    return filteredData.map((d: any) => {
      // Create a readable object
      const transformed: Record<string, any> = {
        name: d.NAME,
        geographyType,
        geographyId: d[geographyType],
      };
      
      // Map Census variables to human-readable names
      Object.entries(VARIABLES).forEach(([key, code]) => {
        if (variables.includes(key as keyof typeof VARIABLES) && d[code] !== undefined) {
          transformed[key.toLowerCase()] = d[code];
        }
      });
      
      // Calculate derived metrics
      if (transformed.total_population && d[VARIABLES.MINORITY_POPULATION]) {
        transformed.minority_percentage = 
          (1 - (d[VARIABLES.MINORITY_POPULATION] / transformed.total_population)) * 100;
      }
      
      if (transformed.total_population && d[VARIABLES.POVERTY_RATE]) {
        transformed.poverty_percentage = 
          (d[VARIABLES.POVERTY_RATE] / transformed.total_population) * 100;
      }
      
      return transformed;
    });
  } catch (error) {
    console.error('Error fetching Census data:', error);
    throw new Error('Failed to fetch demographic data from Census API');
  }
}

/**
 * Get demographic data for a project area
 * 
 * @param latitude Project latitude
 * @param longitude Project longitude
 * @param radius Radius in miles to consider (default: 1)
 * @returns Demographic summary for the area
 */
export async function getProjectAreaDemographics(
  latitude: number,
  longitude: number,
  radius: number = 1
): Promise<any> {
  try {
    // First, find the county and tract containing the project
    // This would typically use a geocoding service or a spatial query
    // For demonstration, we're using a mock implementation
    
    // This would be replaced with actual geocoding logic:
    const countyFips = '06075'; // Example: San Francisco County
    const stateFips = countyFips.substring(0, 2); // Extract state FIPS
    const tractFips = '06075020900'; // Example tract in San Francisco
    
    // Fetch county-level data
    const countyData = await fetchDemographicData(
      'county',
      [`${countyFips}`],
      ['TOTAL_POPULATION', 'MEDIAN_HOUSEHOLD_INCOME', 'POVERTY_RATE', 'MINORITY_POPULATION']
    );
    
    // Fetch tract-level data for more detailed analysis
    // In a real implementation, you would fetch all tracts within the radius
    const tractData = await fetchDemographicData(
      'tract',
      [tractFips],
      ['TOTAL_POPULATION', 'MEDIAN_HOUSEHOLD_INCOME', 'POVERTY_RATE', 'MINORITY_POPULATION', 
       'HOUSEHOLDS_WITHOUT_VEHICLE', 'MEDIAN_AGE']
    );
    
    // Determine if area is disadvantaged (simplified definition)
    // In practice, this would use the official disadvantaged community criteria
    const isDisadvantaged = 
      (tractData[0]?.poverty_percentage > 20 || 
       tractData[0]?.median_household_income < 30000 ||
       tractData[0]?.minority_percentage > 70);
    
    return {
      county: countyData[0] || null,
      tract: tractData[0] || null,
      isDisadvantaged,
      projectLocation: {
        latitude,
        longitude,
        radius
      }
    };
  } catch (error) {
    console.error('Error in getProjectAreaDemographics:', error);
    // Return default data if Census API fails
    return {
      error: 'Unable to fetch demographic data',
      projectLocation: {
        latitude,
        longitude,
        radius
      }
    };
  }
}

/**
 * Cache for Census API requests to minimize redundant calls
 */
const cacheStore: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch demographic data with caching
 */
export async function getCachedDemographicData(
  projectId: string, 
  latitude: number, 
  longitude: number, 
  radius: number = 1
): Promise<any> {
  const cacheKey = `${projectId}-${latitude}-${longitude}-${radius}`;
  
  // Check if we have cached data
  if (cacheStore[cacheKey]) {
    const { data, timestamp } = cacheStore[cacheKey];
    const isExpired = Date.now() - timestamp > CACHE_TTL;
    
    // Return cached data if not expired
    if (!isExpired) {
      return data;
    }
  }
  
  // Fetch fresh data
  const data = await getProjectAreaDemographics(latitude, longitude, radius);
  
  // Cache the result
  cacheStore[cacheKey] = {
    data,
    timestamp: Date.now()
  };
  
  return data;
} 