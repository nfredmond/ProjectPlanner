'use client';

import React, { useState } from 'react';
import { Check, Trash2, MessageSquare, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { FeedbackResponseGenerator } from './feedback-response-generator';

interface FeedbackBulkActionsProps {
  selectedFeedbackIds: string[];
  onStatusChange: (ids: string[], status: 'approved' | 'rejected') => Promise<void>;
  onResponseGenerated: (ids: string[], response: string) => Promise<void>;
  onSelectionClear: () => void;
  agencyId: string;
}

export function FeedbackBulkActions({
  selectedFeedbackIds,
  onStatusChange,
  onResponseGenerated,
  onSelectionClear,
  agencyId
}: FeedbackBulkActionsProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isBulkResponseOpen, setIsBulkResponseOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete'>('approve');
  
  // Show confirmation dialog for bulk actions
  const handleBulkAction = (action: 'approve' | 'reject' | 'delete') => {
    setActionType(action);
    setIsConfirmDialogOpen(true);
  };
  
  // Execute bulk action
  const executeBulkAction = async () => {
    if (selectedFeedbackIds.length === 0) return;
    
    setIsLoading(true);
    
    try {
      if (actionType === 'approve' || actionType === 'reject') {
        // Convert 'approve' to 'approved' and 'reject' to 'rejected'
        const status = actionType === 'approve' ? 'approved' : 'rejected';
        await onStatusChange(selectedFeedbackIds, status);
        
        toast({
          title: 'Success',
          description: `${selectedFeedbackIds.length} feedback items ${actionType === 'approve' ? 'approved' : 'rejected'}.`,
        });
      } else if (actionType === 'delete') {
        // Call API to delete feedback
        const response = await fetch('/api/community/feedback/bulk-delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedback_ids: selectedFeedbackIds,
            agency_id: agencyId,
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete feedback');
        }
        
        toast({
          title: 'Success',
          description: `${selectedFeedbackIds.length} feedback items deleted.`,
        });
      }
      
      onSelectionClear();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        title: 'Error',
        description: `Failed to ${actionType} feedback. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsConfirmDialogOpen(false);
    }
  };
  
  // Handle bulk response generation
  const handleBulkResponseGenerated = async (response: string) => {
    setIsLoading(true);
    
    try {
      await onResponseGenerated(selectedFeedbackIds, response);
      
      toast({
        title: 'Success',
        description: `Response added to ${selectedFeedbackIds.length} feedback items.`,
      });
      
      setIsBulkResponseOpen(false);
      onSelectionClear();
    } catch (error) {
      console.error('Error generating bulk response:', error);
      toast({
        title: 'Error',
        description: 'Failed to add response to feedback items.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get confirmation message based on action type
  const getConfirmationMessage = () => {
    switch (actionType) {
      case 'approve':
        return `Are you sure you want to approve ${selectedFeedbackIds.length} feedback items?`;
      case 'reject':
        return `Are you sure you want to reject ${selectedFeedbackIds.length} feedback items?`;
      case 'delete':
        return `Are you sure you want to delete ${selectedFeedbackIds.length} feedback items? This action cannot be undone.`;
      default:
        return '';
    }
  };
  
  if (selectedFeedbackIds.length === 0) {
    return null;
  }
  
  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
      <div className="font-medium">
        {selectedFeedbackIds.length} item{selectedFeedbackIds.length !== 1 ? 's' : ''} selected
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('approve')}
          disabled={isLoading}
        >
          <Check className="h-4 w-4 mr-2" />
          Approve
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleBulkAction('reject')}
          disabled={isLoading}
        >
          <X className="h-4 w-4 mr-2" />
          Reject
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsBulkResponseOpen(true)}
          disabled={isLoading}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Respond
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              More
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleBulkAction('delete')}>
              <Trash2 className="h-4 w-4 mr-2 text-red-500" />
              <span className="text-red-500">Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onSelectionClear}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {getConfirmationMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeBulkAction}
              disabled={isLoading}
              className={actionType === 'delete' ? 'bg-red-500 hover:bg-red-600' : ''}
            >
              {isLoading ? 'Processing...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Bulk Response Generator */}
      {isBulkResponseOpen && (
        <FeedbackResponseGenerator
          feedback_ids={selectedFeedbackIds}
          agency_id={agencyId}
          onClose={() => setIsBulkResponseOpen(false)}
          onResponseGenerated={handleBulkResponseGenerated}
          isBulk={true}
        />
      )}
    </div>
  );
} 