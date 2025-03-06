'use client';

import React, { useState, useEffect } from 'react';
import { createAdminClient } from '@/lib/supabase-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Alert,
  AlertDescription,
  AlertTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Progress,
} from '@/components/ui';
import { 
  BrainCircuit, 
  BarChart3, 
  ArrowRight, 
  Check, 
  AlertTriangle, 
  Lightbulb,
  Target,
  BarChart4,
  DollarSign,
  Clock,
  Users,
  FileBarChart
} from 'lucide-react';

// Types for prediction input
export interface PredictionInput {
  title: string;
  description: string;
  primary_category: string;
  estimated_cost: number;
  estimated_duration_months: number;
  community_support_level: number; // 1-5
  environmental_complexity: number; // 1-5
  technical_complexity: number; // 1-5
  political_support: number; // 1-5
  regulatory_challenges: number; // 1-5
  funding_sources: string[];
  stakeholders: string[];
}

// Types for prediction results
export interface PredictionResult {
  success_probability: number;
  funding_success_probability: number;
  on_time_probability: number;
  on_budget_probability: number;
  risk_factors: {
    factor: string;
    impact: number;
    description: string;
  }[];
  recommendations: {
    action: string;
    impact: number;
    description: string;
  }[];
  similar_projects?: {
    id: string;
    title: string;
    similarity: number;
    outcome: string;
  }[];
  confidence_score: number;
}

// Component props
interface ProjectSuccessPredictorProps {
  agencyId?: string;
  onPredictionComplete?: (result: PredictionResult) => void;
  className?: string;
  initialData?: Partial<PredictionInput>;
}

/**
 * ProjectSuccessPredictor component that uses machine learning to predict project success
 * based on historical data and project parameters
 */
