'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase/client';
import { Criterion, UserProfile } from '@/types';
import { ArrowPathIcon, CheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface ProjectScoringTabProps {
  project: any;
  criteria: Criterion[];
  projectScores: any[];
  profile: UserProfile;
}

interface CriterionScore {
  criterion_id: string;
  score_value: number;
  notes: string;
}

export default function ProjectScoringTab({
  project,
  criteria,
  projectScores,
  profile,
}: ProjectScoringTabProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [scores, setScores] = useState<Record<string, CriterionScore>>({});
  const [loading, setLoading] = useState(false);
  const [aiScoring, setAiScoring] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Check if user has edit rights
  const canEdit = profile.role === 'admin' || profile.role === 'editor';
  
  // Initialize scores from project scores
  useEffect(() => {
    const initialScores: Record<string, CriterionScore> = {};
    
    projectScores?.forEach((score) => {
      initialScores[score.criterion_id] = {
        criterion_id: score.criterion_id,
        score_value: score.score_value || 0,
        notes: score.notes || '',
      };
    });
    
    // Add any missing criteria with default scores
    criteria?.forEach((criterion) => {
      if (!initialScores[criterion.id]) {
        initialScores[criterion.id] = {
          criterion_id: criterion.id,
          score_value: 0,
          notes: '',
        };
      }
    });
    
    setScores(initialScores);
  }, [projectScores, criteria]);
  
  // Handle score change
  const handleScoreChange = (criterionId: string, value: number) => {
    setScores((prevScores) => ({
      ...prevScores,
      [criterionId]: {
        ...prevScores[criterionId],
        score_value: value,
      },
    }));
  };
  
  // Handle notes change
  const handleNotesChange = (criterionId: string, notes: string) => {
    setScores((prevScores) => ({
      ...prevScores,
      [criterionId]: {
        ...prevScores[criterionId],
        notes,
      },
    }));
  };
  
  // Save scores
  const handleSaveScores = async () => {
    try {
      setLoading(true);
      
      // Convert scores object to array of score objects
      const scoresToSave = Object.values(scores);
      
      // Get existing scores to determine if we need to insert or update
      const { data: existingScores } = await supabase
        .from('project_criteria_scores')
        .select('criterion_id')
        .eq('project_id', project.id);
      
      const existingCriteriaIds = new Set(
        existingScores?.map((score) => score.criterion_id) || []
      );
      
      // Prepare inserts and updates
      const scoresToInsert = scoresToSave
        .filter((score) => !existingCriteriaIds.has(score.criterion_id))
        .map((score) => ({
          project_id: project.id,
          criterion_id: score.criterion_id,
          score_value: score.score_value,
          notes: score.notes,
        }));
      
      const scoresToUpdate = scoresToSave.filter((score) =>
        existingCriteriaIds.has(score.criterion_id)
      );
      
      // Perform inserts if needed
      if (scoresToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('project_criteria_scores')
          .insert(scoresToInsert);
        
        if (insertError) throw insertError;
      }
      
      // Perform updates if needed
      for (const score of scoresToUpdate) {
        const { error: updateError } = await supabase
          .from('project_criteria_scores')
          .update({
            score_value: score.score_value,
            notes: score.notes,
          })
          .eq('project_id', project.id)
          .eq('criterion_id', score.criterion_id);
        
        if (updateError) throw updateError;
      }
      
      // Calculate and update total score on the project
      const totalScore =
        scoresToSave.reduce((sum, score) => {
          const criterion = criteria.find((c) => c.id === score.criterion_id);
          return sum + (score.score_value * (criterion?.weight || 1));
        }, 0) /
        scoresToSave.reduce((sum, score) => {
          const criterion = criteria.find((c) => c.id === score.criterion_id);
          return sum + (criterion?.weight || 1);
        }, 0);
      
      const scoreBreakdown = scoresToSave.reduce(
        (obj, score) => {
          obj[score.criterion_id] = score.score_value;
          return obj;
        },
        {} as Record<string, number>
      );
      
      // Update project with total score
      const { error: projectUpdateError } = await supabase
        .from('projects')
        .update({
          score_total: totalScore,
          score_breakdown: scoreBreakdown,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id);
      
      if (projectUpdateError) throw projectUpdateError;
      
      // Show success message briefly
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      // Refresh the page to get updated data
      router.refresh();
    } catch (error) {
      console.error('Error saving scores:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Request AI scoring
  const handleAiScoring = async () => {
    try {
      setAiScoring(true);
      
      // Call the AI scoring endpoint
      const response = await fetch('/api/llm/score-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: project.id,
          criteria: criteria.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            max_points: c.max_points
          }))
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI scoring');
      }
      
      const data = await response.json();
      
      // Update scores with AI recommendations
      const newScores = { ...scores };
      
      Object.entries(data.criterionScores).forEach(([criterionId, score]) => {
        if (newScores[criterionId]) {
          newScores[criterionId] = {
            ...newScores[criterionId],
            score_value: Number(score),
            notes: data.explanations[criterionId] || newScores[criterionId].notes,
          };
        }
      });
      
      setScores(newScores);
    } catch (error) {
      console.error('Error getting AI scoring:', error);
    } finally {
      setAiScoring(false);
    }
  };
  
  // Calculate weighted total score
  const calculateTotalScore = () => {
    const totalWeight = criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    const weightedSum = criteria.reduce((sum, criterion) => {
      const score = scores[criterion.id]?.score_value || 0;
      return sum + score * criterion.weight;
    }, 0);
    
    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  };
  
  const totalScore = calculateTotalScore();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Project Scoring</h3>
        
        {canEdit && (
          <div className="flex space-x-3">
            <button
              onClick={handleAiScoring}
              disabled={aiScoring || loading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
            >
              {aiScoring ? (
                <ArrowPathIcon className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
              ) : (
                <SparklesIcon className="-ml-0.5 mr-2 h-4 w-4" />
              )}
              {aiScoring ? 'Generating...' : 'AI Scoring Suggestions'}
            </button>
            
            <button
              onClick={handleSaveScores}
              disabled={loading || aiScoring}
              className="inline-flex items-center px-4 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rtpa-blue-600 hover:bg-rtpa-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rtpa-blue-500"
            >
              {loading ? (
                <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
              ) : (
                <CheckIcon className="-ml-1 mr-2 h-5 w-5" />
              )}
              {loading ? 'Saving...' : 'Save Scores'}
            </button>
          </div>
        )}
      </div>
      
      {/* Success message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 text-green-700">
          <div className="flex">
            <CheckIcon className="h-5 w-5 mr-3" />
            <span>Scores saved successfully!</span>
          </div>
        </div>
      )}
      
      {/* Total score */}
      <div className="bg-gray-50 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-base font-medium text-gray-900">Total Score</h4>
            <p className="text-sm text-gray-500">Weighted average of all criteria</p>
          </div>
          <div className="text-3xl font-bold text-rtpa-blue-600">{totalScore.toFixed(1)}</div>
        </div>
        <div className="mt-4 bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-rtpa-blue-600 h-2.5 rounded-full"
            style={{ width: `${Math.min(100, (totalScore / 5) * 100)}%` }}
          ></div>
        </div>
      </div>
      
      {/* Scoring table */}
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
              >
                Criterion
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Weight
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Score (0-5)
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
              >
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {criteria.map((criterion) => (
              <tr key={criterion.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                  <div className="font-medium text-gray-900">{criterion.name}</div>
                  {criterion.description && (
                    <div className="text-gray-500">{criterion.description}</div>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {criterion.weight}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {canEdit ? (
                    <select
                      value={scores[criterion.id]?.score_value || 0}
                      onChange={(e) =>
                        handleScoreChange(criterion.id, Number(e.target.value))
                      }
                      className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500 sm:text-sm"
                    >
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                    </select>
                  ) : (
                    <span>{scores[criterion.id]?.score_value || 0}</span>
                  )}
                </td>
                <td className="px-3 py-4 text-sm text-gray-500">
                  {canEdit ? (
                    <textarea
                      value={scores[criterion.id]?.notes || ''}
                      onChange={(e) => handleNotesChange(criterion.id, e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rtpa-blue-500 focus:ring-rtpa-blue-500 sm:text-sm"
                      rows={2}
                      placeholder="Add notes about this score..."
                    />
                  ) : (
                    <div className="max-w-md">
                      {scores[criterion.id]?.notes || 'No notes provided.'}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
