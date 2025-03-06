import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, AlertCircle, ArrowRight, Award, CheckCircle2, XCircle } from "lucide-react";
import { GrantAnalysisResult, GrantProgram } from '@/types/grant-analysis';
import { Progress } from '@/components/ui/progress';
import { runGrantAnalysis } from '@/lib/api/grant-analysis';

interface GrantAnalysisProps {
  projectId: string;
  grantPrograms?: GrantProgram[];
  onAnalysisComplete?: (analysis: any) => void;
}

export default function GrantAnalysis({ projectId, grantPrograms = [], onAnalysisComplete }: GrantAnalysisProps) {
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GrantAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await runGrantAnalysis(projectId, selectedProgram || undefined);
      
      if (response.success) {
        setAnalysisResult(response.analysis);
        // If onAnalysisComplete is provided, call it with the full response
        if (onAnalysisComplete) {
          onAnalysisComplete(response);
        }
      } else {
        throw new Error(response.error || 'Unknown error during analysis');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getEligibilityBadge = () => {
    if (!analysisResult?.eligibility.status) return null;
    
    const status = analysisResult.eligibility.status.toLowerCase();
    
    if (status === 'yes' || status === 'likely') {
      return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Eligible</Badge>;
    } else if (status === 'no' || status === 'unlikely') {
      return <Badge className="bg-red-600"><XCircle className="h-3 w-3 mr-1" /> Not Eligible</Badge>;
    } else {
      return <Badge className="bg-yellow-600">Potentially Eligible</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="h-5 w-5 mr-2" />
          Grant & Funding Analysis
        </CardTitle>
        <CardDescription>
          Use AI to analyze this project for grant eligibility and competitiveness
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 bg-red-50 text-red-800 border-red-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {!isAnalyzing && !analysisResult ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Grant Program (optional)</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a grant program or leave empty for general analysis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">General Analysis (All Programs)</SelectItem>
                  {grantPrograms.map(program => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-gray-500">
                For general analysis of multiple programs, leave this empty.
              </p>
            </div>
            
            <Button onClick={runAnalysis} className="w-full">
              Analyze Project for Funding
            </Button>
          </div>
        ) : isAnalyzing ? (
          <div className="space-y-4 py-4">
            <div className="text-center text-sm text-gray-500 mb-2">
              Analyzing project for grant eligibility...
            </div>
            <Progress value={60} className="w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          </div>
        ) : analysisResult ? (
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Detailed Analysis</TabsTrigger>
              <TabsTrigger value="scores">Scores</TabsTrigger>
              <TabsTrigger value="programs">Programs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Eligibility Assessment</h3>
                {getEligibilityBadge()}
              </div>
              
              <p className="text-sm text-gray-700">
                {analysisResult.eligibility.analysis || 'No eligibility analysis available.'}
              </p>
              
              {analysisResult.overallScore && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-1">Overall Competitiveness</h4>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(analysisResult.overallScore.score / analysisResult.overallScore.maxScore) * 100} 
                      className="h-3 w-full" 
                    />
                    <span className="text-sm font-medium">
                      {analysisResult.overallScore.score}/{analysisResult.overallScore.maxScore}
                    </span>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-1" /> Strengths
                  </h4>
                  {analysisResult.strengths.length > 0 ? (
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {analysisResult.strengths.slice(0, 3).map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                      {analysisResult.strengths.length > 3 && (
                        <li className="text-blue-600 cursor-pointer" onClick={() => setActiveTab('details')}>
                          +{analysisResult.strengths.length - 3} more...
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No strengths identified</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center">
                    <AlertCircle className="h-4 w-4 text-amber-600 mr-1" /> Areas to Improve
                  </h4>
                  {analysisResult.weaknesses.length > 0 ? (
                    <ul className="text-sm list-disc pl-5 space-y-1">
                      {analysisResult.weaknesses.slice(0, 3).map((weakness, i) => (
                        <li key={i}>{weakness}</li>
                      ))}
                      {analysisResult.weaknesses.length > 3 && (
                        <li className="text-blue-600 cursor-pointer" onClick={() => setActiveTab('details')}>
                          +{analysisResult.weaknesses.length - 3} more...
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No weaknesses identified</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Top Recommended Grant Programs</h4>
                {analysisResult.suggestedPrograms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.suggestedPrograms.slice(0, 3).map((program, i) => (
                      <Badge key={i} variant="outline" className="bg-blue-50">
                        {program}
                      </Badge>
                    ))}
                    {analysisResult.suggestedPrograms.length > 3 && (
                      <Badge variant="outline" className="bg-blue-50 cursor-pointer" onClick={() => setActiveTab('programs')}>
                        +{analysisResult.suggestedPrograms.length - 3} more
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No specific programs recommended</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="details" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Strengths</h3>
                  {analysisResult.strengths.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {analysisResult.strengths.map((strength, i) => (
                        <li key={i}>{strength}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No strengths identified</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Weaknesses & Challenges</h3>
                  {analysisResult.weaknesses.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {analysisResult.weaknesses.map((weakness, i) => (
                        <li key={i}>{weakness}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No weaknesses identified</p>
                  )}
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                  {analysisResult.recommendations.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {analysisResult.recommendations.map((recommendation, i) => (
                        <li key={i}>{recommendation}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No specific recommendations</p>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="scores">
              <div className="space-y-4">
                <h3 className="text-lg font-medium mb-2">Predicted Scores</h3>
                
                {analysisResult.overallScore && (
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Overall Score</span>
                      <span className="text-sm font-medium">
                        {analysisResult.overallScore.score}/{analysisResult.overallScore.maxScore}
                      </span>
                    </div>
                    <Progress 
                      value={(analysisResult.overallScore.score / analysisResult.overallScore.maxScore) * 100} 
                      className="h-3" 
                    />
                  </div>
                )}
                
                {Object.keys(analysisResult.predictedScores).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(analysisResult.predictedScores).map(([criterion, scoreData]) => (
                      <div key={criterion} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">{criterion}</span>
                          <span className="text-sm">
                            {scoreData.score}/{scoreData.maxScore}
                          </span>
                        </div>
                        <Progress 
                          value={(scoreData.score / scoreData.maxScore) * 100} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No detailed scores available</p>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="programs">
              <div>
                <h3 className="text-lg font-medium mb-2">Recommended Grant Programs</h3>
                {analysisResult.suggestedPrograms.length > 0 ? (
                  <ul className="divide-y">
                    {analysisResult.suggestedPrograms.map((program, i) => (
                      <li key={i} className="py-2">
                        <div className="flex items-start">
                          <ArrowRight className="h-4 w-4 mt-0.5 mr-2 text-blue-600" />
                          <span className="text-sm">{program}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No specific programs recommended</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : null}
      </CardContent>
      
      {analysisResult && (
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="outline" onClick={() => setAnalysisResult(null)}>
            New Analysis
          </Button>
          
          <Button variant="default">
            Save Analysis
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 