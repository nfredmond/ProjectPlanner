// Model types and configurations
import { HistoricalProject } from './HistoricalDataCollector';

export interface ModelConfig {
  id?: string;
  name: string;
  version: string;
  modelType: ModelType;
  description: string;
  features: string[];
  hyperparameters: Record<string, any>;
  trainingDataSize: number;
  accuracy?: number;
  precision?: number; 
  recall?: number;
  f1Score?: number;
  lastTrained?: string;
  status: ModelStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type ModelType = 
  | 'logistic_regression'
  | 'random_forest'
  | 'gradient_boosting'
  | 'neural_network'
  | 'support_vector_machine';

export type ModelStatus =
  | 'training'
  | 'ready'
  | 'failed'
  | 'deprecated';

// Training config interface
export interface TrainingConfig {
  testSplitRatio: number;
  crossValidationFolds: number;
  balanceClasses: boolean;
  hyperparameterTuning: boolean;
  featureSelection: boolean;
  modelType: ModelType;
  customHyperparameters: Record<string, any>;
  includeFeatures: string[];
}

export interface TrainingConfigurationProps {
  config: TrainingConfig;
  onConfigChange: (config: TrainingConfig) => void;
  availableFeatures: string[];
  isTraining: boolean;
  onStartTraining: () => void;
  trainingProgress: number;
  trainingStatus: 'idle' | 'training' | 'success' | 'error';
  trainingError: string | null;
}

export interface ModelEvaluationProps {
  evaluationResults: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][];
    featureImportance: {feature: string, importance: number}[];
  } | null;
  modelConfig: ModelConfig | null;
  onSaveModel: () => void;
  isSaving: boolean;
}

export interface ModelVersioningProps {
  savedModels: ModelConfig[];
  activeModel: ModelConfig | null;
  onSelectModel: (model: ModelConfig) => void;
  onDeleteModel: (modelId: string) => void;
  onExportModel: (model: ModelConfig) => void;
  isLoading: boolean;
}

export interface ModelTrainerProps {
  agencyId?: string;
  onModelTrained?: (model: ModelConfig) => void;
  className?: string;
  initialConfig?: Partial<TrainingConfig>;
}

// Default training configuration
export const DEFAULT_TRAINING_CONFIG: TrainingConfig = {
  testSplitRatio: 0.2,
  crossValidationFolds: 5,
  balanceClasses: true,
  hyperparameterTuning: true,
  featureSelection: true,
  modelType: 'random_forest',
  customHyperparameters: {},
  includeFeatures: []
}; 