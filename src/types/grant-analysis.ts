export interface GrantAnalysisResult {
  eligibility: {
    status?: string;
    analysis?: string;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  predictedScores: {
    [criterion: string]: {
      score: number;
      maxScore: number;
    };
  };
  overallScore: {
    score: number;
    maxScore: number;
  } | null;
  suggestedPrograms: string[];
}

export interface GrantProgram {
  id: string;
  name: string;
  description: string;
  funding_amount: number;
  deadline: string;
  eligibility_criteria?: string;
  scoring_criteria?: string;
  created_at: string;
  agency_id: string;
}

export interface GrantAnalysisResponse {
  success: boolean;
  analysis: GrantAnalysisResult;
  raw_response: string;
} 