'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Switch,
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui';
import { 
  Plus, 
  Upload, 
  Save, 
  Database, 
  FileText, 
  AlertTriangle, 
  X, 
  Check, 
  Download,
  Trash2,
  Save as SaveIcon
} from 'lucide-react';

// Status options for historical projects
export type HistoricalProjectStatus = 
  | 'completed' 
  | 'cancelled' 
  | 'delayed'
  | 'on_budget'
  | 'over_budget';

// Completion status options
export type CompletionStatus =
  | 'completed_on_time'
  | 'completed_late'
  | 'not_completed';

// Funding success options
export type FundingSuccess = 
  | 'fully_funded'
  | 'partially_funded'
  | 'not_funded';

// Historical project data interface
export interface HistoricalProject {
  id: string;
  title: string;
  description: string;
  primary_category: string;
  start_date: string;
  end_date?: string;
  planned_end_date?: string;
  status: HistoricalProjectStatus;
  completion_status: CompletionStatus;
  initial_cost_estimate: number;
  final_cost?: number;
  funding_sources?: string[];
  funding_success: FundingSuccess;
  challenges?: string[];
  success_factors?: string[];
  stakeholders?: string[];
  community_support_level?: number; // 1-5
  environmental_complexity?: number; // 1-5
  technical_complexity?: number; // 1-5
  political_support?: number; // 1-5
  regulatory_challenges?: number; // 1-5
  metrics?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Props for the HistoricalDataCollector component
interface HistoricalDataCollectorProps {
  agencyId?: string;
  onDataUpdate?: (data: HistoricalProject[]) => void;
  className?: string;
}

/**
 * HistoricalDataCollector component for collecting historical project data
 * to train the ML model for project success prediction
 */
export default function HistoricalDataCollector({ 
  agencyId,
  onDataUpdate,
  className = ''
}: HistoricalDataCollectorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('list');
  const [historicalProjects, setHistoricalProjects] = useState<HistoricalProject[]>([]);
  const [currentProject, setCurrentProject] = useState<Partial<HistoricalProject>>({
    primary_category: 'road',
    status: 'completed',
    completion_status: 'completed_on_time',
    funding_success: 'fully_funded',
    community_support_level: 3,
    environmental_complexity: 3,
    technical_complexity: 3,
    political_support: 3,
    regulatory_challenges: 3,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([
    'road', 'highway', 'bridge', 'bike', 'pedestrian', 'transit', 'other'
  ]);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState('');
  
  // Fetch historical projects from database
  const fetchHistoricalProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = createAdminClient();
      
      const { data, error } = await supabase
        .from('historical_projects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching historical projects:', error);
        setError(error.message);
        return;
      }
      
      setHistoricalProjects(data as HistoricalProject[]);
      
      if (onDataUpdate) {
        onDataUpdate(data as HistoricalProject[]);
      }
    } catch (error: any) {
      console.error('Error in fetchHistoricalProjects:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [onDataUpdate]);
  
  // Fetch historical projects on component mount
  useEffect(() => {
    fetchHistoricalProjects();
    fetchCategories();
  }, [fetchHistoricalProjects]);
  
  // Fetch categories from database
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
  
  // Handle project input change
  const handleInputChange = <K extends keyof HistoricalProject>(field: K, value: HistoricalProject[K]) => {
    setCurrentProject(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Add or update historical project
  const saveProject = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);
      
      // Validate required fields
      if (!currentProject.title || !currentProject.primary_category) {
        setError('Title and Project Category are required');
        setIsLoading(false);
        return;
      }
      
      const supabase = createAdminClient();
      const timestamp = new Date().toISOString();
      
      const projectData = {
        ...currentProject,
        updated_at: timestamp,
        agency_id: agencyId || null
      };
      
      let result;
      
      if (isEditing && currentProject.id) {
        // Update existing project
        const { data, error } = await supabase
          .from('historical_projects')
          .update(projectData)
          .eq('id', currentProject.id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        setSuccess('Project updated successfully');
      } else {
        // Create new project
        const { data, error } = await supabase
          .from('historical_projects')
          .insert({
            ...projectData,
            created_at: timestamp,
            id: `hist-${Date.now()}`
          })
          .select()
          .single();
        
        if (error) throw error;
        result = data;
        setSuccess('Project added successfully');
      }
      
      // Refresh project list
      await fetchHistoricalProjects();
      
      // Reset form and return to list view
      resetForm();
      setActiveTab('list');
    } catch (err) {
      console.error('Error saving historical project:', err);
      setError('Failed to save project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete historical project
  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this historical project?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('historical_projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
      
      // Refresh project list
      await fetchHistoricalProjects();
      setSuccess('Project deleted successfully');
    } catch (err) {
      console.error('Error deleting historical project:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up project for editing
  const editProject = (project: HistoricalProject) => {
    setCurrentProject(project);
    setIsEditing(true);
    setActiveTab('form');
  };
  
  // Reset form state
  const resetForm = () => {
    setCurrentProject({
      primary_category: 'road',
      status: 'completed',
      completion_status: 'completed_on_time',
      funding_success: 'fully_funded',
      community_support_level: 3,
      environmental_complexity: 3,
      technical_complexity: 3,
      political_support: 3,
      regulatory_challenges: 3,
    });
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };
  
  // Handle new project button click
  const handleNewProject = () => {
    resetForm();
    setActiveTab('form');
  };
  
  // Handle import button click
  const handleImportClick = () => {
    setIsImporting(true);
    setActiveTab('import');
  };
  
  // Process imported data
  const processImport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate and parse import data
      let importedProjects;
      try {
        importedProjects = JSON.parse(importData);
      } catch (err) {
        setError('Invalid JSON format. Please check your import data.');
        setIsLoading(false);
        return;
      }
      
      if (!Array.isArray(importedProjects)) {
        setError('Import data must be an array of projects');
        setIsLoading(false);
        return;
      }
      
      const supabase = createAdminClient();
      const timestamp = new Date().toISOString();
      
      // Process each project
      const processedProjects = importedProjects.map((project: any) => ({
        ...project,
        created_at: timestamp,
        updated_at: timestamp,
        agency_id: agencyId || null,
        id: project.id || `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      }));
      
      // Insert all projects
      const { data, error } = await supabase
        .from('historical_projects')
        .insert(processedProjects)
        .select();
      
      if (error) throw error;
      
      // Refresh project list
      await fetchHistoricalProjects();
      
      setSuccess(`Successfully imported ${processedProjects.length} projects`);
      setImportData('');
      setIsImporting(false);
      setActiveTab('list');
    } catch (err) {
      console.error('Error importing historical projects:', err);
      setError('Failed to import projects. Please check your data and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Export projects to JSON
  const exportProjects = () => {
    try {
      const dataStr = JSON.stringify(historicalProjects, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `historical_projects_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSuccess('Projects exported successfully');
    } catch (err) {
      console.error('Error exporting historical projects:', err);
      setError('Failed to export projects. Please try again.');
    }
  };
  
  return (
    <Card className={`shadow-sm border ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <Database className="h-5 w-5 mr-2 text-blue-500" />
          Historical Projects Data Collection
        </CardTitle>
        <CardDescription>
          Collect data on completed projects to train the ML model for success prediction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list">Project List</TabsTrigger>
            <TabsTrigger value="form">{isEditing ? 'Edit Project' : 'Add Project'}</TabsTrigger>
            <TabsTrigger value="import">Import/Export</TabsTrigger>
          </TabsList>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert variant="success" className="mb-4 bg-green-50 border-green-200 text-green-800">
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          
          <TabsContent value="list">
            <div className="flex justify-end mb-4 space-x-2">
              <Button 
                onClick={handleNewProject}
                className="flex items-center"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add New Project
              </Button>
              <Button 
                onClick={handleImportClick}
                variant="outline"
                className="flex items-center"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-1" />
                Import/Export
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : historicalProjects.length === 0 ? (
              <div className="text-center py-10 border rounded-md bg-gray-50">
                <Database className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No historical projects yet</p>
                <p className="text-sm text-gray-500 mb-4">
                  Add historical project data to train the ML model
                </p>
                <Button 
                  onClick={handleNewProject}
                  size="sm"
                  className="flex items-center mx-auto"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add First Project
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {historicalProjects.map((project) => (
                  <div 
                    key={project.id}
                    className="border p-3 rounded-md hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{project.title}</h3>
                        <div className="text-sm text-gray-500 mt-1 flex space-x-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                            {project.primary_category}
                          </span>
                          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full text-xs capitalize">
                            {project.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            project.funding_success === 'fully_funded' 
                              ? 'bg-green-100 text-green-800' 
                              : project.funding_success === 'partially_funded'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {project.funding_success.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          onClick={() => editProject(project)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          onClick={() => deleteProject(project.id)}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                    
                    {project.description && (
                      <p className="text-sm mt-2 text-gray-700 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="mt-3 flex flex-wrap gap-2">
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                        <span className="text-gray-500">Initial Cost:</span> ${project.initial_cost_estimate.toLocaleString()}
                      </div>
                      
                      {project.final_cost && (
                        <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                          <span className="text-gray-500">Final Cost:</span> ${project.final_cost.toLocaleString()}
                        </div>
                      )}
                      
                      <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                        <span className="text-gray-500">Completion:</span> {project.completion_status.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="form">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={currentProject.title || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
                    placeholder="Enter project title"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Project Category</Label>
                  <Select
                    value={currentProject.primary_category}
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
                  value={currentProject.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  placeholder="Enter project description"
                  className="mt-1 h-32"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={currentProject.start_date || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('start_date', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="planned-end-date">Planned End Date</Label>
                  <Input
                    id="planned-end-date"
                    type="date"
                    value={currentProject.planned_end_date || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('planned_end_date', e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-date">Actual End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={currentProject.end_date || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('end_date', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="initial-cost">Initial Cost Estimate ($)</Label>
                  <Input
                    id="initial-cost"
                    type="number"
                    min="0"
                    step="1000"
                    value={currentProject.initial_cost_estimate || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('initial_cost_estimate', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="final-cost">Final Cost ($)</Label>
                  <Input
                    id="final-cost"
                    type="number"
                    min="0"
                    step="1000"
                    value={currentProject.final_cost || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('final_cost', parseFloat(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Project Status</Label>
                  <Select
                    value={currentProject.status}
                    onValueChange={(value: HistoricalProjectStatus) => handleInputChange('status', value)}
                  >
                    <SelectTrigger id="status" className="mt-1">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                      <SelectItem value="on_budget">On Budget</SelectItem>
                      <SelectItem value="over_budget">Over Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="completion-status">Completion Status</Label>
                  <Select
                    value={currentProject.completion_status}
                    onValueChange={(value: CompletionStatus) => handleInputChange('completion_status', value)}
                  >
                    <SelectTrigger id="completion-status" className="mt-1">
                      <SelectValue placeholder="Select completion status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completed_on_time">Completed On Time</SelectItem>
                      <SelectItem value="completed_late">Completed Late</SelectItem>
                      <SelectItem value="not_completed">Not Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="funding-success">Funding Success</Label>
                  <Select
                    value={currentProject.funding_success}
                    onValueChange={(value: FundingSuccess) => handleInputChange('funding_success', value)}
                  >
                    <SelectTrigger id="funding-success" className="mt-1">
                      <SelectValue placeholder="Select funding outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fully_funded">Fully Funded</SelectItem>
                      <SelectItem value="partially_funded">Partially Funded</SelectItem>
                      <SelectItem value="not_funded">Not Funded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="funding-sources">Funding Sources</Label>
                <Textarea
                  id="funding-sources"
                  value={Array.isArray(currentProject.funding_sources) 
                    ? currentProject.funding_sources.join(', ')
                    : currentProject.funding_sources || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('funding_sources',
                    e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                  )}
                  placeholder="List funding sources (comma separated)"
                  className="mt-1"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="challenges">Key Challenges</Label>
                  <Textarea
                    id="challenges"
                    value={Array.isArray(currentProject.challenges) 
                      ? currentProject.challenges.join(', ')
                      : currentProject.challenges || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('challenges',
                      e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                    )}
                    placeholder="List key challenges (comma separated)"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label htmlFor="success-factors">Success Factors</Label>
                  <Textarea
                    id="success-factors"
                    value={Array.isArray(currentProject.success_factors) 
                      ? currentProject.success_factors.join(', ')
                      : currentProject.success_factors || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('success_factors',
                      e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean)
                    )}
                    placeholder="List success factors (comma separated)"
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="border p-4 rounded-md bg-gray-50">
                <h3 className="font-medium mb-3">Project Complexity Factors (1-5)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="community-support">
                      Community Support Level
                    </Label>
                    <div className="flex items-center mt-1">
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        value={currentProject.community_support_level || 3}
                        onChange={(e) => handleInputChange('community_support_level', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="ml-2 w-6 text-center">
                        {currentProject.community_support_level || 3}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="environmental-complexity">
                      Environmental Complexity
                    </Label>
                    <div className="flex items-center mt-1">
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        value={currentProject.environmental_complexity || 3}
                        onChange={(e) => handleInputChange('environmental_complexity', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="ml-2 w-6 text-center">
                        {currentProject.environmental_complexity || 3}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="technical-complexity">
                      Technical Complexity
                    </Label>
                    <div className="flex items-center mt-1">
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        value={currentProject.technical_complexity || 3}
                        onChange={(e) => handleInputChange('technical_complexity', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="ml-2 w-6 text-center">
                        {currentProject.technical_complexity || 3}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="political-support">
                      Political Support
                    </Label>
                    <div className="flex items-center mt-1">
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        value={currentProject.political_support || 3}
                        onChange={(e) => handleInputChange('political_support', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="ml-2 w-6 text-center">
                        {currentProject.political_support || 3}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="regulatory-challenges">
                      Regulatory Challenges
                    </Label>
                    <div className="flex items-center mt-1">
                      <input 
                        type="range" 
                        min="1" 
                        max="5" 
                        value={currentProject.regulatory_challenges || 3}
                        onChange={(e) => handleInputChange('regulatory_challenges', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="ml-2 w-6 text-center">
                        {currentProject.regulatory_challenges || 3}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setActiveTab('list');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={saveProject}
                disabled={isLoading}
                className="flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update Project' : 'Save Project'}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="import">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-sm mb-2">Export Data</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Export all historical project data as JSON
                  </p>
                  
                  <Button
                    onClick={exportProjects}
                    variant="outline"
                    className="flex items-center"
                    disabled={historicalProjects.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export {historicalProjects.length} Projects
                  </Button>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm mb-2">Import Data</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Import historical project data from JSON
                  </p>
                  
                  <Textarea
                    value={importData}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImportData(e.target.value)}
                    placeholder='[{"title": "Example Project", ...}]'
                    className="font-mono text-xs h-40 mb-3"
                  />
                  
                  <Button
                    onClick={processImport}
                    disabled={isLoading || !importData}
                    className="flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Projects
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md border mt-4">
                <h3 className="font-medium text-sm mb-2">Import Format</h3>
                <p className="text-xs text-gray-500 mb-2">
                  Import data should be a JSON array of objects with the following structure:
                </p>
                <pre className="bg-white p-3 rounded text-xs overflow-auto max-h-60">
{`[
  {
    "title": "Highway 101 Expansion",
    "description": "Expansion of Highway 101 from 4 to 6 lanes",
    "primary_category": "highway",
    "start_date": "2018-03-15",
    "end_date": "2021-06-30",
    "planned_end_date": "2020-12-31",
    "status": "completed",
    "completion_status": "completed_late",
    "initial_cost_estimate": 25000000,
    "final_cost": 32500000,
    "funding_sources": ["Federal Highway Fund", "State Transportation Fund"],
    "funding_success": "fully_funded",
    "challenges": ["Weather delays", "Supply chain issues"],
    "success_factors": ["Strong project management", "Community support"],
    "community_support_level": 4,
    "environmental_complexity": 3,
    "technical_complexity": 4,
    "political_support": 5,
    "regulatory_challenges": 3
  }
]`}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 