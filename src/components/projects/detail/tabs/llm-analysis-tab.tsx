'use client';

import React, { useState, useEffect } from 'react';
import { ArrowPathIcon, SparklesIcon, DocumentTextIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ProjectLlmAnalysisTabProps {
  project: any;
  scores: any[];
  profile: any;
}

interface AnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  grantOpportunities: { name: string; match: number; description: string }[];
  generatedAt: string;
}

export default function ProjectLlmAnalysisTab({
  project,
  scores,
  profile,
}: ProjectLlmAnalysisTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [generating, setGenerating] = useState<Record<string, boolean>>({
    summary: false,
    strengths: false,
    weaknesses: false,
    recommendations: false,
    grantOpportunities: false,
  });
  
  // Check if LLM features are enabled
  const llmEnabled = true; // This could be fetched from agency settings
  
  // Load any existing analysis from local storage
  useEffect(() => {
    const savedAnalysis = localStorage.getItem(`project-analysis-${project.id}`);
    if (savedAnalysis) {
      try {
        setAnalysis(JSON.parse(savedAnalysis));
      } catch (e) {
        console.error('Error parsing saved analysis:', e);
      }
    }
  }, [project.id]);
  
  // Save analysis to local storage when it changes
  useEffect(() => {
    if (analysis) {
      localStorage.setItem(`project-analysis-${project.id}`, JSON.stringify(analysis));
    }
  }, [analysis, project.id]);
  
  // Generate full project analysis
  const generateAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/llm/analyze-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          includeScores: scores && scores.length > 0,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate analysis');
      }
      
      const data = await response.json();
      
      setAnalysis({
        summary: data.summary || '',
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        recommendations: data.recommendations || [],
        grantOpportunities: data.grantOpportunities || [],
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error generating analysis:', error);
      setError(error.message || 'An error occurred while generating analysis');
    } finally {
      setLoading(false);
    }
  };
  
  // Generate a specific section of the analysis
  const generateSection = async (section: 'summary' | 'strengths' | 'weaknesses' | 'recommendations' | 'grantOpportunities') => {
    try {
      setGenerating((prev) => ({ ...prev, [section]: true }));
      setError(null);
      
      const response = await fetch(`/api/llm/analyze-project/${section}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          includeScores: scores && scores.length > 0,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate ${section}`);
      }
      
      const data = await response.json();
      
      setAnalysis((prev) => {
        if (!prev) {
          return {
            summary: section === 'summary' ? data.content : '',
            strengths: section === 'strengths' ? data.content : [],
            weaknesses: section === 'weaknesses' ? data.content : [],
            recommendations: section === 'recommendations' ? data.content : [],
            grantOpportunities: section === 'grantOpportunities' ? data.content : [],
            generatedAt: new Date().toISOString(),
          };
        }
        
        return {
          ...prev,
          [section]: data.content,
          generatedAt: new Date().toISOString(),
        };
      });
    } catch (error: any) {
      console.error(`Error generating ${section}:`, error);
      setError(error.message || `An error occurred while generating ${section}`);
    } finally {
      setGenerating((prev) => ({ ...prev, [section]: false }));
    }
  };
  
  if (!llmEnabled) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-8 text-center">
        <SparklesIcon className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-yellow-800">LLM Features Disabled</h3>
        <p className="mt-2 text-sm text-yellow-700 max-w-md mx-auto">
          AI-powered project analysis is not enabled for your agency. Please contact your
          administrator to enable these features.
        </p>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
          <p className="text-sm text-gray-500">
            AI-powered insights and recommendations for this project
          </p>
        </div>
        
        <button
          onClick={generateAnalysis}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
              Generate Full Analysis
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <div className="flex">
            <span className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span className="ml-3">{error}</span>
          </div>
        </div>
      )}

      {/* Analysis timestamp */}
      {analysis?.generatedAt && (
        <div className="text-sm text-gray-500 italic">
          Analysis last generated: {formatDate(analysis.generatedAt)}
        </div>
      )}

      {/* Analysis sections */}
      <div className="space-y-8">
        {/* Project Summary */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h4 className="text-base font-medium text-gray-900">Project Summary</h4>
            <button
              onClick={() => generateSection('summary')}
              disabled={generating.summary}
              className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              {generating.summary ? (
                <ArrowPathIcon className="animate-spin h-4 w-4" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Generate</span>
            </button>
          </div>
          <div className="px-6 py-4">
            {analysis?.summary ? (
              <p className="text-gray-700 whitespace-pre-wrap">{analysis.summary}</p>
            ) : (
              <p className="text-gray-500 italic">
                No AI-generated summary available. Click the generate button to create one.
              </p>
            )}
          </div>
        </div>

        {/* Strengths and Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-white border border-green-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-green-200 bg-green-50 flex justify-between items-center">
              <h4 className="text-base font-medium text-green-800">Project Strengths</h4>
              <button
                onClick={() => generateSection('strengths')}
                disabled={generating.strengths}
                className="inline-flex items-center px-2 py-1 border border-green-300 text-xs font-medium rounded text-green-700 bg-white hover:bg-green-50"
              >
                {generating.strengths ? (
                  <ArrowPathIcon className="animate-spin h-4 w-4" />
                ) : (
                  <SparklesIcon className="h-4 w-4" />
                )}
                <span className="sr-only">Generate</span>
              </button>
            </div>
            <div className="px-6 py-4">
              {analysis?.strengths && analysis.strengths.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex">
                      <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">
                  No strengths identified yet. Click the generate button to analyze project strengths.
                </p>
              )}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="bg-white border border-red-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50 flex justify-between items-center">
              <h4 className="text-base font-medium text-red-800">Areas for Improvement</h4>
              <button
                onClick={() => generateSection('weaknesses')}
                disabled={generating.weaknesses}
                className="inline-flex items-center px-2 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
              >
                {generating.weaknesses ? (
                  <ArrowPathIcon className="animate-spin h-4 w-4" />
                ) : (
                  <SparklesIcon className="h-4 w-4" />
                )}
                <span className="sr-only">Generate</span>
              </button>
            </div>
            <div className="px-6 py-4">
              {analysis?.weaknesses && analysis.weaknesses.length > 0 ? (
                <ul className="space-y-2">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="flex">
                      <svg
                        className="h-5 w-5 text-red-500 flex-shrink-0 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic">
                  No areas for improvement identified yet. Click the generate button to analyze potential weaknesses.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white border border-blue-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-blue-200 bg-blue-50 flex justify-between items-center">
            <h4 className="text-base font-medium text-blue-800">Recommendations</h4>
            <button
              onClick={() => generateSection('recommendations')}
              disabled={generating.recommendations}
              className="inline-flex items-center px-2 py-1 border border-blue-300 text-xs font-medium rounded text-blue-700 bg-white hover:bg-blue-50"
            >
              {generating.recommendations ? (
                <ArrowPathIcon className="animate-spin h-4 w-4" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Generate</span>
            </button>
          </div>
          <div className="px-6 py-4">
            {analysis?.recommendations && analysis.recommendations.length > 0 ? (
              <ul className="space-y-4">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex">
                    <span className="flex-shrink-0 bg-blue-100 text-blue-800 font-medium rounded-full h-6 w-6 flex items-center justify-center mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">
                No recommendations available yet. Click the generate button to get AI-powered suggestions.
              </p>
            )}
          </div>
        </div>

        {/* Grant Opportunities */}
        <div className="bg-white border border-purple-200 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-purple-200 bg-purple-50 flex justify-between items-center">
            <h4 className="text-base font-medium text-purple-800">Potential Grant Opportunities</h4>
            <button
              onClick={() => generateSection('grantOpportunities')}
              disabled={generating.grantOpportunities}
              className="inline-flex items-center px-2 py-1 border border-purple-300 text-xs font-medium rounded text-purple-700 bg-white hover:bg-purple-50"
            >
              {generating.grantOpportunities ? (
                <ArrowPathIcon className="animate-spin h-4 w-4" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              <span className="sr-only">Generate</span>
            </button>
          </div>
          <div className="px-6 py-4">
            {analysis?.grantOpportunities && analysis.grantOpportunities.length > 0 ? (
              <div className="space-y-4">
                {analysis.grantOpportunities.map((grant, index) => (
                  <div key={index} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start">
                      <h5 className="text-base font-medium text-gray-900">{grant.name}</h5>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {grant.match}% match
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">{grant.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                No grant opportunities identified yet. Click the generate button to find potential matches.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Export buttons */}
      <div className="flex justify-end">
        <button
          disabled={!analysis}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500 disabled:opacity-50"
        >
          <DocumentTextIcon className="-ml-1 mr-2 h-5 w-5" />
          Export as PDF
        </button>
      </div>
    </div>
  );
}
