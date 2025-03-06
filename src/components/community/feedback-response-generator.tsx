'use client';

import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

export interface FeedbackResponseGeneratorProps {
  feedback_ids: string[];
  agency_id: string;
  onClose: () => void;
  onResponseGenerated: (response: string) => Promise<void>;
  isBulk?: boolean;
}

export function FeedbackResponseGenerator({
  feedback_ids,
  agency_id,
  onClose,
  onResponseGenerated,
  isBulk = false,
}: FeedbackResponseGeneratorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [responseText, setResponseText] = useState('');

  // Generate response
  const generateResponse = async () => {
    if (feedback_ids.length === 0) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/community/feedback/generate-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback_ids,
          agency_id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate response');
      }
      
      const data = await response.json();
      setGeneratedResponse(data.response);
      setResponseText(data.response);
      
      toast({
        title: 'Response generated',
        description: 'AI-generated response is ready for review and editing.',
      });
    } catch (error) {
      console.error('Error generating response:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate response. Please try again or create one manually.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle response submission
  const handleSubmit = async () => {
    if (!responseText.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a response',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await onResponseGenerated(responseText);
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isBulk
              ? `Respond to ${feedback_ids.length} feedback items`
              : 'Respond to feedback'}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? 'The same response will be added to all selected feedback items.'
              : 'Craft a response to address the feedback.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!generatedResponse && (
            <Button
              variant="outline"
              onClick={generateResponse}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating response...
                </>
              ) : (
                'Generate AI response'
              )}
            </Button>
          )}
          
          <Textarea
            className="min-h-[150px]"
            placeholder="Type your response..."
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
          />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Response
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 