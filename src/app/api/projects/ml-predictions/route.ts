import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ProjectScoringResult } from '@/types';

export const dynamic = 'force-dynamic';

// This is a simplified ML model that would be replaced with a more sophisticated one in production
// It simulates ML predictions based on historical project data
function simulateMLPrediction(projects: any[]) {
  // In a real ML implementation, this would use more sophisticated techniques:
  // 1. Linear regression or random forest based on historical project outcomes
  // 2. Feature extraction from project attributes
  // 3. Training on historical funding decisions or project success metrics
  
  const predictions = projects.map(project => {
    // Extract features that might correlate with project success
    const features = {
      // Safety is highly weighted in many funding decisions
      safetyScore: project.score_breakdown?.safety || 0,
      
      // Cost-effectiveness (calculated as total score / cost)
      costEffectiveness: project.cost_estimate 
        ? project.score_total / project.cost_estimate 
        : 0,
      
      // Projects with community support tend to get funded  
      communitySupport: project.metadata?.community_support?.positive_feedback_count || 0,
      
      // Environmental projects are increasingly prioritized
      environmentalScore: project.score_breakdown?.environmental || 0,
      
      // Equity is a major factor in recent transportation funding
      equityScore: project.score_breakdown?.equity || 0,
    };
    
    // Apply simplified "model" weights
    // In a real implementation, these would be learned from data
    const mlScore = (
      (features.safetyScore * 0.25) +
      (features.costEffectiveness * 1000000 * 0.2) + // Scale appropriately 
      (features.communitySupport * 0.15) +
      (features.environmentalScore * 0.2) +
      (features.equityScore * 0.2)
    );
    
    // Normalize to 0-5 scale like other scores
    const normalizedScore = Math.min(5, Math.max(0, mlScore));
    
    // Generate explanations for top factors
    const explanations: string[] = [];
    
    if (features.safetyScore > 3) {
      explanations.push("High safety impact");
    }
    
    if (features.costEffectiveness > 0.000002) { // Arbitrary threshold
      explanations.push("Strong cost-effectiveness ratio");
    }
    
    if (features.communitySupport > 10) {
      explanations.push("Strong community support");
    }
    
    if (features.environmentalScore > 3) {
      explanations.push("Significant environmental benefits");
    }
    
    if (features.equityScore > 3) {
      explanations.push("Strong equity considerations");
    }
    
    return {
      project_id: project.id,
      ml_score: normalizedScore,
      explanations: explanations,
      // Include feature importances for transparency
      feature_importance: {
        safety: features.safetyScore * 0.25 / mlScore,
        cost_effectiveness: features.costEffectiveness * 1000000 * 0.2 / mlScore,
        community_support: features.communitySupport * 0.15 / mlScore,
        environmental: features.environmentalScore * 0.2 / mlScore,
        equity: features.equityScore * 0.2 / mlScore
      }
    };
  });
  
  return predictions;
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user's profile with agency details
    const { data: profile } = await supabase
      .from('profiles')
      .select('*, agencies:agency_id(*)')
      .eq('id', session.user.id)
      .single();
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    // Define query parameters
    const statusFilter = searchParams.getAll('status') || ['active', 'planned'];
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Fetch projects with their full data for ML analysis
    let projectsQuery = supabase
      .from('projects')
      .select(`
        id, 
        title, 
        status, 
        primary_category, 
        cost_estimate, 
        score_total, 
        score_breakdown,
        metadata,
        created_at,
        updated_at
      `)
      .eq('agency_id', profile.agency_id)
      .not('score_total', 'is', null)
      .limit(limit);
      
    // Apply status filters
    if (statusFilter.length > 0) {
      projectsQuery = projectsQuery.in('status', statusFilter);
    }
    
    // Execute query
    const { data: projects, error } = await projectsQuery;
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    // Generate ML predictions
    const predictions = simulateMLPrediction(projects || []);
    
    // Return the predictions
    return NextResponse.json({ 
      predictions,
      model_info: {
        name: "SimplifiedTransportationPrioritizationModel",
        version: "0.1.0",
        description: "A simplified model for predicting project prioritization based on historical patterns",
        features_used: ["safety_score", "cost_effectiveness", "community_support", "environmental_score", "equity_score"]
      }
    });
    
  } catch (error) {
    console.error('Error generating ML predictions:', error);
    return NextResponse.json(
      { error: 'Failed to generate ML predictions' },
      { status: 500 }
    );
  }
} 