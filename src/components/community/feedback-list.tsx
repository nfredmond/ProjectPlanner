'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ThumbsUp, ThumbsDown, MessageSquare, Check, X } from 'lucide-react';
import { FeedbackResponseGenerator } from './feedback-response-generator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define type for sentiment
type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';

type Feedback = {
  id: string;
  project_id: string;
  content: string;
  sentiment?: SentimentType;
  status: 'pending' | 'approved' | 'rejected';
  upvotes: number;
  downvotes: number;
  created_at: string;
  official_response?: string;
  user_id?: string;
  response?: string;
  projects?: {
    id: string;
    title: string;
    description?: string;
    primary_category?: string;
  };
};

interface FeedbackListProps {
  feedback: Feedback[];
  projectId?: string;
  enableResponses?: boolean;
  enableModeration?: boolean;
  onStatusChange?: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  onResponseSaved?: (id: string, response: string) => void;
}

export function FeedbackList({
  feedback,
  projectId,
  enableResponses = false,
  enableModeration = false,
  onStatusChange,
  onResponseSaved
}: FeedbackListProps) {
  const { toast } = useToast();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [showResponseInput, setShowResponseInput] = useState<Record<string, boolean>>({});
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<Record<string, boolean>>({});
  const [showModerationDialog, setShowModerationDialog] = useState(false);
  const [currentFeedbackId, setCurrentFeedbackId] = useState<string | null>(null);
  const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  if (!feedback || feedback.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No feedback available.
      </div>
    );
  }
  
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    if (onStatusChange) {
      await onStatusChange(id, status);
    }
  };
  
  const handleResponseSaved = (id: string, response: string) => {
    setRespondingTo(null);
    if (onResponseSaved) {
      onResponseSaved(id, response);
    }
  };
  
  const handleResponseChange = (id: string, text: string): Promise<void> => {
    setResponses((prev) => ({
      ...prev,
      [id]: text,
    }));
    return Promise.resolve();
  };
  
  const toggleResponseInput = (id: string) => {
    setShowResponseInput(prev => ({ 
      ...prev, 
      [id]: !prev[id] 
    }));
  };
  
  const submitResponse = async (id: string) => {
    try {
      setIsSubmitting(prev => ({ ...prev, [id]: true }));
      
      const response = await fetch('/api/community/feedback/response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId: id,
          response: responses[id]
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit response');
      }
      
      toast({
        title: 'Response Submitted',
        description: 'Your response has been successfully submitted.',
      });
      
      // Update local state
      const updatedFeedback = feedback.map(item => {
        if (item.id === id) {
          return { ...item, response: responses[id] };
        }
        return item;
      });
      
      // Hide the response input
      setShowResponseInput(prev => ({ ...prev, [id]: false }));
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };
  
  const handleModerationRequest = (id: string, action: 'approve' | 'reject') => {
    setCurrentFeedbackId(id);
    setModerationAction(action);
    setShowModerationDialog(true);
  };
  
  const submitModerationAction = async () => {
    if (!currentFeedbackId || !moderationAction) return;
    
    try {
      const response = await fetch('/api/community/feedback/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId: currentFeedbackId,
          action: moderationAction
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to moderate feedback');
      }
      
      toast({
        title: 'Feedback Updated',
        description: `Feedback has been ${moderationAction === 'approve' ? 'approved' : 'rejected'}.`,
      });
      
      // Close dialog
      setShowModerationDialog(false);
      setCurrentFeedbackId(null);
      setModerationAction(null);
    } catch (error) {
      console.error('Error moderating feedback:', error);
      toast({
        title: 'Error',
        description: 'Failed to update feedback status. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  const analyzeSentiment = async (id: string) => {
    try {
      setIsSubmitting(prev => ({ ...prev, [id]: true }));
      
      const response = await fetch('/api/community/feedback/sentiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbackId: id
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze sentiment');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Sentiment Analyzed',
        description: `Feedback sentiment: ${result.sentiment}`,
      });
      
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      toast({
        title: 'Error',
        description: 'Failed to analyze sentiment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };
  
  const sentimentColors: Record<string, string> = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-600',
    mixed: 'text-amber-600'
  };
  
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };
  
  const sentimentIcons: Record<SentimentType, React.ReactNode> = {
    positive: <ThumbsUp className="h-4 w-4 text-green-600" />,
    negative: <ThumbsDown className="h-4 w-4 text-red-600" />,
    neutral: <div className="h-4 w-4 border border-gray-400 rounded-full" />,
    mixed: <div className="flex"><ThumbsUp className="h-4 w-4 text-green-600" /><ThumbsDown className="h-4 w-4 text-red-600" /></div>
  };
  
  // Filter feedback based on the active tab
  const filteredFeedback = activeTab === 'all' 
    ? feedback
    : feedback.filter(item => {
        if (activeTab === 'positive') return item.sentiment === 'positive';
        if (activeTab === 'negative') return item.sentiment === 'negative';
        if (activeTab === 'neutral') return item.sentiment === 'neutral';
        if (activeTab === 'mixed') return item.sentiment === 'mixed';
        return true;
      });
  
  return (
    <>
      {feedback.length > 0 && (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="positive">Positive</TabsTrigger>
            <TabsTrigger value="negative">Negative</TabsTrigger>
            <TabsTrigger value="neutral">Neutral</TabsTrigger>
            <TabsTrigger value="mixed">Mixed</TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      
      <div className="space-y-4">
        {filteredFeedback.map((item) => (
          <Card key={item.id} className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">
                    Feedback for {item.projects?.title || 'Project'}
                  </CardTitle>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.sentiment && sentimentIcons[item.sentiment as SentimentType] && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      {sentimentIcons[item.sentiment as SentimentType]}
                      <span className="capitalize">{item.sentiment}</span>
                    </Badge>
                  )}
                  <Badge
                    variant={
                      item.status === 'approved' 
                        ? 'success' 
                        : item.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm">{item.content}</div>
              
              {item.response && (
                <div className="mt-4 bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Agency Response
                  </div>
                  <div className="text-sm">{item.response}</div>
                </div>
              )}
              
              {showResponseInput[item.id] && (
                <div className="mt-4">
                  <Textarea 
                    placeholder="Write a response..."
                    value={responses[item.id] || ''}
                    onChange={(e) => handleResponseChange(item.id, e.target.value)}
                    className="min-h-[100px]"
                  />
                  
                  {enableResponses && (
                    <div className="mt-2">
                      <FeedbackResponseGenerator
                        feedback_ids={[item.id]}
                        agency_id={item.project_id || ''}
                        onClose={() => {}}
                        onResponseGenerated={(response: string) => handleResponseChange(item.id, response)}
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-between pt-0">
              <div className="flex space-x-2">
                {enableResponses && (
                  <>
                    {showResponseInput[item.id] ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => submitResponse(item.id)}
                          disabled={!responses[item.id] || isSubmitting[item.id]}
                        >
                          Submit Response
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleResponseInput(item.id)}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant={item.response ? 'outline' : 'default'}
                        onClick={() => toggleResponseInput(item.id)}
                      >
                        {item.response ? 'Update Response' : 'Add Response'}
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              <div className="flex space-x-2">
                {enableModeration && item.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600"
                      onClick={() => handleModerationRequest(item.id, 'approve')}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleModerationRequest(item.id, 'reject')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                
                {!item.sentiment && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => analyzeSentiment(item.id)}
                    disabled={isSubmitting[item.id]}
                  >
                    Analyze Sentiment
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
        
        {filteredFeedback.length === 0 && (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No feedback items match the selected filter.</p>
          </div>
        )}
      </div>
      
      <AlertDialog open={showModerationDialog} onOpenChange={setShowModerationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {moderationAction === 'approve' ? 'Approve Feedback' : 'Reject Feedback'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {moderationAction === 'approve'
                ? 'This feedback will be visible to the public. Are you sure you want to approve it?'
                : 'This feedback will be hidden from the public. Are you sure you want to reject it?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitModerationAction}>
              {moderationAction === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 