'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowsUpDownIcon, ArrowPathIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { Criterion, ProjectStatus } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import our sub-components
import ProjectList from './components/project-list';
import Filters from './components/filters';
import CriteriaWeights from './components/criteria-weights';
import MlPredictions from './components/ml-predictions';
import { Loading } from '@/components/ui/loading';
import ErrorDisplay from '@/components/ui/error-display';

interface MlPrediction {
  project_id: string;
  ml_score: number;
  explanations: string[];
  feature_importance: Record<string, number>;
}

interface PrioritizationToolProps {
  projects: any[];
  criteria: Criterion[];
  statusFilter: string[];
  categoryFilter: string[];
  availableCategories: string[];
  highlightedProjectId?: string;
}

export default function PrioritizationTool({
  projects: initialProjects,
  criteria,
  statusFilter,
  categoryFilter,
  availableCategories,
  highlightedProjectId,
}: PrioritizationToolProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [projects, setProjects] = useState<any[]>(initialProjects);
  const [status, setStatus] = useState<string[]>(statusFilter);
  const [categories, setCategories] = useState<string[]>(categoryFilter);
  const [criteriaWeights, setCriteriaWeights] = useState<Record<string, number>>({});
  const [sortBy, setSortBy] = useState<string>('score_total');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ML prediction state
  const [mlPredictions, setMlPredictions] = useState<Record<string, MlPrediction>>({});
  const [mlModelInfo, setMlModelInfo] = useState<any>(null);
  const [isMlLoading, setIsMlLoading] = useState(false);
  const [showMlScores, setShowMlScores] = useState(false);
  
  // Add default tab state
  const [activeTab, setActiveTab] = useState<string>('list');
  
  // Initialize criteria weights based on original criteria
  useEffect(() => {
    const weights: Record<string, number> = {};
    criteria.forEach(criterion => {
      weights[criterion.id] = criterion.weight;
    });
    setCriteriaWeights(weights);
  }, [criteria]);
  
  // Load ML predictions when enabled
  useEffect(() => {
    async function fetchMlPredictions() {
      if (!showMlScores) return;
      
      setIsMlLoading(true);
      setError(null);
      
      try {
        // Construct query params with current filters
        const statusParams = status.map(s => `status=${s}`).join('&');
        
        const response = await fetch(`/api/projects/ml-predictions?${statusParams}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch ML predictions');
        }
        
        const data = await response.json();
        
        // Convert array to record keyed by project_id for easier lookup
        const predictionsMap: Record<string, MlPrediction> = {};
        data.predictions.forEach((prediction: MlPrediction) => {
          predictionsMap[prediction.project_id] = prediction;
        });
        
        setMlPredictions(predictionsMap);
        setMlModelInfo(data.model_info);
      } catch (err: any) {
        console.error('Error fetching ML predictions:', err);
        setError(err.message || 'Error loading ML predictions');
        setShowMlScores(false); // Turn off ML scores if there's an error
      } finally {
        setIsMlLoading(false);
      }
    }
    
    fetchMlPredictions();
  }, [showMlScores, status]);
  
  // Calculate custom score based on user-adjusted weights
  const calculateCustomScore = (project: any) => {
    if (!project.score_breakdown) return project.score_total || 0;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    Object.entries(project.score_breakdown).forEach(([criterionId, score]) => {
      const weight = criteriaWeights[criterionId] || 1;
      totalScore += (score as number) * weight;
      totalWeight += weight;
    });
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };
  
  // Create URL query string for filters
  const createQueryString = (params: Record<string, string | string[] | null>) => {
    const urlSearchParams = searchParams
      ? new URLSearchParams(searchParams.toString())
      : new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        urlSearchParams.delete(key);
      } else if (Array.isArray(value)) {
        urlSearchParams.delete(key);
        value.forEach(val => urlSearchParams.append(key, val));
      } else {
        urlSearchParams.set(key, value);
      }
    });
    
    return urlSearchParams.toString();
  };
  
  // Toggle status filter
  const toggleStatus = (selectedStatus: ProjectStatus) => {
    const newStatus = status.includes(selectedStatus)
      ? status.filter(s => s !== selectedStatus)
      : [...status, selectedStatus];
    
    setStatus(newStatus);
    
    if (pathname) {
      router.push(`${pathname}?${createQueryString({ status: newStatus })}`);
    }
  };
  
  // Toggle category filter
  const toggleCategory = (selectedCategory: string) => {
    const newCategories = categories.includes(selectedCategory)
      ? categories.filter(c => c !== selectedCategory)
      : [...categories, selectedCategory];
    
    setCategories(newCategories);
    
    if (pathname) {
      router.push(`${pathname}?${createQueryString({ category: newCategories })}`);
    }
  };
  
  // Handle criteria weight change
  const handleWeightChange = (criterionId: string, weight: number) => {
    setCriteriaWeights(prev => ({
      ...prev,
      [criterionId]: weight,
    }));
  };
  
  // Apply custom weights to sort projects
  const saveWeights = () => {
    setLoading(true);
    
    // Recalculate scores with custom weights
    const sortedProjects = [...projects].map(project => ({
      ...project,
      customScore: calculateCustomScore(project),
    })).sort((a, b) => {
      return sortDirection === 'desc'
        ? b.customScore - a.customScore
        : a.customScore - b.customScore;
    });
    
    setProjects(sortedProjects);
    setLoading(false);
  };
  
  // Handle sort change
  const handleSortChange = (field: string) => {
    const direction = 
      sortBy === field && sortDirection === 'desc' ? 'asc' : 'desc';
    
    setSortBy(field);
    setSortDirection(direction);
    
    setProjects([...projects].sort((a, b) => {
      // Handle ML score sorting
      if (field === 'ml_score') {
        const scoreA = mlPredictions[a.id]?.ml_score || 0;
        const scoreB = mlPredictions[b.id]?.ml_score || 0;
        return direction === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
      
      // Normal field sorting
      return direction === 'desc'
        ? (b[field] || 0) - (a[field] || 0)
        : (a[field] || 0) - (b[field] || 0);
    }));
  };
  
  // Toggle ML scores
  const toggleMlScores = () => {
    setShowMlScores(prev => !prev);
  };
  
  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  if (loading) {
    return <Loading message="Updating prioritization..." />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <ErrorDisplay 
          title="Error loading data" 
          message={error} 
          onRetry={() => setShowMlScores(true)} 
        />
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between mb-4">
          <div className="flex space-x-4 items-center">
            <TabsList>
              <TabsTrigger 
                value="list" 
                onClick={() => {
                  setView('list');
                  setActiveTab('list');
                }}
              >
                <ListBulletIcon className="h-4 w-4 mr-1" />
                List
              </TabsTrigger>
              <TabsTrigger 
                value="stats"
                onClick={() => {
                  setActiveTab('stats');
                }}
              >
                <ArrowsUpDownIcon className="h-4 w-4 mr-1" />
                Stats
              </TabsTrigger>
            </TabsList>
            
            <MlPredictions 
              showMlScores={showMlScores} 
              toggleMlScores={toggleMlScores} 
              isLoading={isMlLoading}
              mlModelInfo={mlModelInfo}
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setProjects([...initialProjects]);
                setStatus(statusFilter);
                setCategories(categoryFilter);
                setSortBy('score_total');
                setSortDirection('desc');
                // Reset URL params
                if (pathname) {
                  router.push(pathname);
                }
              }}
              className="flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Reset
            </button>
            
            <CriteriaWeights 
              criteria={criteria} 
              weights={criteriaWeights} 
              onWeightChange={handleWeightChange}
              onSaveWeights={saveWeights}
            />
          </div>
        </div>
        
        <div className="flex md:flex-row flex-col gap-6">
          <div className="md:w-1/4 w-full">
            <Filters 
              statusFilter={status}
              categoryFilter={categories}
              availableCategories={availableCategories}
              toggleStatus={toggleStatus}
              toggleCategory={toggleCategory}
            />
          </div>
          
          <div className="md:w-3/4 w-full">
            <TabsContent value="list" className="m-0">
              <ProjectList 
                projects={projects}
                criteria={criteria}
                sortBy={sortBy}
                sortDirection={sortDirection}
                handleSortChange={handleSortChange}
                highlightedProjectId={highlightedProjectId}
                formatCurrency={formatCurrency}
                showMlScores={showMlScores}
                mlPredictions={mlPredictions}
              />
            </TabsContent>
            
            <TabsContent value="stats" className="m-0">
              <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-medium mb-4">Project Statistics</h3>
                <p className="text-gray-500">Statistics view is under development.</p>
                {/* Statistics content will go here */}
              </div>
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
