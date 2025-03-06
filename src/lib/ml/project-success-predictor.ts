/**
 * Project Success Predictor
 * 
 * This module provides machine learning functionality to predict
 * the likelihood of a project receiving funding based on historical data.
 * It implements a simplified logistic regression model that can be
 * executed directly in JavaScript.
 */

// Types for project feature input
export interface ProjectFeatures {
  // Core project details
  cost: number;               // Total project cost
  projectType: string;        // Category of project (e.g., 'road', 'transit', 'bike')
  
  // Criteria scores (normalized to 0-1 range)
  safetyScore: number;        // Safety improvement score
  equityScore: number;        // Equity/disadvantaged communities score
  climateScore: number;       // Climate/environmental score
  economicScore: number;      // Economic benefit score
  innovationScore: number;    // Innovation/technology score
  stateOfGoodRepairScore: number; // Maintenance/state of good repair score
  
  // Optional features (provide if available)
  publicSupport?: number;     // Level of public support (0-1)
  congestionReliefScore?: number; // Congestion reduction score (0-1)
  multimodalScore?: number;   // Multi-modal connectivity score (0-1)
  costEffectivenessScore?: number; // Cost-effectiveness score (0-1)
}

// Default model coefficients (typically these would be trained on historical data)
// These are placeholder values that would be replaced by actual trained coefficients
const DEFAULT_MODEL = {
  // Intercept term
  intercept: -2.5,
  
  // Core feature coefficients
  cost: -0.000001,           // Slight negative impact for very expensive projects
  
  // Project type coefficients (relative to default type)
  projectType_road: 0.2,
  projectType_transit: 0.5,  // Transit projects have higher baseline success
  projectType_bike: 0.3,
  projectType_pedestrian: 0.3,
  projectType_multimodal: 0.4,
  projectType_other: 0.0,    // Reference category
  
  // Criteria score coefficients
  safetyScore: 1.8,          // Safety is heavily weighted
  equityScore: 1.5,          // Equity is important
  climateScore: 1.2,         // Climate benefits
  economicScore: 0.8,        // Economic benefits
  innovationScore: 0.6,      // Innovation has moderate impact
  stateOfGoodRepairScore: 1.0, // Maintenance importance
  
  // Optional feature coefficients
  publicSupport: 0.7,        // Community support matters
  congestionReliefScore: 0.9, // Congestion relief
  multimodalScore: 0.5,      // Multi-modal connectivity
  costEffectivenessScore: 1.0 // Cost-effectiveness
};

// Current model version and last updated timestamp
const MODEL_METADATA = {
  version: '0.1.0',
  lastUpdated: '2023-11-01',
  description: 'Initial logistic regression model for project funding success prediction'
};

/**
 * Sigmoid function to convert raw model score to probability (0-1)
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Predict the probability of project funding success
 * 
 * @param features The project features to use for prediction
 * @returns Probability of success (0-1) and confidence information
 */
