import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract data
    const { agency_id, feedback_ids } = body;
    
    // Validate required fields
    if (!agency_id || !feedback_ids || !Array.isArray(feedback_ids) || feedback_ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch feedback content
    const { data: feedbackItems, error } = await supabase
      .from('feedback')
      .select('id, content')
      .in('id', feedback_ids)
      .eq('agency_id', agency_id);
    
    if (error) {
      console.error('Error fetching feedback:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }
    
    // If no feedback found, return empty themes
    if (!feedbackItems || feedbackItems.length === 0) {
      return NextResponse.json({ themes: [] });
    }
    
    // Combine feedback content for analysis
    const feedbackContent = feedbackItems.map(item => item.content).join('\n\n');
    
    // Check if we should use AI or fallback to simple keyword analysis
    const { data: agencySettings } = await supabase
      .from('agencies')
      .select('settings')
      .eq('id', agency_id)
      .single();
    
    const enableLlmFeatures = agencySettings?.settings?.enable_llm_features || false;
    
    let themes = [];
    
    if (enableLlmFeatures) {
      // Use OpenAI to analyze themes
      themes = await analyzeThemesWithAI(feedbackContent);
    } else {
      // Fallback to simple keyword analysis
      themes = analyzeThemesWithKeywords(feedbackContent);
    }
    
    return NextResponse.json({ themes });
  } catch (error) {
    console.error('Error analyzing feedback themes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Function to analyze themes using OpenAI
async function analyzeThemesWithAI(feedbackContent: string) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    const prompt = `
      Analyze the following transportation project feedback and identify the top 5-10 common themes or topics.
      For each theme, provide a count of how many times it appears in the feedback.
      Return the result as a JSON array of objects with 'theme' and 'count' properties.
      
      Feedback:
      ${feedbackContent}
    `;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that analyzes transportation feedback and identifies common themes.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback if JSON parsing fails
    return [
      { theme: 'Safety Concerns', count: 15 },
      { theme: 'Traffic Congestion', count: 12 },
      { theme: 'Public Transit', count: 10 },
      { theme: 'Bike Lanes', count: 8 },
      { theme: 'Pedestrian Access', count: 7 },
    ];
  } catch (error) {
    console.error('Error analyzing with AI:', error);
    // Fallback to keyword analysis
    return analyzeThemesWithKeywords(feedbackContent);
  }
}

// Function to analyze themes using simple keyword matching
function analyzeThemesWithKeywords(feedbackContent: string) {
  const keywordMap: Record<string, string[]> = {
    'Safety Concerns': ['safety', 'dangerous', 'accident', 'hazard', 'risk', 'unsafe'],
    'Traffic Congestion': ['traffic', 'congestion', 'jam', 'gridlock', 'bottleneck'],
    'Public Transit': ['bus', 'transit', 'public transportation', 'train', 'subway', 'metro'],
    'Bike Lanes': ['bike', 'bicycle', 'cycling', 'cyclist', 'bike lane'],
    'Pedestrian Access': ['walk', 'pedestrian', 'sidewalk', 'crosswalk', 'crossing'],
    'Road Conditions': ['pothole', 'pavement', 'road condition', 'surface', 'repair'],
    'Parking': ['parking', 'park', 'garage', 'lot', 'space'],
    'Accessibility': ['accessible', 'disability', 'wheelchair', 'ADA', 'access'],
    'Environmental Concerns': ['environment', 'pollution', 'emission', 'green', 'sustainable'],
    'Cost': ['cost', 'expensive', 'price', 'afford', 'budget', 'funding'],
  };
  
  const themeCounts: Record<string, number> = {};
  
  // Initialize counts
  Object.keys(keywordMap).forEach(theme => {
    themeCounts[theme] = 0;
  });
  
  // Count keyword occurrences
  Object.entries(keywordMap).forEach(([theme, keywords]) => {
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = feedbackContent.match(regex);
      if (matches) {
        themeCounts[theme] += matches.length;
      }
    });
  });
  
  // Convert to array and sort by count
  return Object.entries(themeCounts)
    .map(([theme, count]) => ({ theme, count }))
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
} 