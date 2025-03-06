'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Calendar, 
  Tag, 
  Bookmark, 
  Plus, 
  X, 
  Save, 
  Download
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface Project {
  id: string;
  title: string;
}

interface SavedFilter {
  id: string;
  name: string;
  query: string;
  projectId: string;
  dateRange: string;
  sentiment: string;
  status: string;
}

interface FeedbackSearchProps {
  projects: Project[];
  agencyId: string;
  initialQuery?: string;
  initialProjectId?: string;
  initialDateRange?: string;
  initialSentiment?: string;
  initialStatus?: string;
}

export function FeedbackSearch({
  projects,
  agencyId,
  initialQuery = '',
  initialProjectId = '',
  initialDateRange = '30',
  initialSentiment = '',
  initialStatus = ''
}: FeedbackSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Search and filter state
  const [query, setQuery] = useState(initialQuery);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [sentiment, setSentiment] = useState(initialSentiment);
  const [status, setStatus] = useState(initialStatus);
  
  // Saved filters state
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [isSaveFilterDialogOpen, setIsSaveFilterDialogOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  
  // Load initial values from URL query params
  useEffect(() => {
    if (searchParams) {
      const q = searchParams.get('q') || initialQuery;
      const project = searchParams.get('project_id') || initialProjectId;
      const date = searchParams.get('date_range') || initialDateRange;
      const sent = searchParams.get('sentiment') || initialSentiment;
      const stat = searchParams.get('status') || initialStatus;
      
      setQuery(q);
      setProjectId(project);
      setDateRange(date);
      setSentiment(sent);
      setStatus(stat);
    } else {
      // Use initial values if searchParams is null
      setQuery(initialQuery);
      setProjectId(initialProjectId);
      setDateRange(initialDateRange);
      setSentiment(initialSentiment);
      setStatus(initialStatus);
    }
  }, [searchParams, initialQuery, initialProjectId, initialDateRange, initialSentiment, initialStatus]);
  
  // Load saved filters from local storage
  useEffect(() => {
    const loadSavedFilters = () => {
      try {
        const savedFiltersString = localStorage.getItem(`feedback_filters_${agencyId}`);
        if (savedFiltersString) {
          setSavedFilters(JSON.parse(savedFiltersString));
        }
      } catch (error) {
        console.error('Error loading saved filters:', error);
      }
    };
    
    loadSavedFilters();
  }, [agencyId]);
  
  // Handle search submission
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (query) params.set('q', query);
    if (projectId) params.set('project_id', projectId);
    if (dateRange) params.set('date_range', dateRange);
    if (sentiment) params.set('sentiment', sentiment);
    if (status) params.set('status', status);
    
    // Navigate to search results
    router.push(`/community/feedback?${params.toString()}`);
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setQuery('');
    setProjectId('');
    setDateRange('30');
    setSentiment('');
    setStatus('');
    
    router.push('/community/feedback');
  };
  
  // Save current filter
  const handleSaveFilter = () => {
    if (!newFilterName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your filter",
        variant: "destructive",
      });
      return;
    }
    
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name: newFilterName,
      query,
      projectId,
      dateRange,
      sentiment,
      status
    };
    
    const updatedFilters = [...savedFilters, newFilter];
    
    try {
      localStorage.setItem(`feedback_filters_${agencyId}`, JSON.stringify(updatedFilters));
      setSavedFilters(updatedFilters);
      setNewFilterName('');
      setIsSaveFilterDialogOpen(false);
      
      toast({
        title: "Success",
        description: `Filter "${newFilterName}" has been saved`,
      });
    } catch (error) {
      console.error('Error saving filter:', error);
      toast({
        title: "Error",
        description: "Failed to save filter",
        variant: "destructive",
      });
    }
  };
  
  // Apply saved filter
  const handleApplySavedFilter = (filter: SavedFilter) => {
    setQuery(filter.query);
    setProjectId(filter.projectId);
    setDateRange(filter.dateRange);
    setSentiment(filter.sentiment);
    setStatus(filter.status);
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filter.query) params.set('q', filter.query);
    if (filter.projectId) params.set('project_id', filter.projectId);
    if (filter.dateRange) params.set('date_range', filter.dateRange);
    if (filter.sentiment) params.set('sentiment', filter.sentiment);
    if (filter.status) params.set('status', filter.status);
    
    // Navigate to search results
    router.push(`/community/feedback?${params.toString()}`);
  };
  
  // Delete saved filter
  const handleDeleteSavedFilter = (id: string) => {
    const updatedFilters = savedFilters.filter(filter => filter.id !== id);
    
    try {
      localStorage.setItem(`feedback_filters_${agencyId}`, JSON.stringify(updatedFilters));
      setSavedFilters(updatedFilters);
      
      toast({
        title: "Success",
        description: "Filter has been deleted",
      });
    } catch (error) {
      console.error('Error deleting filter:', error);
      toast({
        title: "Error",
        description: "Failed to delete filter",
        variant: "destructive",
      });
    }
  };
  
  // Export current search results
  const handleExportResults = async () => {
    try {
      // Build query parameters for API call
      const params = new URLSearchParams();
      
      if (query) params.set('q', query);
      if (projectId) params.set('project_id', projectId);
      if (dateRange) {
        const days = parseInt(dateRange);
        const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
        params.set('start_date', startDate);
      }
      if (sentiment) params.set('sentiment', sentiment);
      if (status) params.set('status', status);
      params.set('agency_id', agencyId);
      params.set('export', 'true');
      
      const response = await fetch(`/api/community/feedback/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export feedback');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feedback_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export Successful",
        description: "Your feedback data has been exported successfully",
      });
    } catch (error) {
      console.error('Error exporting feedback:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export feedback data. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Format date range for display
  const getDateRangeDisplay = () => {
    switch (dateRange) {
      case '7':
        return 'Last 7 days';
      case '30':
        return 'Last 30 days';
      case '90':
        return 'Last 90 days';
      case '365':
        return 'Last year';
      default:
        return 'All time';
    }
  };
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Search className="mr-2 h-5 w-5" />
          Search Feedback
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search feedback content..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button type="submit">Search</Button>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {/* Project filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="mr-2 h-4 w-4" />
                  Project
                  {projectId && <Badge className="ml-2 bg-blue-500" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Filter by Project</h4>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Projects</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Date range filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Calendar className="mr-2 h-4 w-4" />
                  {getDateRangeDisplay()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Filter by Date</h4>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                      <SelectItem value="">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Sentiment filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Tag className="mr-2 h-4 w-4" />
                  Sentiment
                  {sentiment && (
                    <Badge 
                      className={`ml-2 ${
                        sentiment === 'positive' ? 'bg-green-500' :
                        sentiment === 'negative' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}
                    />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Filter by Sentiment</h4>
                  <Select value={sentiment} onValueChange={setSentiment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sentiment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sentiments</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Status filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="mr-2 h-4 w-4" />
                  Status
                  {status && <Badge className="ml-2 bg-purple-500" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium">Filter by Status</h4>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Clear filters */}
            {(query || projectId || dateRange !== '30' || sentiment || status) && (
              <Button variant="ghost" size="sm" className="h-8" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Bookmark className="mr-2 h-4 w-4" />
                Saved Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Saved Filters</h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => setIsSaveFilterDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {savedFilters.length === 0 ? (
                  <p className="text-sm text-gray-500">No saved filters</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {savedFilters.map(filter => (
                      <div 
                        key={filter.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded-md"
                      >
                        <button
                          className="flex-1 text-left text-sm"
                          onClick={() => handleApplySavedFilter(filter)}
                        >
                          {filter.name}
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteSavedFilter(filter.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsSaveFilterDialogOpen(true)}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Current Filter
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExportResults}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Results
        </Button>
      </CardFooter>
      
      {/* Save Filter Dialog */}
      <Dialog open={isSaveFilterDialogOpen} onOpenChange={setIsSaveFilterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Give your filter a name to save it for future use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Filter Name</Label>
              <Input
                id="filter-name"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                placeholder="My Custom Filter"
              />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Filter Settings</p>
              <div className="text-sm">
                {query && (
                  <div className="flex gap-2">
                    <span className="font-medium">Query:</span>
                    <span>{query}</span>
                  </div>
                )}
                {projectId && (
                  <div className="flex gap-2">
                    <span className="font-medium">Project:</span>
                    <span>{projects.find(p => p.id === projectId)?.title || projectId}</span>
                  </div>
                )}
                {dateRange && (
                  <div className="flex gap-2">
                    <span className="font-medium">Date Range:</span>
                    <span>{getDateRangeDisplay()}</span>
                  </div>
                )}
                {sentiment && (
                  <div className="flex gap-2">
                    <span className="font-medium">Sentiment:</span>
                    <span className="capitalize">{sentiment}</span>
                  </div>
                )}
                {status && (
                  <div className="flex gap-2">
                    <span className="font-medium">Status:</span>
                    <span className="capitalize">{status}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveFilterDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFilter}>Save Filter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 