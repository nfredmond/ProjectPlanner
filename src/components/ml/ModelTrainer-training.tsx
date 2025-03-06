'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Settings,
  BarChart3,
  AlertCircle,
  Brain,
  RefreshCw,
} from 'lucide-react';
import { TrainingConfig, ModelType, TrainingConfigurationProps } from './ModelTrainer-types';

export function TrainingConfiguration({
  config,
  onConfigChange,
  availableFeatures,
  isTraining,
  onStartTraining,
  trainingProgress,
  trainingStatus,
  trainingError,
}: TrainingConfigurationProps) {
  const updateConfig = (field: keyof TrainingConfig, value: any) => {
    onConfigChange({
      ...config,
      [field]: value
    });
  };
  
  const updateHyperparameter = (param: string, value: any) => {
    onConfigChange({
      ...config,
      customHyperparameters: {
        ...config.customHyperparameters,
        [param]: value
      }
    });
  };
  
  const toggleFeature = (feature: string) => {
    const includeFeatures = [...config.includeFeatures];
    const index = includeFeatures.indexOf(feature);
    
    if (index === -1) {
      includeFeatures.push(feature);
    } else {
      includeFeatures.splice(index, 1);
    }
    
    updateConfig('includeFeatures', includeFeatures);
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="mr-2" size={18} />
            Model Configuration
          </CardTitle>
          <CardDescription>
            Configure your machine learning model for project success prediction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="modelType">Model Type</Label>
            <Select
              disabled={isTraining}
              value={config.modelType}
              onValueChange={(value) => updateConfig('modelType', value as ModelType)}
            >
              <SelectTrigger id="modelType">
                <SelectValue placeholder="Select model type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="logistic_regression">Logistic Regression</SelectItem>
                <SelectItem value="random_forest">Random Forest</SelectItem>
                <SelectItem value="gradient_boosting">Gradient Boosting</SelectItem>
                <SelectItem value="neural_network">Neural Network</SelectItem>
                <SelectItem value="support_vector_machine">Support Vector Machine</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Data Split & Cross Validation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testSplitRatio">Test Split Ratio</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="testSplitRatio"
                  type="number"
                  min={0.1}
                  max={0.5}
                  step={0.05}
                  disabled={isTraining}
                  value={config.testSplitRatio}
                  onChange={(e) => updateConfig('testSplitRatio', parseFloat(e.target.value))}
                />
                <span className="text-sm text-muted-foreground w-12">
                  {Math.round(config.testSplitRatio * 100)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="crossValidationFolds">Cross-Validation Folds</Label>
              <Input
                id="crossValidationFolds"
                type="number"
                min={2}
                max={10}
                step={1}
                disabled={isTraining}
                value={config.crossValidationFolds}
                onChange={(e) => updateConfig('crossValidationFolds', parseInt(e.target.value))}
              />
            </div>
          </div>
          
          {/* Advanced Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium leading-none">Advanced Options</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="balanceClasses">Balance Classes</Label>
                <p className="text-sm text-muted-foreground">
                  Handle imbalanced datasets by weighting or resampling
                </p>
              </div>
              <Switch
                id="balanceClasses"
                disabled={isTraining}
                checked={config.balanceClasses}
                onCheckedChange={(checked) => updateConfig('balanceClasses', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hyperparameterTuning">Hyperparameter Tuning</Label>
                <p className="text-sm text-muted-foreground">
                  Optimize model parameters using grid search
                </p>
              </div>
              <Switch
                id="hyperparameterTuning"
                disabled={isTraining}
                checked={config.hyperparameterTuning}
                onCheckedChange={(checked) => updateConfig('hyperparameterTuning', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="featureSelection">Feature Selection</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically select most important features
                </p>
              </div>
              <Switch
                id="featureSelection"
                disabled={isTraining}
                checked={config.featureSelection}
                onCheckedChange={(checked) => updateConfig('featureSelection', checked)}
              />
            </div>
          </div>
          
          {/* Feature Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium leading-none">Feature Selection</h3>
            <p className="text-sm text-muted-foreground">
              Select which features to include in the model
            </p>
            
            <div className="grid grid-cols-2 gap-2">
              {availableFeatures.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`feature-${feature}`}
                    checked={config.includeFeatures.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                    disabled={isTraining}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor={`feature-${feature}`} className="text-sm font-normal">
                    {feature.replace(/_/g, ' ')}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Custom Hyperparameters */}
          {!config.hyperparameterTuning && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium leading-none">Custom Hyperparameters</h3>
              <p className="text-sm text-muted-foreground">
                Manually set hyperparameters for the selected model
              </p>
              
              {config.modelType === 'random_forest' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="n_estimators">Number of Trees</Label>
                    <Input
                      id="n_estimators"
                      type="number"
                      min={10}
                      max={1000}
                      step={10}
                      disabled={isTraining}
                      value={config.customHyperparameters.n_estimators || 100}
                      onChange={(e) => updateHyperparameter('n_estimators', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_depth">Max Depth</Label>
                    <Input
                      id="max_depth"
                      type="number"
                      min={1}
                      max={100}
                      step={1}
                      disabled={isTraining}
                      value={config.customHyperparameters.max_depth || 10}
                      onChange={(e) => updateHyperparameter('max_depth', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}
              
              {config.modelType === 'gradient_boosting' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="learning_rate">Learning Rate</Label>
                    <Input
                      id="learning_rate"
                      type="number"
                      min={0.001}
                      max={1}
                      step={0.001}
                      disabled={isTraining}
                      value={config.customHyperparameters.learning_rate || 0.1}
                      onChange={(e) => updateHyperparameter('learning_rate', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="n_estimators">Number of Estimators</Label>
                    <Input
                      id="n_estimators"
                      type="number"
                      min={10}
                      max={1000}
                      step={10}
                      disabled={isTraining}
                      value={config.customHyperparameters.n_estimators || 100}
                      onChange={(e) => updateHyperparameter('n_estimators', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}
              
              {config.modelType === 'neural_network' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hidden_layer_sizes">Hidden Layer Sizes</Label>
                    <Input
                      id="hidden_layer_sizes"
                      placeholder="e.g. 100,50,25"
                      disabled={isTraining}
                      value={config.customHyperparameters.hidden_layer_sizes || "100,50"}
                      onChange={(e) => updateHyperparameter('hidden_layer_sizes', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="learning_rate_init">Initial Learning Rate</Label>
                    <Input
                      id="learning_rate_init"
                      type="number"
                      min={0.0001}
                      max={0.1}
                      step={0.0001}
                      disabled={isTraining}
                      value={config.customHyperparameters.learning_rate_init || 0.001}
                      onChange={(e) => updateHyperparameter('learning_rate_init', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              )}
              
              {config.modelType === 'logistic_regression' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="C">Regularization Strength (C)</Label>
                    <Input
                      id="C"
                      type="number"
                      min={0.01}
                      max={10}
                      step={0.01}
                      disabled={isTraining}
                      value={config.customHyperparameters.C || 1.0}
                      onChange={(e) => updateHyperparameter('C', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="penalty">Penalty</Label>
                    <Select
                      disabled={isTraining}
                      value={config.customHyperparameters.penalty || "l2"}
                      onValueChange={(value) => updateHyperparameter('penalty', value)}
                    >
                      <SelectTrigger id="penalty">
                        <SelectValue placeholder="Select penalty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="l1">L1</SelectItem>
                        <SelectItem value="l2">L2</SelectItem>
                        <SelectItem value="elasticnet">ElasticNet</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              
              {config.modelType === 'support_vector_machine' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="C">Regularization Parameter (C)</Label>
                    <Input
                      id="C"
                      type="number"
                      min={0.01}
                      max={100}
                      step={0.01}
                      disabled={isTraining}
                      value={config.customHyperparameters.C || 1.0}
                      onChange={(e) => updateHyperparameter('C', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kernel">Kernel</Label>
                    <Select
                      disabled={isTraining}
                      value={config.customHyperparameters.kernel || "rbf"}
                      onValueChange={(value) => updateHyperparameter('kernel', value)}
                    >
                      <SelectTrigger id="kernel">
                        <SelectValue placeholder="Select kernel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="poly">Polynomial</SelectItem>
                        <SelectItem value="rbf">RBF</SelectItem>
                        <SelectItem value="sigmoid">Sigmoid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={onStartTraining}
            disabled={isTraining || config.includeFeatures.length === 0}
            className="w-full"
          >
            {isTraining ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Training Model...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Train Model
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Training Progress */}
      {isTraining && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base">
              <BarChart3 className="mr-2" size={18} />
              Training Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={trainingProgress} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              Training model with {config.includeFeatures.length} features...
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Error Message */}
      {trainingStatus === 'error' && trainingError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{trainingError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
} 