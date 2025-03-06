'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Edit, MessageSquare, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';

interface ResponseApprovalProps {
  agencyId: string;
}

interface AutomatedResponse {
  id: string;
  feedback_id: string;
  content: string;
  is_automated: boolean;
  is_approved: boolean | null;
  created_at: string;
  feedback: {
    id: string;
    content: string;
    sentiment: string;
    project_id: string;
    projects: {
      id: string;
      title: string;
    } | null;
  };
  template: {
    id: string;
    name: string;
  } | null;
}

export function ResponseApproval({ agencyId }: ResponseApprovalProps) {
  const [pendingResponses, setPendingResponses] = useState<AutomatedResponse[]>([]);
  const [approvedResponses, setApprovedResponses] = useState<AutomatedResponse[]>([]);
  const [rejectedResponses, setRejectedResponses] = useState<AutomatedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingResponse, setEditingResponse] = useState<AutomatedResponse | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [sendEditedImmediately, setSendEditedImmediately] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchResponses();
  }, []);
  
  const fetchResponses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/community/responses');
      
      if (!response.ok) {
        throw new Error('Failed to fetch responses');
      }
      
      const data = await response.json();
      
      // Sort responses by most recent first
      const sortedResponses = data.sort((a: AutomatedResponse, b: AutomatedResponse) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      // Split responses by approval status
      const pending = sortedResponses.filter((r: AutomatedResponse) => r.is_approved === null);
      const approved = sortedResponses.filter((r: AutomatedResponse) => r.is_approved === true);
      const rejected = sortedResponses.filter((r: AutomatedResponse) => r.is_approved === false);
      
      setPendingResponses(pending);
      setApprovedResponses(approved);
      setRejectedResponses(rejected);
    } catch (error) {
      console.error('Error fetching responses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load automated responses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleApprove = async (response: AutomatedResponse) => {
    try {
      const apiResponse = await fetch(`/api/community/responses/${response.id}/approve`, {
        method: 'POST',
      });
      
      if (!apiResponse.ok) {
        throw new Error('Failed to approve response');
      }
      
      // Move from pending to approved
      setPendingResponses(pendingResponses.filter(r => r.id !== response.id));
      setApprovedResponses([response, ...approvedResponses]);
      
      toast({
        title: 'Response Approved',
        description: 'The response has been approved and will be sent to the community member.',
      });
    } catch (error) {
      console.error('Error approving response:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve response',
        variant: 'destructive',
      });
    }
  };
  
  const handleReject = async (response: AutomatedResponse) => {
    try {
      const apiResponse = await fetch(`/api/community/responses/${response.id}/reject`, {
        method: 'POST',
      });
      
      if (!apiResponse.ok) {
        throw new Error('Failed to reject response');
      }
      
      // Move from pending to rejected
      setPendingResponses(pendingResponses.filter(r => r.id !== response.id));
      setRejectedResponses([response, ...rejectedResponses]);
      
      toast({
        title: 'Response Rejected',
        description: 'The response has been rejected and will not be sent.',
      });
    } catch (error) {
      console.error('Error rejecting response:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject response',
        variant: 'destructive',
      });
    }
  };
  
  const handleEdit = (response: AutomatedResponse) => {
    setEditingResponse(response);
    setEditedContent(response.content);
    setSendEditedImmediately(false);
  };
  
  const handleSaveEdit = async () => {
    if (!editingResponse) return;
    
    try {
      const apiResponse = await fetch(`/api/community/responses/${editingResponse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
          is_approved: sendEditedImmediately,
        }),
      });
      
      if (!apiResponse.ok) {
        throw new Error('Failed to update response');
      }
      
      const updatedResponse = await apiResponse.json();
      
      // Update lists based on approval status
      if (sendEditedImmediately) {
        // Remove from pending, add to approved
        setPendingResponses(pendingResponses.filter(r => r.id !== editingResponse.id));
        setApprovedResponses([updatedResponse, ...approvedResponses]);
      } else {
        // Update in pending list
        setPendingResponses(pendingResponses.map(r => 
          r.id === editingResponse.id ? {...r, content: editedContent} : r
        ));
      }
      
      setEditingResponse(null);
      
      toast({
        title: 'Response Updated',
        description: sendEditedImmediately 
          ? 'The response has been updated and approved for sending.' 
          : 'The response has been updated and is still pending approval.',
      });
    } catch (error) {
      console.error('Error updating response:', error);
      toast({
        title: 'Error',
        description: 'Failed to update response',
        variant: 'destructive',
      });
    }
  };
  
  const renderResponseCard = (response: AutomatedResponse, actions: React.ReactNode) => (
    <Card key={response.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {response.feedback.projects ? (
                <>Feedback on: {response.feedback.projects.title}</>
              ) : (
                <>General Feedback</>
              )}
            </CardTitle>
            <CardDescription>
              Generated {format(new Date(response.created_at), 'MMM d, yyyy h:mm a')}
              {response.template && (
                <Badge variant="outline" className="ml-2">
                  Template: {response.template.name}
                </Badge>
              )}
            </CardDescription>
          </div>
          <Badge variant={
            response.is_approved === null ? 'outline' :
            response.is_approved ? 'success' : 'destructive'
          }>
            {response.is_approved === null ? 'Pending' :
             response.is_approved ? 'Approved' : 'Rejected'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700 font-medium mb-1">Original Feedback:</p>
          <p className="text-sm">{response.feedback.content}</p>
          {response.feedback.sentiment && (
            <Badge variant="outline" className="mt-2">
              Sentiment: {response.feedback.sentiment}
            </Badge>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700 font-medium mb-1">Generated Response:</p>
          <p className="text-sm">{response.content}</p>
        </div>
      </CardContent>
      {actions && (
        <CardFooter className="pt-0">
          {actions}
        </CardFooter>
      )}
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Response Approval</h2>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Loading responses...</div>
      ) : (
        <Tabs defaultValue="pending" className="w-full">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Pending
              {pendingResponses.length > 0 && (
                <Badge variant="outline" className="ml-2">{pendingResponses.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approved
              {approvedResponses.length > 0 && (
                <Badge variant="outline" className="ml-2">{approvedResponses.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center">
              <XCircle className="mr-2 h-4 w-4" />
              Rejected
              {rejectedResponses.length > 0 && (
                <Badge variant="outline" className="ml-2">{rejectedResponses.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            {pendingResponses.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-700">No Pending Responses</h3>
                <p className="mt-2 text-gray-500">
                  All automated responses have been reviewed.
                </p>
              </div>
            ) : (
              pendingResponses.map(response => 
                renderResponseCard(response, (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEdit(response)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleReject(response)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => handleApprove(response)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                ))
              )
            )}
          </TabsContent>
          
          <TabsContent value="approved" className="mt-6">
            {approvedResponses.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-700">No Approved Responses</h3>
                <p className="mt-2 text-gray-500">
                  No responses have been approved yet.
                </p>
              </div>
            ) : (
              approvedResponses.map(response => renderResponseCard(response, null))
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="mt-6">
            {rejectedResponses.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <XCircle className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-700">No Rejected Responses</h3>
                <p className="mt-2 text-gray-500">
                  No responses have been rejected.
                </p>
              </div>
            ) : (
              rejectedResponses.map(response => renderResponseCard(response, null))
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Edit Response Dialog */}
      <Dialog open={!!editingResponse} onOpenChange={(open) => !open && setEditingResponse(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Response</DialogTitle>
            <DialogDescription>
              Edit the automated response before approving.
            </DialogDescription>
          </DialogHeader>
          
          {editingResponse && (
            <>
              <div className="mb-4 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700 font-medium mb-1">Original Feedback:</p>
                <p className="text-sm">{editingResponse.feedback.content}</p>
              </div>
              
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={8}
                className="mt-2"
              />
              
              <div className="flex items-center space-x-2 mt-2">
                <Checkbox
                  id="approve-immediately"
                  checked={sendEditedImmediately}
                  onCheckedChange={(checked) => setSendEditedImmediately(!!checked)}
                />
                <Label htmlFor="approve-immediately">
                  Approve and send immediately
                </Label>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditingResponse(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 