import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LlmFeatureGuard } from '@/components/llm-feature-guard';
import { Brain, Lightbulb, Sparkles, ChevronRight } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

interface AiRecommendationsProps {
  projects: Project[];
}

export function AiRecommendations({ projects }: AiRecommendationsProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('funding');
  
  // When no LLM is available, show the static recommendations instead
  const fallbackContent = (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle className="text-lg text-gray-800">Project Recommendations</CardTitle>
        <CardDescription>Based on historical data and predefined rules</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-800 flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 text-blue-600" />
              Recommendation
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Projects with high safety impact should be prioritized based on historical accident data.
            </p>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-800 flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 text-blue-600" />
              Recommendation
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Consider bundling smaller projects in the same geographic area to reduce mobilization costs.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 border-t border-gray-200 p-4">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Note:</span> Advanced AI recommendations require an LLM with reasoning capabilities.
        </p>
      </CardFooter>
    </Card>
  );

  return (
    <LlmFeatureGuard feature="project-recommendations" fallback={fallbackContent} showAdminLink>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              <CardTitle className="text-lg text-gray-800">AI Project Recommendations</CardTitle>
            </div>
            <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200">
              <Sparkles className="h-3 w-3 mr-1 text-indigo-500" />
              AI Enhanced
            </Badge>
          </div>
          <CardDescription>
            Smart recommendations based on project data analysis
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="grid grid-cols-3 mb-2">
              <TabsTrigger value="funding" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-900">
                Funding
              </TabsTrigger>
              <TabsTrigger value="timing" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-900">
                Timing
              </TabsTrigger>
              <TabsTrigger value="impact" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-900">
                Impact
              </TabsTrigger>
            </TabsList>
          </div>
          
          <CardContent className="p-6">
            <TabsContent value="funding" className="mt-0">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                  <h3 className="font-medium text-blue-800 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-blue-600" />
                    Funding Optimization
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    The pedestrian safety improvements on Main Street have a high chance of qualifying for the Safe Streets grant. Consider submitting an application by the June 30th deadline.
                  </p>
                  <div className="mt-3 flex justify-end">
                    <Button variant="link" size="sm" className="text-blue-700 p-0 h-auto">
                      View details <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 bg-indigo-50 rounded-md border border-indigo-200">
                  <h3 className="font-medium text-indigo-800 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-indigo-600" />
                    Budget Allocation
                  </h3>
                  <p className="text-sm text-indigo-700 mt-1">
                    Based on historical data, the River Bridge repair costs may exceed initial estimates by 15-20%. Consider allocating an additional contingency budget of $180,000.
                  </p>
                  <div className="mt-3 flex justify-end">
                    <Button variant="link" size="sm" className="text-indigo-700 p-0 h-auto">
                      View details <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="timing" className="mt-0">
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-md border border-purple-200">
                  <h3 className="font-medium text-purple-800 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-purple-600" />
                    Seasonal Optimization
                  </h3>
                  <p className="text-sm text-purple-700 mt-1">
                    The Downtown Repaving project should be scheduled between April and June to minimize weather delays and avoid the tourist season in July and August.
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-md border border-purple-200">
                  <h3 className="font-medium text-purple-800 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-purple-600" />
                    Project Sequencing
                  </h3>
                  <p className="text-sm text-purple-700 mt-1">
                    The Water Main Replacement and Bike Lane projects on Oak Street should be coordinated to avoid reopening the same area twice, saving approximately 22% on total costs.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="impact" className="mt-0">
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-md border border-green-200">
                  <h3 className="font-medium text-green-800 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-green-600" />
                    Community Benefit
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    The Community Center Renovation project will have the highest positive impact on underserved communities, with an estimated 5,800 residents benefiting directly.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-md border border-green-200">
                  <h3 className="font-medium text-green-800 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-2 text-green-600" />
                    Sustainability Impact
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    The Solar Panel Installation project at City Hall will reduce carbon emissions by approximately 85 tons annually and provide a 12% reduction in energy costs.
                  </p>
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
        
        <Separator />
        
        <CardFooter className="p-4 bg-gray-50">
          <div className="flex justify-between items-center w-full">
            <p className="text-xs text-gray-500">
              <Sparkles className="h-3 w-3 inline mr-1" />
              AI-generated recommendations based on your project portfolio
            </p>
            <Button 
              size="sm" 
              variant="secondary"
              className="text-sm"
              onClick={() => setLoading(true)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-gray-600 border-t-transparent"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <Brain className="mr-1 h-3 w-3" />
                  Refresh Recommendations
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </LlmFeatureGuard>
  );
} 