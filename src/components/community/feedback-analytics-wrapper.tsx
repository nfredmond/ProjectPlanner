'use client';

import React, { useState } from 'react';
import { FeedbackAnalytics } from '@/components/community/feedback-analytics';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface FeedbackAnalyticsWrapperProps {
  feedbackItems: any[];
  agencyId: string;
  projectId?: string;
}

export function FeedbackAnalyticsWrapper({
  feedbackItems,
  agencyId,
  projectId
}: FeedbackAnalyticsWrapperProps) {
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const handleSummarizeFeedback = async () => {
    try {
      // Determine which API endpoint to call based on whether we're viewing project-specific or all feedback
      const endpoint = `/api/llm/feedback-response`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'summarize_feedback',
          projectId: projectId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to summarize feedback');
      }
      
      const result = await response.json();
      
      return result;
    } catch (error) {
      console.error('Error summarizing feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to summarize feedback. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleBatchSentimentAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      // Find feedback items that don't have sentiment analyzed yet
      const unanalyzedFeedback = feedbackItems.filter(item => !item.sentiment || item.sentiment === 'not analyzed');
      
      if (unanalyzedFeedback.length === 0) {
        toast({
          title: 'Info',
          description: 'All feedback items already have sentiment analysis',
        });
        return { processed: 0 };
      }
      
      let processedCount = 0;
      
      // Process in batches to avoid overloading the API
      for (const feedback of unanalyzedFeedback) {
        const response = await fetch('/api/llm/feedback-response', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'analyze_sentiment',
            feedbackId: feedback.id
          })
        });
        
        if (response.ok) {
          processedCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast({
        title: 'Success',
        description: `Analyzed sentiment for ${processedCount} feedback items`,
      });
      
      // Return processed count so the UI can update or refresh if needed
      return { processed: processedCount };
    } catch (error) {
      console.error('Error analyzing batch sentiment:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze sentiment for some feedback items',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {!projectId && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={handleBatchSentimentAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze All Feedback Sentiment
          </Button>
        </div>
      )}
      
      <FeedbackAnalytics 
        feedbackItems={feedbackItems}
        projectId={projectId}
        onSummarizeFeedback={handleSummarizeFeedback}
        onAnalyzeSentiment={handleBatchSentimentAnalysis}
      />
    </div>
  );
} 