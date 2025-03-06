import axios from 'axios';

interface CensusOptions {
  year?: number;
  dataset?: string;
  apiKey?: string;
}

interface CensusGeographyParams {
  state?: string;
  county?: string;
  tract?: string;
  blockGroup?: string;
  place?: string;
  zip?: string;
}

interface DemographicDataResult {
  total_population?: number;
  median_age?: number;
  median_household_income?: number;
  poverty_rate?: number;
  race_distribution?: Record<string, number>;
  education_levels?: Record<string, number>;
  transportation_usage?: Record<string, number>;
  housing_stats?: Record<string, number>;
  error?: string;
}

// Default options
const DEFAULT_OPTIONS: CensusOptions = {
  year: new Date().getFullYear() - 2, // Census typically has a 2-year lag
  dataset: 'acs/acs5',  // American Community Survey 5-year estimates
  apiKey: process.env.CENSUS_API_KEY || ''
};

/**
 * Fetches demographic data from the Census API for a specified area
 */
export async function getDemographicData(
  geography: CensusGeographyParams,
  options: CensusOptions = {}
): Promise<DemographicDataResult> {
  try {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    if (!opts.apiKey) {
      console.warn('Census API key not provided. Some endpoints may be rate-limited.');
    }
    
    // Determine the geographic qualifier based on provided params
    let geoParam = '';
    if (geography.zip) {
      geoParam = `zip%20code%20tabulation%20area:${geography.zip}`;
    } else if (geography.tract && geography.county && geography.state) {
      geoParam = `tract:${geography.tract}&in=state:${geography.state}%20county:${geography.county}`;
    } else if (geography.county && geography.state) {
      geoParam = `county:${geography.county}&in=state:${geography.state}`;
    } else if (geography.state) {
      geoParam = `state:${geography.state}`;
    } else if (geography.place) {
      geoParam = `place:${geography.place}`;
    } else {
      return { error: 'Invalid geographic parameters. Provide at least one geographic identifier.' };
    }
    
    // Demographic variables to retrieve
    // See Census API documentation for full list of available variables
    const variables = [
      'B01001_001E', // Total Population
      'B01002_001E', // Median Age
      'B19013_001E', // Median Household Income
      'B17001_002E', // Poverty Count
      // Race & Ethnicity
      'B02001_002E', // White alone
      'B02001_003E', // Black or African American alone
      'B02001_004E', // American Indian and Alaska Native alone
      'B02001_005E', // Asian alone
      'B02001_006E', // Native Hawaiian and Other Pacific Islander alone
      'B02001_007E', // Some other race alone
      'B02001_008E', // Two or more races
      'B03003_003E', // Hispanic or Latino
      // Education
      'B15003_017E', // High school graduate
      'B15003_018E', // Some college, no degree
      'B15003_021E', // Bachelor's degree
      'B15003_022E', // Master's degree
      'B15003_023E', // Professional school degree
      'B15003_024E', // Doctorate degree
      // Transportation to Work
      'B08301_002E', // Car, truck, or van
      'B08301_010E', // Public transportation
      'B08301_016E', // Walked
      'B08301_017E', // Bicycle
      'B08301_018E', // Taxicab, motorcycle, or other means
      'B08301_019E', // Worked from home
      // Housing
      'B25001_001E', // Total housing units
      'B25003_002E', // Owner occupied
      'B25003_003E'  // Renter occupied
    ].join(',');
    
    // Build the API URL
    const baseUrl = `https://api.census.gov/data/${opts.year}/${opts.dataset}`;
    const url = `${baseUrl}?get=${variables}&for=${geoParam}${opts.apiKey ? `&key=${opts.apiKey}` : ''}`;
    
    // Make the API request
    const response = await axios.get(url);
    const data = response.data;
    
    if (!data || !Array.isArray(data) || data.length < 2) {
      return { error: 'Invalid or empty response from Census API' };
    }
    
    // First row contains column names, subsequent rows contain data
    const headers = data[0];
    const values = data[1];
    
    // Extract and convert values from string to number where appropriate
    const getValue = (variableName: string): number | null => {
      const index = headers.indexOf(variableName);
      if (index === -1) return null;
      
      const value = values[index];
      return value === null || value === '' ? null : Number(value);
    };
    
    // Calculate poverty rate
    const totalPopulation = getValue('B01001_001E') || 0;
    const povertyCount = getValue('B17001_002E') || 0;
    const povertyRate = totalPopulation > 0 ? (povertyCount / totalPopulation) * 100 : 0;
    
    // Compile race distribution
    const raceDistribution: Record<string, number> = {
      white: getValue('B02001_002E') || 0,
      black: getValue('B02001_003E') || 0,
      native_american: getValue('B02001_004E') || 0,
      asian: getValue('B02001_005E') || 0,
      pacific_islander: getValue('B02001_006E') || 0,
      other: getValue('B02001_007E') || 0,
      multiracial: getValue('B02001_008E') || 0,
      hispanic: getValue('B03003_003E') || 0
    };
    
    // Compile education levels
    const educationLevels: Record<string, number> = {
      high_school: getValue('B15003_017E') || 0,
      some_college: getValue('B15003_018E') || 0,
      bachelors: getValue('B15003_021E') || 0,
      masters: getValue('B15003_022E') || 0,
      professional: getValue('B15003_023E') || 0,
      doctorate: getValue('B15003_024E') || 0
    };
    
    // Compile transportation usage
    const transportationUsage: Record<string, number> = {
      car_truck_van: getValue('B08301_002E') || 0,
      public_transit: getValue('B08301_010E') || 0,
      walking: getValue('B08301_016E') || 0,
      bicycle: getValue('B08301_017E') || 0,
      other: getValue('B08301_018E') || 0,
      work_from_home: getValue('B08301_019E') || 0
    };
    
    // Compile housing stats
    const housingStats: Record<string, number> = {
      total_units: getValue('B25001_001E') || 0,
      owner_occupied: getValue('B25003_002E') || 0,
      renter_occupied: getValue('B25003_003E') || 0
    };
    
    // Return the compiled demographic data
    return {
      total_population: getValue('B01001_001E') ?? undefined,
      median_age: getValue('B01002_001E') ?? undefined,
      median_household_income: getValue('B19013_001E') ?? undefined,
      poverty_rate: parseFloat(povertyRate.toFixed(2)),
      race_distribution: raceDistribution,
      education_levels: educationLevels,
      transportation_usage: transportationUsage,
      housing_stats: housingStats
    };
  } catch (error) {
    console.error('Error fetching Census data:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error fetching Census data'
    };
  }
}

