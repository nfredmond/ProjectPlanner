import React from 'react';
import Link from 'next/link';
import { Award, Map, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ProjectDetailSidebarProps {
  project: any;
  scores?: any[];
}

export default function ProjectDetailSidebar({ project, scores = [] }: ProjectDetailSidebarProps) {
  // Calculate overall score
  const overallScore = scores?.length > 0
    ? Math.round(scores.reduce((sum, score) => sum + score.score, 0) / scores.length)
    : 0;
  
  const maxScore = scores?.length > 0 && scores[0]?.criteria?.max_score
    ? scores[0].criteria.max_score
    : 100;
  
  const scorePercentage = maxScore > 0 ? (overallScore / maxScore) * 100 : 0;
  
  return (
    <div className="space-y-4">
      {/* Project Score Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Project Score</CardTitle>
          <CardDescription>Overall project evaluation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-rtpa-blue-600">{overallScore}</div>
            <div className="text-sm text-gray-500">out of {maxScore} points</div>
          </div>
          <Progress value={scorePercentage} className="h-2 mt-2" />
          
          {scores?.length > 0 ? (
            <div className="mt-4 space-y-2">
              {scores.slice(0, 3).map((score) => (
                <div key={score.id || score.criteria?.id} className="flex justify-between items-center text-sm">
                  <span>{score.criteria?.name || 'Criterion'}</span>
                  <span className="font-medium">{score.score}/{score.criteria?.max_score || maxScore}</span>
                </div>
              ))}
              {scores.length > 3 && (
                <div className="text-center mt-2">
                  <span className="text-xs text-rtpa-blue-600">+ {scores.length - 3} more criteria</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500 mt-2">
              No scores available
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Project Actions Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Project Actions</CardTitle>
          <CardDescription>Tools and resources</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Link href={`/map?project=${project.id}`} className="w-full">
            <Button variant="outline" className="w-full flex items-center justify-center">
              <Map className="h-4 w-4 mr-2" />
              View on Map
            </Button>
          </Link>
          
          <Link href={`/reports/generate?project=${project.id}`} className="w-full">
            <Button variant="outline" className="w-full flex items-center justify-center">
              <FileText className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </Link>
          
          <Link href={`/projects/${project.id}/grant-analysis`} className="w-full">
            <Button variant="outline" className="w-full flex items-center justify-center">
              <Award className="h-4 w-4 mr-2" />
              Grant Analysis
            </Button>
          </Link>
        </CardContent>
      </Card>
      
      {/* Project Timeline Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Timeline</CardTitle>
          <CardDescription>Key project dates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-rtpa-blue-600" />
              <span>Created</span>
            </div>
            <span className="text-gray-500">{new Date(project.created_at).toLocaleDateString()}</span>
          </div>
          
          {project.start_date && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-green-600" />
                <span>Start Date</span>
              </div>
              <span className="text-gray-500">{new Date(project.start_date).toLocaleDateString()}</span>
            </div>
          )}
          
          {project.end_date && (
            <div className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-amber-600" />
                <span>End Date</span>
              </div>
              <span className="text-gray-500">{new Date(project.end_date).toLocaleDateString()}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 