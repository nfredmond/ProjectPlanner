'use client';

import { createAdminClient } from '@/lib/supabase-client';
import { ModelConfig, ModelStatus } from './ModelTrainer-types';
import { HistoricalProject } from './HistoricalDataCollector';

/**
 * This file contains the data fetching and model training logic for the ModelTrainer component
 */

// Extract features from historical project data
export function extractFeaturesFromProject(project: HistoricalProject) {
  const features = {
    // Project metadata
    title_length: project.title.length,
    description_length: project.description?.length || 0,
    primary_category: project.primary_category,
    
    // Budget and timeline information
    initial_cost_estimate: project.initial_cost_estimate,
    budget_overrun: project.final_cost ? (project.final_cost - project.initial_cost_estimate) / project.initial_cost_estimate : 0,
    duration_days: project.end_date && project.start_date ? 
      Math.round((new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    
    // Project complexity indicators
    community_support_level: project.community_support_level || 0,
    environmental_complexity: project.environmental_complexity || 0,
    technical_complexity: project.technical_complexity || 0,
    political_support: project.political_support || 0,
    regulatory_challenges: project.regulatory_challenges || 0,
    
    // Funding information
    funding_sources_count: project.funding_sources?.length || 0,
    fully_funded: project.funding_success === 'fully_funded' ? 1 : 0,
    
    // Challenge and success factors
    challenges_count: project.challenges?.length || 0,
    success_factors_count: project.success_factors?.length || 0,
    stakeholders_count: project.stakeholders?.length || 0,
    
    // Target variables (what we're trying to predict)
    completed_on_time: project.completion_status === 'completed_on_time' ? 1 : 0,
    completed_at_all: project.completion_status !== 'not_completed' ? 1 : 0,
    stayed_on_budget: project.status === 'on_budget' ? 1 : 0
  };
  
  return features;
}

// Fetch historical project data from the database
export async function fetchHistoricalProjects(agencyId?: string) {
  try {
    const supabase = createAdminClient();
    if (!supabase) return [];
    
    let query = supabase
      .from('historical_projects')
      .select('*');
      
    if (agencyId) {
      query = query.eq('agency_id', agencyId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching historical projects:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in fetchHistoricalProjects:', error);
    return [];
  }
}

// Fetch saved models from the database
export async function fetchSavedModels(agencyId?: string) {
  try {
    const supabase = createAdminClient();
    if (!supabase) return [];
    
    let query = supabase
      .from('ml_models')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (agencyId) {
      query = query.eq('agency_id', agencyId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching saved models:', error);
      return [];
    }
    
    // Map database records to ModelConfig objects
    return (data || []).map((model: any) => ({
      id: model.id,
      name: model.name,
      version: model.version,
      modelType: model.model_type,
      description: model.description,
      features: model.features,
      hyperparameters: model.hyperparameters,
      trainingDataSize: model.training_data_size,
      accuracy: model.accuracy,
      precision: model.precision,
      recall: model.recall,
      f1Score: model.f1_score,
      lastTrained: model.last_trained,
      status: model.status as ModelStatus,
      createdAt: model.created_at,
      updatedAt: model.updated_at
    }));
  } catch (error) {
    console.error('Error in fetchSavedModels:', error);
    return [];
  }
}

// Save model to database
export async function saveModelToDatabase(model: ModelConfig, agencyId?: string) {
  try {
    const supabase = createAdminClient();
    if (!supabase) throw new Error('Supabase client not available');
    
    // Convert from camelCase to snake_case for database
    const dbModel = {
      name: model.name,
      version: model.version,
      model_type: model.modelType,
      description: model.description,
      features: model.features,
      hyperparameters: model.hyperparameters,
      training_data_size: model.trainingDataSize,
      accuracy: model.accuracy,
      precision: model.precision,
      recall: model.recall,
      f1_score: model.f1Score,
      last_trained: model.lastTrained || new Date().toISOString(),
      status: model.status,
      agency_id: agencyId
    };
    
    const { data, error } = await supabase
      .from('ml_models')
      .insert(dbModel)
      .select()
      .single();
      
    if (error) {
      console.error('Error saving model:', error);
      throw error;
    }
    
    return {
      ...model,
      id: data.id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Error in saveModelToDatabase:', error);
    throw error;
  }
}

// Update existing model in database
export async function updateModelInDatabase(model: ModelConfig) {
  try {
    if (!model.id) {
      throw new Error('Model ID is required for update');
    }
    
    const supabase = createAdminClient();
    if (!supabase) throw new Error('Supabase client not available');
    
    // Convert from camelCase to snake_case for database
    const dbModel = {
      name: model.name,
      version: model.version,
      model_type: model.modelType,
      description: model.description,
      features: model.features,
      hyperparameters: model.hyperparameters,
      training_data_size: model.trainingDataSize,
      accuracy: model.accuracy,
      precision: model.precision,
      recall: model.recall,
      f1_score: model.f1Score,
      last_trained: model.lastTrained,
      status: model.status,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('ml_models')
      .update(dbModel)
      .eq('id', model.id);
      
    if (error) {
      console.error('Error updating model:', error);
      throw error;
    }
    
    return {
      ...model,
      updatedAt: dbModel.updated_at
    };
  } catch (error) {
    console.error('Error in updateModelInDatabase:', error);
    throw error;
  }
}

// Simulate model training process
export async function simulateModelTraining(
  projects: HistoricalProject[],
  config: any,
  onProgress: (progress: number) => void
) {
  // Extract features from historical projects
  const features = projects.map(extractFeaturesFromProject);
  
  // Simulate training process with delays
  const totalSteps = 10;
  
  for (let step = 1; step <= totalSteps; step++) {
    // Update progress
    onProgress(step / totalSteps * 100);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate realistic evaluation metrics
  const accuracy = 0.75 + Math.random() * 0.2;
  const precision = 0.7 + Math.random() * 0.25;
  const recall = 0.65 + Math.random() * 0.3;
  const f1Score = 2 * (precision * recall) / (precision + recall);
  
  // Generate confusion matrix (for binary classification)
  const totalSamples = projects.length;
  const truePositives = Math.floor(totalSamples * accuracy * 0.6);
  const falseNegatives = Math.floor(totalSamples * (1 - recall) * 0.3);
  const falsePositives = Math.floor(totalSamples * (1 - precision) * 0.3);
  const trueNegatives = totalSamples - truePositives - falseNegatives - falsePositives;
  
  const confusionMatrix = [
    [truePositives, falseNegatives],
    [falsePositives, trueNegatives]
  ];
  
  // Generate feature importance
  const featureNames = Object.keys(features[0]).filter(f => 
    !['completed_on_time', 'completed_at_all', 'stayed_on_budget'].includes(f)
  );
  
  const featureImportance = featureNames.map(feature => ({
    feature,
    importance: Math.random()
  })).sort((a, b) => b.importance - a.importance);
  
  // Normalize importance values
  const totalImportance = featureImportance.reduce((sum, { importance }) => sum + importance, 0);
  featureImportance.forEach(item => {
    item.importance = item.importance / totalImportance;
  });
  
  // Return evaluation results
  return {
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix,
    featureImportance
  };
} 