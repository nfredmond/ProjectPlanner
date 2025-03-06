'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase-client';

// Import types and components from separate files
import { 
  ModelConfig, 
  TrainingConfig,
  DEFAULT_TRAINING_CONFIG,
  ModelTrainerProps
} from './ModelTrainer-types';

import {
  fetchHistoricalProjects,
  fetchSavedModels,
  saveModelToDatabase,
  updateModelInDatabase,
  simulateModelTraining,
  extractFeaturesFromProject
} from './ModelTrainer-data';

import { TrainingConfiguration } from './ModelTrainer-training';
import { ModelEvaluation, ModelVersioning } from './ModelTrainer-evaluation';
import { HistoricalProject } from './HistoricalDataCollector';

/**
 * ModelTrainer component for training and managing machine learning models
 * for project success prediction.
 */
export default function ModelTrainer({
  agencyId,
  onModelTrained,
  className = '',
  initialConfig,
}: ModelTrainerProps) {
  const router = useRouter();
  
  // State for historical project data
  const [historicalProjects, setHistoricalProjects] = useState<HistoricalProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  
  // State for saved models
  const [savedModels, setSavedModels] = useState<ModelConfig[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelsError, setModelsError] = useState<string | null>(null);
  
  // State for training configuration
  const [trainingConfig, setTrainingConfig] = useState<TrainingConfig>({
    ...DEFAULT_TRAINING_CONFIG,
    ...initialConfig
  });
  
  // State for training process
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'success' | 'error'>('idle');
  const [trainingError, setTrainingError] = useState<string | null>(null);
  
  // State for evaluation results
  const [evaluationResults, setEvaluationResults] = useState<any>(null);
  
  // State for model management
  const [activeModel, setActiveModel] = useState<ModelConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Extract available features from historical projects
  const availableFeatures = useMemo(() => {
    if (historicalProjects.length === 0) return [];
    
    // Extract features from the first project as an example
    const sampleFeatures = extractFeaturesFromProject(historicalProjects[0]);
    return Object.keys(sampleFeatures).filter(f => 
      !['completed_on_time', 'completed_at_all', 'stayed_on_budget'].includes(f)
    );
  }, [historicalProjects]);
  
  // Load historical projects from the database
  const loadHistoricalProjects = useCallback(async () => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('historical_projects')
        .select('*');
      
      if (error) {
        console.error('Error loading historical projects:', error);
        return;
      }
      
      setHistoricalProjects(data as HistoricalProject[]);
    } catch (error) {
      console.error('Error in loadHistoricalProjects:', error);
    }
  }, []);
  
  // Load saved models from the database
  const loadSavedModels = useCallback(async () => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('ml_models')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading saved models:', error);
        return;
      }
      
      setSavedModels(data as ModelConfig[]);
    } catch (error) {
      console.error('Error in loadSavedModels:', error);
    }
  }, []);
  
  // Load historical projects and saved models on component mount
  useEffect(() => {
    loadHistoricalProjects();
    loadSavedModels();
  }, [agencyId, loadHistoricalProjects, loadSavedModels]);
  
  // Update training configuration
  const handleConfigChange = (newConfig: TrainingConfig) => {
    setTrainingConfig(newConfig);
  };
  
  // Start the model training process
  const startTraining = async () => {
    if (historicalProjects.length === 0) {
      setTrainingError('No historical project data available for training');
      setTrainingStatus('error');
      return;
    }
    
    if (trainingConfig.includeFeatures.length === 0) {
      setTrainingError('Please select at least one feature for training');
      setTrainingStatus('error');
      return;
    }
    
    setIsTraining(true);
    setTrainingProgress(0);
    setTrainingStatus('training');
    setTrainingError(null);
    setEvaluationResults(null);
    
    try {
      // Simulate model training process
      const results = await simulateModelTraining(
        historicalProjects,
        trainingConfig,
        (progress) => setTrainingProgress(progress)
      );
      
      // Create model configuration
      const newModel: ModelConfig = {
        name: `Project Success Model`,
        version: `1.0.${savedModels.length + 1}`,
        modelType: trainingConfig.modelType,
        description: `Trained on ${historicalProjects.length} historical projects with ${trainingConfig.includeFeatures.length} features`,
        features: trainingConfig.includeFeatures,
        hyperparameters: trainingConfig.customHyperparameters,
        trainingDataSize: historicalProjects.length,
        accuracy: results.accuracy,
        precision: results.precision,
        recall: results.recall,
        f1Score: results.f1Score,
        lastTrained: new Date().toISOString(),
        status: 'ready'
      };
      
      setActiveModel(newModel);
      setEvaluationResults(results);
      setTrainingStatus('success');
      
      // Notify parent component if callback provided
      if (onModelTrained) {
        onModelTrained(newModel);
      }
    } catch (error) {
      console.error('Error training model:', error);
      setTrainingError('An error occurred during model training');
      setTrainingStatus('error');
    } finally {
      setIsTraining(false);
    }
  };
  
  // Save the trained model to the database
  const saveModel = async () => {
    if (!activeModel) return;
    
    setIsSaving(true);
    
    try {
      const savedModel = await saveModelToDatabase(activeModel, agencyId);
      
      // Update the saved models list
      setSavedModels([savedModel, ...savedModels]);
      
      // Update the active model with the saved ID
      setActiveModel(savedModel);
    } catch (error) {
      console.error('Error saving model:', error);
      // Show error message
    } finally {
      setIsSaving(false);
    }
  };
  
  // Select a saved model
  const selectModel = (model: ModelConfig) => {
    setActiveModel(model);
  };
  
  // Delete a saved model
  const deleteModel = async (modelId: string) => {
    // Implementation would depend on your backend
    // For now, just remove from the local state
    setSavedModels(savedModels.filter(model => model.id !== modelId));
    
    if (activeModel?.id === modelId) {
      setActiveModel(null);
    }
  };
  
  // Export a model to JSON
  const exportModel = (model: ModelConfig) => {
    const modelJson = JSON.stringify(model, null, 2);
    const blob = new Blob([modelJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${model.name.replace(/\s+/g, '_')}_v${model.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Import a model from JSON
  const importModel = () => {
    // This would be implemented with a file input
    // For now, just a placeholder
    console.log('Import model functionality would be implemented here');
  };
  
  // Show error if no historical data is available
  if (!isLoadingProjects && historicalProjects.length === 0) {
    return (
      <div className={className}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Historical Data</AlertTitle>
          <AlertDescription>
            You need historical project data to train a model. Please add historical projects first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className={className}>
      <Tabs defaultValue="training">
        <TabsList className="mb-4">
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
          <TabsTrigger value="models">Saved Models</TabsTrigger>
        </TabsList>
        
        <TabsContent value="training">
          <TrainingConfiguration
            config={trainingConfig}
            onConfigChange={handleConfigChange}
            availableFeatures={availableFeatures}
            isTraining={isTraining}
            onStartTraining={startTraining}
            trainingProgress={trainingProgress}
            trainingStatus={trainingStatus}
            trainingError={trainingError}
          />
        </TabsContent>
        
        <TabsContent value="evaluation">
          <ModelEvaluation
            evaluationResults={evaluationResults}
            modelConfig={activeModel}
            onSaveModel={saveModel}
            isSaving={isSaving}
          />
        </TabsContent>
        
        <TabsContent value="models">
          <ModelVersioning
            savedModels={savedModels}
            activeModel={activeModel}
            onSelectModel={selectModel}
            onDeleteModel={deleteModel}
            onExportModel={exportModel}
            isLoading={isLoadingModels}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 