export default function ProjectSuccessPredictor({
  agencyId,
  onPredictionComplete,
  className = '',
  initialData
}: ProjectSuccessPredictorProps) {
  const [activeTab, setActiveTab] = useState('input');
  const [predictionInput, setPredictionInput] = useState<PredictionInput>({
    title: '',
    description: '',
    primary_category: 'road',
    estimated_cost: 1000000,
    estimated_duration_months: 12,
    community_support_level: 3,
    environmental_complexity: 3,
    technical_complexity: 3,
    political_support: 3,
    regulatory_challenges: 3,
    funding_sources: [],
    stakeholders: [],
    ...initialData
  });
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([
    'road', 'highway', 'bridge', 'bike', 'pedestrian', 'transit', 'other'
  ]);
  const [modelInfo, setModelInfo] = useState({
    version: '1.0.0',
    lastTrained: 'Not trained yet',
    accuracy: 0,
    trainingDataSize: 0,
    features: []
  });
  
  // Fetch categories and model info on component mount
  useEffect(() => {
    fetchCategories();
    fetchModelInfo();
  }, []);
  
  // Fetch project categories from database
  const fetchCategories = async () => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('project_categories')
        .select('name')
        .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setCategories(data.map(cat => cat.name));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Keep default categories if fetch fails
    }
  };
  
  // Fetch ML model information from database
  const fetchModelInfo = async () => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('ml_models')
        .select('*')
        .eq('name', 'project_success_predictor')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No model found - using default values
          return;
        }
        throw error;
      }
      
      if (data) {
        setModelInfo({
          version: data.version || '1.0.0',
          lastTrained: new Date(data.last_trained_at).toLocaleDateString() || 'Not trained yet',
          accuracy: data.accuracy || 0,
          trainingDataSize: data.training_data_size || 0,
          features: data.features || []
        });
      }
    } catch (err) {
      console.error('Error fetching model info:', err);
      // Keep default values if fetch fails
    }
  };
  
  // Handle input change
  const handleInputChange = (field: keyof PredictionInput, value: any) => {
    setPredictionInput(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Run prediction
  const runPrediction = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate required fields
      if (!predictionInput.title || !predictionInput.primary_category) {
        setError('Title and Project Category are required');
        setIsLoading(false);
        return;
      }
      
      // Call prediction API or local model
      const predictionData = await predictProjectSuccess(predictionInput);
      
      // Set result
      setPredictionResult(predictionData);
      onPredictionComplete?.(predictionData);
      
      // Switch to results tab
      setActiveTab('results');
    } catch (err) {
      console.error('Error during prediction:', err);
      setError('Failed to generate prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mock prediction function - in production would call a real ML API
  const predictProjectSuccess = async (input: PredictionInput): Promise<PredictionResult> => {
    // In a real implementation, this would call a backend API that runs the ML model
    // For this demo, we're generating simulated results
    
    // Wait for a short delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Base success probability factors
    const baseProbability = 0.7; // Starting point
    
    // Factor adjustments (these would be learned by the model)
    const costFactor = Math.max(0, 1 - (input.estimated_cost / 10000000) * 0.1); // Higher cost = lower probability
    const durationFactor = Math.max(0, 1 - (input.estimated_duration_months / 36) * 0.1); // Longer duration = lower probability
    const supportFactor = input.community_support_level * 0.05; // Higher support = higher probability
    const environmentalFactor = (5 - input.environmental_complexity) * 0.03; // Lower complexity = higher probability
    const technicalFactor = (5 - input.technical_complexity) * 0.03; // Lower complexity = higher probability
    const politicalFactor = input.political_support * 0.05; // Higher support = higher probability
    const regulatoryFactor = (5 - input.regulatory_challenges) * 0.03; // Lower challenges = higher probability
    const fundingSourcesFactor = Math.min(input.funding_sources.length * 0.03, 0.15); // More funding sources = higher probability
    
    // Calculate success probability
    let successProbability = baseProbability + costFactor + durationFactor + supportFactor + 
                            environmentalFactor + technicalFactor + politicalFactor + 
                            regulatoryFactor + fundingSourcesFactor;
    
    // Ensure probability is between 0 and 1
    successProbability = Math.max(0, Math.min(1, successProbability));
    
    // Calculate specific outcome probabilities (slightly varied from overall success)
    const fundingSuccessProbability = Math.max(0, Math.min(1, successProbability * (1 + (Math.random() * 0.3 - 0.15))));
    const onTimeProbability = Math.max(0, Math.min(1, successProbability * (1 + (Math.random() * 0.3 - 0.15))));
    const onBudgetProbability = Math.max(0, Math.min(1, successProbability * (1 + (Math.random() * 0.3 - 0.15))));
    
    // Generate risk factors
    const riskFactors = [
      {
        factor: "Environmental Challenges",
        impact: input.environmental_complexity / 5,
        description: "Project faces environmental complexities that may affect timeline and budget."
      },
      {
        factor: "Technical Complexity",
        impact: input.technical_complexity / 5,
        description: "Technical aspects of the project add complexity and potential for delays."
      },
      {
        factor: "Regulatory Hurdles",
        impact: input.regulatory_challenges / 5,
        description: "Regulatory approvals and compliance may impact project timeline."
      },
      {
        factor: "Funding Stability",
        impact: 1 - (fundingSourcesFactor / 0.15),
        description: "Funding sources may not be stable throughout the project duration."
      },
      {
        factor: "Community Support",
        impact: 1 - (input.community_support_level / 5),
        description: "Low community support could create obstacles during implementation."
      }
    ].sort((a, b) => b.impact - a.impact).slice(0, 3); // Only return top 3 risks
    
    // Generate recommendations
    const recommendations = [
      {
        action: "Enhance Stakeholder Engagement",
        impact: 0.15,
        description: "Increase community outreach and stakeholder management efforts."
      },
      {
        action: "Secure Additional Funding Sources",
        impact: 0.12,
        description: "Diversify funding to mitigate financial risks and ensure project continuity."
      },
      {
        action: "Proactive Regulatory Management",
        impact: 0.1,
        description: "Engage early with regulatory bodies to anticipate and address challenges."
      },
      {
        action: "Phased Implementation Approach",
        impact: 0.08,
        description: "Consider breaking the project into smaller phases to reduce complexity."
      },
      {
        action: "Technical Risk Mitigation Plan",
        impact: 0.07,
        description: "Develop a detailed risk management plan for technical challenges."
      }
    ].sort((a, b) => b.impact - a.impact).slice(0, 3); // Only return top 3 recommendations
    
    // Generate similar projects
    const similarProjects = [
      {
        id: "hist-" + Math.floor(Math.random() * 10000),
        title: "Highway 101 Expansion",
        similarity: 0.85,
        outcome: "Completed successfully"
      },
      {
        id: "hist-" + Math.floor(Math.random() * 10000),
        title: "Downtown Transit Hub",
        similarity: 0.72,
        outcome: "Completed with delays"
      },
      {
        id: "hist-" + Math.floor(Math.random() * 10000),
        title: "County Bike Trail Network",
        similarity: 0.68,
        outcome: "Under budget, on time"
      }
    ];
    
    // Calculate confidence score
    const confidenceScore = modelInfo.accuracy * (modelInfo.trainingDataSize > 10 ? 0.8 : 0.5);
    
    return {
      success_probability: successProbability,
      funding_success_probability: fundingSuccessProbability,
      on_time_probability: onTimeProbability,
      on_budget_probability: onBudgetProbability,
      risk_factors: riskFactors,
      recommendations: recommendations,
      similar_projects: similarProjects,
      confidence_score: confidenceScore || 0.6 // Default if no model info
    };
  };
  
  // Rerun prediction when input changes
  const handleRerunPrediction = () => {
    setActiveTab('input');
    setPredictionResult(null);
  };
  
  // Format percentage display
  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };
  
  // Get color class based on probability value
  const getProbabilityColorClass = (value: number): string => {
    if (value >= 0.7) return 'text-green-600';
    if (value >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  // Get progress bar color based on probability value
  const getProgressBarColor = (value: number): string => {
    if (value >= 0.7) return 'bg-green-500';
    if (value >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <Card className={`shadow-sm border ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <BrainCircuit className="h-5 w-5 mr-2 text-blue-500" />
          Project Success Predictor
        </CardTitle>
        <CardDescription>
          AI-powered prediction of project success based on historical data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="input">Project Information</TabsTrigger>
            <TabsTrigger value="results" disabled={!predictionResult}>
              Prediction Results
            </TabsTrigger>
          </TabsList>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <TabsContent value="input">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={predictionInput.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
                    placeholder="Enter project title"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Project Category</Label>
                  <Select
                    value={predictionInput.primary_category}
                    onValueChange={(value: string) => handleInputChange('primary_category', value)}
                  >
                    <SelectTrigger id="category" className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  value={predictionInput.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the project"
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated-cost">Estimated Cost ($)</Label>
                  <Input
                    id="estimated-cost"
                    type="number"
                    min="0"
                    step="10000"
                    value={predictionInput.estimated_cost}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('estimated_cost', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="estimated-duration">Estimated Duration (months)</Label>
                  <Input
                    id="estimated-duration"
                    type="number"
                    min="1"
                    max="60"
                    value={predictionInput.estimated_duration_months}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('estimated_duration_months', parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="funding-sources">Funding Sources</Label>
                <Textarea
                  id="funding-sources"
                  value={predictionInput.funding_sources.join(', ')}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('funding_sources', 
                    e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                  )}
                  placeholder="List funding sources (comma separated)"
                  className="mt-1"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="stakeholders">Key Stakeholders</Label>
                <Textarea
                  id="stakeholders"
                  value={predictionInput.stakeholders.join(', ')}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('stakeholders', 
                    e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                  )}
                  placeholder="List key stakeholders (comma separated)"
                  className="mt-1"
                  rows={2}
                />
              </div>
              
              <div className="border p-4 rounded-md bg-gray-50">
                <h3 className="font-medium mb-3">Project Complexity Factors (1-5)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="community-support" className="flex justify-between">
                      <span>Community Support Level</span>
                      <span className="text-gray-500">{predictionInput.community_support_level}</span>
                    </Label>
                    <Slider
                      id="community-support"
                      min={1}
                      max={5}
                      step={1}
                      value={[predictionInput.community_support_level]}
                      onValueChange={(values: number[]) => handleInputChange('community_support_level', values[0])}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="environmental-complexity" className="flex justify-between">
                      <span>Environmental Complexity</span>
                      <span className="text-gray-500">{predictionInput.environmental_complexity}</span>
                    </Label>
                    <Slider
                      id="environmental-complexity"
                      min={1}
                      max={5}
                      step={1}
                      value={[predictionInput.environmental_complexity]}
                      onValueChange={(values: number[]) => handleInputChange('environmental_complexity', values[0])}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="technical-complexity" className="flex justify-between">
                      <span>Technical Complexity</span>
                      <span className="text-gray-500">{predictionInput.technical_complexity}</span>
                    </Label>
                    <Slider
                      id="technical-complexity"
                      min={1}
                      max={5}
                      step={1}
                      value={[predictionInput.technical_complexity]}
                      onValueChange={(values: number[]) => handleInputChange('technical_complexity', values[0])}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="political-support" className="flex justify-between">
                      <span>Political Support</span>
                      <span className="text-gray-500">{predictionInput.political_support}</span>
                    </Label>
                    <Slider
                      id="political-support"
                      min={1}
                      max={5}
                      step={1}
                      value={[predictionInput.political_support]}
                      onValueChange={(values: number[]) => handleInputChange('political_support', values[0])}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="regulatory-challenges" className="flex justify-between">
                      <span>Regulatory Challenges</span>
                      <span className="text-gray-500">{predictionInput.regulatory_challenges}</span>
                    </Label>
                    <Slider
                      id="regulatory-challenges"
                      min={1}
                      max={5}
                      step={1}
                      value={[predictionInput.regulatory_challenges]}
                      onValueChange={(values: number[]) => handleInputChange('regulatory_challenges', values[0])}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-2 bg-blue-50 p-3 rounded-md text-xs text-blue-700 flex items-start">
                <BrainCircuit className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Model Information</p>
                  <p className="mt-1">
                    This prediction uses a machine learning model trained on 
                    {modelInfo.trainingDataSize > 0 
                      ? ` ${modelInfo.trainingDataSize} historical projects` 
                      : ' sample data'}.
                    {modelInfo.accuracy > 0 && ` Model accuracy: ${(modelInfo.accuracy * 100).toFixed(1)}%`}
                  </p>
                  <p className="mt-1">
                    Version: {modelInfo.version} | Last trained: {modelInfo.lastTrained}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                onClick={runPrediction}
                disabled={isLoading}
                className="flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BrainCircuit className="h-4 w-4 mr-2" />
                    Generate Prediction
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            {predictionResult && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="bg-gray-50 p-4 rounded-md md:w-1/2">
                    <h3 className="text-base font-medium mb-4 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-blue-500" />
                      Overall Success Prediction
                    </h3>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">Success Probability</span>
                        <span className={`text-lg font-bold ${getProbabilityColorClass(predictionResult.success_probability)}`}>
                          {formatPercentage(predictionResult.success_probability)}
                        </span>
                      </div>
                      <Progress 
                        value={predictionResult.success_probability * 100} 
                        className="h-3 bg-gray-200"
                        indicatorClassName={getProgressBarColor(predictionResult.success_probability)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 mt-5">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                            Funding Success
                          </span>
                          <span className={`font-medium ${getProbabilityColorClass(predictionResult.funding_success_probability)}`}>
                            {formatPercentage(predictionResult.funding_success_probability)}
                          </span>
                        </div>
                        <Progress 
                          value={predictionResult.funding_success_probability * 100} 
                          className="h-2 bg-gray-200"
                          indicatorClassName={getProgressBarColor(predictionResult.funding_success_probability)}
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-blue-600" />
                            On-Time Completion
                          </span>
                          <span className={`font-medium ${getProbabilityColorClass(predictionResult.on_time_probability)}`}>
                            {formatPercentage(predictionResult.on_time_probability)}
                          </span>
                        </div>
                        <Progress 
                          value={predictionResult.on_time_probability * 100} 
                          className="h-2 bg-gray-200"
                          indicatorClassName={getProgressBarColor(predictionResult.on_time_probability)}
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-purple-600" />
                            On-Budget Completion
                          </span>
                          <span className={`font-medium ${getProbabilityColorClass(predictionResult.on_budget_probability)}`}>
                            {formatPercentage(predictionResult.on_budget_probability)}
                          </span>
                        </div>
                        <Progress 
                          value={predictionResult.on_budget_probability * 100} 
                          className="h-2 bg-gray-200"
                          indicatorClassName={getProgressBarColor(predictionResult.on_budget_probability)}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-gray-500 flex items-center">
                      <span>Model confidence:</span>
                      <span className="ml-1 font-medium">{(predictionResult.confidence_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="md:w-1/2">
                    <h3 className="text-base font-medium mb-3 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                      Key Risk Factors
                    </h3>
                    
                    <div className="space-y-3">
                      {predictionResult.risk_factors.map((risk, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-md">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{risk.factor}</span>
                            <span className="text-sm text-gray-500">
                              Impact: {(risk.impact * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-3 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                    AI Recommendations
                  </h3>
                  
                  <div className="space-y-3">
                    {predictionResult.recommendations.map((rec, index) => (
                      <div key={index} className="bg-blue-50 p-3 rounded-md border border-blue-100">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-800">{rec.action}</span>
                          <span className="text-sm text-blue-600">
                            Impact: +{(rec.impact * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">{rec.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {predictionResult.similar_projects && predictionResult.similar_projects.length > 0 && (
                  <div>
                    <h3 className="text-base font-medium mb-3 flex items-center">
                      <FileBarChart className="h-5 w-5 mr-2 text-purple-500" />
                      Similar Historical Projects
                    </h3>
                    
                    <div className="space-y-2">
                      {predictionResult.similar_projects.map((project, index) => (
                        <div key={index} className="flex justify-between items-center p-2 border-b last:border-0">
                          <div>
                            <div className="font-medium">{project.title}</div>
                            <div className="text-sm text-gray-500">{project.outcome}</div>
                          </div>
                          <div className="text-sm">
                            Similarity: {(project.similarity * 100).toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleRerunPrediction}
                    variant="outline"
                    className="flex items-center"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Modify Project Details
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 