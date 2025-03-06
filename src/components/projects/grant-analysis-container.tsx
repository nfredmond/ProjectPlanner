'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GrantProgram } from '@/types/grant-analysis';
import GrantAnalysis from './grant-analysis';
import { format } from 'date-fns';
import { Award, Calendar, FileText, Trash2 } from 'lucide-react';
import { deleteGrantAnalysis } from '@/lib/api/grant-analysis';
import { useToast } from '@/components/ui/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface GrantAnalysisContainerProps {
  projectId: string;
  grantPrograms: GrantProgram[];
  existingAnalyses: any[]; // Using any for simplicity
}

export default function GrantAnalysisContainer({ 
  projectId, 
  grantPrograms, 
  existingAnalyses = [] 
}: GrantAnalysisContainerProps) {
  const [activeTab, setActiveTab] = useState('new-analysis');
  const [analyses, setAnalyses] = useState(existingAnalyses);
  const [viewingAnalysis, setViewingAnalysis] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAnalysisId, setDeletingAnalysisId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDeleteAnalysis = async (analysisId: string) => {
    try {
      await deleteGrantAnalysis(analysisId);
      // Update the analyses state
      setAnalyses(analyses.filter(analysis => analysis.id !== analysisId));
      toast({
        title: "Analysis deleted",
        description: "The grant analysis has been deleted successfully",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      
      // If we were viewing this analysis, go back to new analysis
      if (viewingAnalysis?.id === analysisId) {
        setViewingAnalysis(null);
        setActiveTab('new-analysis');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the analysis",
        variant: "destructive",
      });
    }
  };

  const confirmDelete = (analysisId: string) => {
    setDeletingAnalysisId(analysisId);
    setIsDeleteDialogOpen(true);
  };

  const addNewAnalysis = (newAnalysis: any) => {
    setAnalyses([newAnalysis, ...analyses]);
    toast({
      title: "Analysis complete",
      description: "Grant analysis has been completed and saved",
      variant: "default",
    });
  };

  const viewAnalysis = (analysis: any) => {
    setViewingAnalysis(analysis);
    setActiveTab('view-analysis');
  };

  return (
    <div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="new-analysis">New Analysis</TabsTrigger>
          <TabsTrigger value="view-analysis" disabled={!viewingAnalysis}>
            View Analysis
          </TabsTrigger>
          <TabsTrigger value="history">History ({analyses.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="new-analysis">
          <GrantAnalysis 
            projectId={projectId} 
            grantPrograms={grantPrograms} 
            onAnalysisComplete={addNewAnalysis}
          />
        </TabsContent>
        
        <TabsContent value="view-analysis">
          {viewingAnalysis && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <Award className="h-5 w-5 mr-2" />
                      Grant Analysis {viewingAnalysis.grant_program?.name ? `for ${viewingAnalysis.grant_program.name}` : '(General)'}
                    </CardTitle>
                    <CardDescription>
                      Created on {format(new Date(viewingAnalysis.created_at), 'PPP')}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-more-vertical"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => confirmDelete(viewingAnalysis.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Analysis
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto max-h-[500px]">
                    {viewingAnalysis.raw_response}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Analysis History</CardTitle>
              <CardDescription>
                Previous grant analyses for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>No grant analyses have been run for this project yet.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {analyses.map((analysis) => (
                    <div key={analysis.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-medium text-sm flex items-center">
                            <Award className="h-4 w-4 mr-2 text-rtpa-blue-600" />
                            {analysis.grant_program?.name 
                              ? `Analysis for ${analysis.grant_program.name}` 
                              : 'General Grant Analysis'}
                          </h3>
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(analysis.created_at), 'PPP')}
                          </div>
                          {analysis.model_used && (
                            <div className="text-xs text-gray-500">
                              Model: {analysis.model_used}
                              {analysis.tokens_used ? ` (${analysis.tokens_used} tokens)` : ''}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => viewAnalysis(analysis)}
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => confirmDelete(analysis.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Analysis</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this grant analysis? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deletingAnalysisId && handleDeleteAnalysis(deletingAnalysisId)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 