export function predictProjectSuccess(features: ProjectFeatures): {
  probability: number;
  confidence: 'low' | 'medium' | 'high';
  topFactors: {factor: string, impact: number}[];
  modelVersion: string;
} {
  // Initialize prediction score with intercept
  let score = DEFAULT_MODEL.intercept;
  
  // Track feature contributions for explainability
  const featureContributions: {factor: string, impact: number}[] = [];
  
  // Add contribution from project cost
  if (features.cost !== undefined) {
    // Apply log transformation to handle wide range of costs
    // Normalize to a reasonable range (e.g., in millions)
    const normalizedCost = Math.log(Math.max(features.cost, 10000) / 1000000);
    const costContribution = normalizedCost * DEFAULT_MODEL.cost;
    score += costContribution;
    featureContributions.push({factor: 'Project Cost', impact: costContribution});
  }
  
  // Add contribution from project type
  if (features.projectType) {
    const projectTypeKey = `projectType_${features.projectType.toLowerCase()}`;
    const typeCoefficient = (DEFAULT_MODEL as any)[projectTypeKey] || DEFAULT_MODEL.projectType_other;
    score += typeCoefficient;
    featureContributions.push({factor: 'Project Type', impact: typeCoefficient});
  }
  
  // Add contributions from criteria scores
  const criteriaScores = [
    { key: 'safetyScore', name: 'Safety Score', value: features.safetyScore },
    { key: 'equityScore', name: 'Equity Score', value: features.equityScore },
    { key: 'climateScore', name: 'Climate Score', value: features.climateScore },
    { key: 'economicScore', name: 'Economic Benefit', value: features.economicScore },
    { key: 'innovationScore', name: 'Innovation', value: features.innovationScore },
    { key: 'stateOfGoodRepairScore', name: 'State of Good Repair', value: features.stateOfGoodRepairScore },
    // Optional scores
    { key: 'publicSupport', name: 'Public Support', value: features.publicSupport },
    { key: 'congestionReliefScore', name: 'Congestion Relief', value: features.congestionReliefScore },
    { key: 'multimodalScore', name: 'Multimodal Connectivity', value: features.multimodalScore },
    { key: 'costEffectivenessScore', name: 'Cost Effectiveness', value: features.costEffectivenessScore }
  ];
  
  // Process each score if available
  criteriaScores.forEach(criterion => {
    if (criterion.value !== undefined) {
      const coefficient = (DEFAULT_MODEL as any)[criterion.key];
      if (coefficient) {
        const contribution = criterion.value * coefficient;
        score += contribution;
        featureContributions.push({factor: criterion.name, impact: contribution});
      }
    }
  });
  
  // Convert score to probability using sigmoid function
  const probability = sigmoid(score);
  
  // Sort feature contributions by absolute impact
  featureContributions.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  
  // Determine confidence level based on feature coverage
  // More features = higher confidence
  const totalFeatures = Object.keys(features).filter(k => features[k as keyof ProjectFeatures] !== undefined).length;
  const maxFeatures = 10; // Maximum number of features in our model
  const featureCoverage = totalFeatures / maxFeatures;
  
  let confidence: 'low' | 'medium' | 'high';
  if (featureCoverage < 0.5) {
    confidence = 'low';
  } else if (featureCoverage < 0.8) {
    confidence = 'medium';
  } else {
    confidence = 'high';
  }
  
  return {
    probability,
    confidence,
    topFactors: featureContributions.slice(0, 5), // Return top 5 contributing factors
    modelVersion: MODEL_METADATA.version
  };
}

/**
 * Get explanation of the prediction in natural language
 * 
 * @param prediction The prediction result from predictProjectSuccess
 * @returns Human-readable explanation of the prediction
 */
export function explainPrediction(prediction: ReturnType<typeof predictProjectSuccess>): string {
  const { probability, confidence, topFactors } = prediction;
  
  // Format probability as percentage
  const probabilityPercent = Math.round(probability * 100);
  
  // Create explanation based on prediction probability
  let explanation = `This project has a ${probabilityPercent}% predicted likelihood of receiving funding `;
  explanation += `(${confidence} confidence).\n\n`;
  
  // Add explanation of top factors
  explanation += 'The top factors influencing this prediction are:\n';
  
  topFactors.forEach(factor => {
    const impact = factor.impact > 0 ? 'positive' : 'negative';
    const strengthAdj = Math.abs(factor.impact) > 0.5 ? 'strong' : 'moderate';
    explanation += `- ${factor.factor}: ${strengthAdj} ${impact} influence\n`;
  });
  
  // Add recommendations based on probability
  explanation += '\nRecommendations:\n';
  
  if (probability < 0.3) {
    explanation += '- Consider revising the project to address the negative factors\n';
    explanation += '- Focus on improving the scores for key criteria\n';
    explanation += '- Explore alternative funding sources that may be more suitable\n';
  } else if (probability < 0.7) {
    explanation += '- The project has moderate funding potential\n';
    explanation += '- Consider strengthening the aspects with highest positive influence\n';
    explanation += '- Gather more community support if possible\n';
  } else {
    explanation += '- This project has strong funding potential\n';
    explanation += '- Proceed with grant application process\n';
    explanation += '- Document the strengths identified in this analysis in your application\n';
  }
  
  return explanation;
}

