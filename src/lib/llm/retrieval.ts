/**
 * Retrieval system for finding relevant guidelines and references
 * for project analysis and recommendations.
 */

import { createAdminClient } from '@/lib/supabase-client';

export interface Guideline {
  id: string;
  source: string;
  title: string;
  content: string;
  url?: string;
  relevance: number;
  metadata?: Record<string, any>;
}

/**
 * Retrieve relevant guidelines based on project details and funding programs
 * 
 * @param project The project to retrieve guidelines for
 * @param fundingPrograms Optional funding program IDs to retrieve specific guidelines for
 * @returns Array of relevant guidelines
 */
export async function retrieveRelevantGuidelines(
  project: any,
  fundingPrograms: string[] = []
): Promise<Guideline[]> {
  try {
    const supabase = createAdminClient();
    
    // Start with basic query for guidelines
    let query = supabase
      .from('guidelines')
      .select('*');
    
    // If we have specific funding programs, prioritize those guidelines
    if (fundingPrograms.length > 0) {
      query = query.or(`funding_program.in.(${fundingPrograms.join(',')})`)
    }
    
    // Filter by project category if available
    if (project.primary_category) {
      query = query.or(`categories.cs.{${project.primary_category}}`)
    }
    
    // Execute the query and get results
    const { data, error } = await query.limit(10);
    
    if (error) {
      console.error('Error retrieving guidelines:', error);
      return [];
    }
    
    // If we don't have guidelines table or no results, use fallback examples
    if (!data || data.length === 0) {
      return getFallbackGuidelines(project);
    }
    
    // Calculate relevance score (basic implementation)
    return data.map(guideline => ({
      id: guideline.id,
      source: guideline.source,
      title: guideline.title,
      content: guideline.content,
      url: guideline.url,
      relevance: calculateRelevance(guideline, project),
      metadata: guideline.metadata
    })).sort((a, b) => b.relevance - a.relevance);
  } catch (error) {
    console.error('Error in retrieveRelevantGuidelines:', error);
    return getFallbackGuidelines(project);
  }
}

/**
 * Calculate relevance score between a guideline and project
 * 
 * @param guideline The guideline to calculate relevance for
 * @param project The project to check against
 * @returns Relevance score between 0-100
 */
function calculateRelevance(guideline: any, project: any): number {
  // Basic relevance calculation - this should be enhanced with more sophisticated approach
  // like semantic similarity or keyword matching
  let score = 50; // Base score
  
  // Match on category
  if (project.primary_category && guideline.categories && 
      guideline.categories.includes(project.primary_category)) {
    score += 20;
  }
  
  // Match on keywords
  if (project.description && guideline.keywords) {
    const keywords = Array.isArray(guideline.keywords) 
      ? guideline.keywords 
      : guideline.keywords.split(',').map((k: string) => k.trim());
    
    keywords.forEach((keyword: string) => {
      if (project.description.toLowerCase().includes(keyword.toLowerCase())) {
        score += 5;
      }
    });
  }
  
  // Cap score at 100
  return Math.min(score, 100);
}

/**
 * Get fallback guidelines when database retrieval fails
 * 
 * @param project The project to get fallback guidelines for
 * @returns Array of basic guidelines
 */
function getFallbackGuidelines(project: any): Guideline[] {
  const fallbackGuidelines: Guideline[] = [];
  
  // Basic fallback based on project category
  if (project.primary_category?.toLowerCase().includes('bike') || 
      project.primary_category?.toLowerCase().includes('pedestrian')) {
    fallbackGuidelines.push({
      id: 'aashto-bike',
      source: 'AASHTO',
      title: 'Guide for the Development of Bicycle Facilities',
      content: 'The AASHTO Guide for the Development of Bicycle Facilities provides information on the physical infrastructure needed to support bicycling facilities. The guide presents practitioners with guidance, best practices, and ranges of design values for the development of infrastructure that meets the needs of bicyclists and other highway users.',
      url: 'https://store.transportation.org/Item/CollectionDetail/116',
      relevance: 90
    });
    
    fallbackGuidelines.push({
      id: 'nacto-urban',
      source: 'NACTO',
      title: 'Urban Bikeway Design Guide',
      content: 'The NACTO Urban Bikeway Design Guide provides cities with state-of-the-practice solutions that can help create complete streets that are safe and enjoyable for bicyclists. The designs in this document were developed by cities for cities, with the goal of providing substantive guidance for cities seeking to improve bicycle transportation.',
      url: 'https://nacto.org/publication/urban-bikeway-design-guide/',
      relevance: 85
    });
  }
  
  if (project.primary_category?.toLowerCase().includes('road') || 
      project.primary_category?.toLowerCase().includes('highway')) {
    fallbackGuidelines.push({
      id: 'fhwa-highway',
      source: 'FHWA',
      title: 'Highway Design Standards',
      content: 'The FHWA Highway Design Standards provide guidelines for geometric design, roadside safety, and traffic control devices. Projects must comply with these standards to be eligible for federal funding under most programs.',
      url: 'https://highways.dot.gov/federal-lands/design',
      relevance: 90
    });
  }
  
  if (project.primary_category?.toLowerCase().includes('transit')) {
    fallbackGuidelines.push({
      id: 'fta-transit',
      source: 'FTA',
      title: 'Transit Projects Design Guidelines',
      content: 'The FTA Transit Projects Design Guidelines provide direction on the planning, design, and implementation of transit projects. The guidelines focus on accessibility, safety, and operational efficiency.',
      url: 'https://www.transit.dot.gov/regulations-and-guidance/safety/safety-design-standards',
      relevance: 90
    });
  }
  
  // Add some general transportation guidelines
  fallbackGuidelines.push({
    id: 'ctc-guidelines',
    source: 'California Transportation Commission',
    title: 'Transportation Programming Guidelines',
    content: 'The CTC Transportation Programming Guidelines establish the policies and procedures for the programming and allocation of funds for transportation projects in California. Projects must comply with environmental, accessibility, and safety requirements.',
    url: 'https://catc.ca.gov/programs/transportation-programming',
    relevance: 75
  });
  
  fallbackGuidelines.push({
    id: 'caltrans-hdm',
    source: 'Caltrans',
    title: 'Highway Design Manual',
    content: 'The Caltrans Highway Design Manual (HDM) establishes uniform policies and procedures to carry out highway design functions for the California State Highway System. The manual includes guidelines for safety, accessibility, and environmental considerations.',
    url: 'https://dot.ca.gov/programs/design/manual-highway-design-manual-hdm',
    relevance: 70
  });
  
  return fallbackGuidelines;
} 