/**
 * Gets demographic data for a project based on its location
 */
export async function getProjectDemographics(projectId: string): Promise<DemographicDataResult> {
  try {
    // This would typically fetch project location data from your database
    // and then call the Census API with appropriate parameters
    
    // For example, you might have code like:
    // const { data: project } = await supabase
    //   .from('projects')
    //   .select('location_data')
    //   .eq('id', projectId)
    //   .single();
    // 
    // if (!project || !project.location_data) {
    //   return { error: 'Project location data not found' };
    // }
    // 
    // Then extract the relevant geographic parameters based on your data structure
    // const geography = {
    //   state: project.location_data.state_code,
    //   county: project.location_data.county_fips,
    //   tract: project.location_data.census_tract
    // };
    // 
    // return getDemographicData(geography);
    
    // Placeholder implementation - replace with actual integration
    return getDemographicData({ 
      state: '06', // California, for example
      county: '075' // San Francisco, for example
    });
  } catch (error) {
    console.error('Error getting project demographics:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error getting project demographics'
    };
  }
}

/**
 * Fetches demographic impact for a project area with year-over-year comparison
 */
export async function getDemographicTrends(
  geography: CensusGeographyParams,
  yearsToCompare: number = 5
): Promise<Record<string, DemographicDataResult>> {
  const currentYear = new Date().getFullYear() - 2; // Census typically has a 2-year lag
  const results: Record<string, DemographicDataResult> = {};
  
  try {
    for (let i = 0; i < yearsToCompare; i++) {
      const year = currentYear - i;
      if (year < 2010) continue; // ACS5 data starts reliably from 2010
      
      const yearData = await getDemographicData(geography, { year });
      results[year.toString()] = yearData;
    }
    
    return results;
  } catch (error) {
    console.error('Error fetching demographic trends:', error);
    return {
      error: error instanceof Error 
        ? { error: error.message }
        : { error: 'Unknown error fetching demographic trends' }
    } as Record<string, DemographicDataResult>;
  }
} 