/**
 * Generate a set of recommendations to improve project funding likelihood
 * 
 * @param features The current project features
 * @param prediction The current prediction results
 * @returns Array of specific recommendations to improve funding chances
 */
export function generateImprovedScenarios(
  features: ProjectFeatures,
  prediction: ReturnType<typeof predictProjectSuccess>
): { scenario: string, impact: number, newProbability: number }[] {
  const scenarios: { scenario: string, impact: number, newProbability: number }[] = [];
  const { probability, topFactors } = prediction;
  
  // Find areas with room for improvement
  // Focus on criteria with high coefficients but low current scores
  const criteriaToImprove = [
    { key: 'safetyScore', name: 'Safety', coefficient: DEFAULT_MODEL.safetyScore },
    { key: 'equityScore', name: 'Equity', coefficient: DEFAULT_MODEL.equityScore },
    { key: 'climateScore', name: 'Climate', coefficient: DEFAULT_MODEL.climateScore },
    { key: 'stateOfGoodRepairScore', name: 'State of Good Repair', coefficient: DEFAULT_MODEL.stateOfGoodRepairScore }
  ]
  .filter(criterion => {
    const score = features[criterion.key as keyof ProjectFeatures] as number;
    // Only suggest improvements for scores that are less than 0.8 (on 0-1 scale)
    return score !== undefined && score < 0.8;
  })
  .sort((a, b) => b.coefficient - a.coefficient); // Sort by highest coefficient
  
  // For each improvable criterion, simulate improvement
  criteriaToImprove.slice(0, 3).forEach(criterion => {
    // Create a copy of features with improved score
    const improvedFeatures = { ...features };
    const currentScore = features[criterion.key as keyof ProjectFeatures] as number;
    
    // Improve the score by 0.2 (or to max of 1.0)
    const improvedScore = Math.min(currentScore + 0.2, 1.0);
    
    // Type assertion to help TypeScript understand we're only updating number properties
    type NumericFeatureKey = keyof Pick<ProjectFeatures, 'safetyScore' | 'equityScore' | 'climateScore' | 
      'economicScore' | 'innovationScore' | 'stateOfGoodRepairScore' | 
      'publicSupport' | 'congestionReliefScore' | 'multimodalScore' | 'costEffectivenessScore'>;
    
    // Safe assertion since we know criterion.key is a numeric score property
    improvedFeatures[criterion.key as NumericFeatureKey] = improvedScore;
    
    // Get new prediction
    const newPrediction = predictProjectSuccess(improvedFeatures);
    const improvement = newPrediction.probability - probability;
    
    scenarios.push({
      scenario: `Improve ${criterion.name} score from ${(currentScore * 100).toFixed(0)}% to ${(improvedScore * 100).toFixed(0)}%`,
      impact: improvement,
      newProbability: newPrediction.probability
    });
  });
  
  // If public support is low/missing, suggest improving it
  if (!features.publicSupport || features.publicSupport < 0.6) {
    const improvedFeatures = { ...features, publicSupport: 0.8 };
    const newPrediction = predictProjectSuccess(improvedFeatures);
    const improvement = newPrediction.probability - probability;
    
    scenarios.push({
      scenario: 'Increase public support through community engagement',
      impact: improvement,
      newProbability: newPrediction.probability
    });
  }
  
  // Sort scenarios by impact
  return scenarios.sort((a, b) => b.impact - a.impact);
} 