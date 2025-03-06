'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Edit, Copy, Bot, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

// Template Types
interface ResponseTemplate {
  id: string;
  name: string;
  content: string;
  tone: 'formal' | 'friendly' | 'technical' | 'simple';
  category: string;
  is_active: boolean;
}

interface PendingResponse {
  id: string;
  feedback_id: string;
  content: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  created_at: string;
  template_id: string;
  template_name: string;
  feedback_content: string;
  feedback_sentiment: string;
}

export function ResponseTemplates() {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [pendingResponses, setPendingResponses] = useState<PendingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPending, setIsLoadingPending] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<ResponseTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('templates');
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    tone: 'formal',
    category: 'general',
    is_active: true
  });
  const { toast } = useToast();

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/community/response-templates');
        if (!response.ok) throw new Error('Failed to fetch templates');
        const data = await response.json();
        setTemplates(data);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load response templates',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [toast]);

  // Fetch pending responses
  useEffect(() => {
    const fetchPendingResponses = async () => {
      try {
        const response = await fetch('/api/community/responses?status=pending_approval');
        if (!response.ok) throw new Error('Failed to fetch pending responses');
        const data = await response.json();
        setPendingResponses(data);
      } catch (error) {
        console.error('Error fetching pending responses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load pending responses',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingPending(false);
      }
    };

    if (activeTab === 'approve') {
      fetchPendingResponses();
    }
  }, [activeTab, toast]);

  const handleOpenDialog = (template: ResponseTemplate | null = null) => {
    if (template) {
      setCurrentTemplate(template);
      setFormData({
        name: template.name,
        content: template.content,
        tone: template.tone,
        category: template.category,
        is_active: template.is_active
      });
    } else {
      setCurrentTemplate(null);
      setFormData({
        name: '',
        content: '',
        tone: 'formal',
        category: 'general',
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData({ ...formData, is_active: checked });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const url = currentTemplate 
        ? `/api/community/response-templates/${currentTemplate.id}` 
        : '/api/community/response-templates';
      
      const method = currentTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error('Failed to save template');
      
      const savedTemplate = await response.json();
      
      if (currentTemplate) {
        setTemplates(templates.map(t => t.id === currentTemplate.id ? savedTemplate : t));
      } else {
        setTemplates([...templates, savedTemplate]);
      }
      
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: `Template ${currentTemplate ? 'updated' : 'created'} successfully`,
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save response template',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/community/response-templates/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete template');
      
      setTemplates(templates.filter(t => t.id !== id));
      
      toast({
        title: 'Success',
        description: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete response template',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = (template: ResponseTemplate) => {
    const duplicate = {
      ...template,
      id: crypto.randomUUID(),
      name: `${template.name} (Copy)`,
    };
    handleOpenDialog(duplicate);
  };

  const handleApproveResponse = async (responseId: string) => {
    try {
      const response = await fetch(`/api/community/responses/${responseId}/approve`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to approve response');
      
      setPendingResponses(pendingResponses.filter(r => r.id !== responseId));
      
      toast({
        title: 'Success',
        description: 'Response approved and will be sent to the user',
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

  const handleRejectResponse = async (responseId: string) => {
    try {
      const response = await fetch(`/api/community/responses/${responseId}/reject`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Failed to reject response');
      
      setPendingResponses(pendingResponses.filter(r => r.id !== responseId));
      
      toast({
        title: 'Success',
        description: 'Response rejected',
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

  const handleTestAutoResponse = async (feedbackId: string) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/llm/feedback-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'generate_response',
          feedbackId
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate response');
      
      const result = await response.json();
      
      toast({
        title: 'Success',
        description: 'Automated response generated and pending approval',
      });
      
      // Refresh pending responses
      if (activeTab === 'approve') {
        const pendingResponse = await fetch('/api/community/responses?status=pending_approval');
        if (pendingResponse.ok) {
          const data = await pendingResponse.json();
          setPendingResponses(data);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error generating automated response:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate automated response',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Group templates by category
  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ResponseTemplate[]>);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="templates">Response Templates</TabsTrigger>
          <TabsTrigger value="approve" className="relative">
            Approval Queue
            {pendingResponses.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingResponses.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
      
        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Response Templates</h2>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
          
          {isLoading && <div className="text-center py-8">Loading templates...</div>}
          
          {!isLoading && templates.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <p className="text-lg text-gray-500 mb-4">No response templates found</p>
                  <Button onClick={() => handleOpenDialog()}>Create Your First Template</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-medium capitalize">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTemplates.map(template => (
                    <Card key={template.id} className={`${!template.is_active ? 'opacity-70' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleDuplicate(template)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <CardDescription>
                          Tone: <span className="capitalize">{template.tone}</span>
                          {!template.is_active && <span className="ml-2 text-amber-600">(Inactive)</span>}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-32 overflow-y-auto text-sm text-gray-700">
                          {template.content.length > 150 
                            ? `${template.content.substring(0, 150)}...` 
                            : template.content}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="approve" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Approval Queue</h2>
            <div className="text-sm text-gray-500">
              {pendingResponses.length} pending response{pendingResponses.length !== 1 ? 's' : ''}
            </div>
          </div>
          
          {isLoadingPending && <div className="text-center py-8">Loading pending responses...</div>}
          
          {!isLoadingPending && pendingResponses.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <div className="text-center">
                  <p className="text-lg text-gray-500 mb-4">No responses pending approval</p>
                  <p className="text-gray-500">
                    Automated responses will appear here for review before being sent
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingResponses.map(response => (
                <Card key={response.id} className="overflow-hidden">
                  <CardHeader className="pb-2 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-base">Response to Feedback #{response.feedback_id}</CardTitle>
                        <CardDescription>
                          Template: {response.template_name} | Created {new Date(response.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleApproveResponse(response.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleRejectResponse(response.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Original Feedback</h4>
                        <div className="p-3 bg-gray-50 rounded-md text-sm">
                          <p>{response.feedback_content}</p>
                          {response.feedback_sentiment && (
                            <Badge className="mt-2 capitalize" variant="outline">
                              {response.feedback_sentiment}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Generated Response</h4>
                        <div className="p-3 bg-blue-50 rounded-md text-sm">
                          <p>{response.content}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Response Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Automated Response Settings</CardTitle>
                <CardDescription>
                  Configure how automated responses are generated and handled
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-medium">Require Approval</h3>
                    <p className="text-sm text-gray-500">All automated responses require manual approval before sending</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-medium">Automated Response Generation</h3>
                    <p className="text-sm text-gray-500">Generate responses automatically for new feedback</p>
                  </div>
                  <Switch checked={false} disabled />
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="font-medium">Response Tone Consistency</h3>
                    <p className="text-sm text-gray-500">Ensure all responses maintain a consistent tone</p>
                  </div>
                  <Select defaultValue="agency" disabled>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agency">Agency Default</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button disabled className="w-full">Save Settings</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{currentTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>
              {currentTemplate 
                ? 'Update this response template with new information.' 
                : 'Create a new template for automated responses.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Template name"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                placeholder="E.g., general, complaint, question"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tone" className="text-right">
                Tone
              </Label>
              <Select
                value={formData.tone}
                onValueChange={(value) => handleSelectChange('tone', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="simple">Simple</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <Label htmlFor="content" className="text-right">
                Content
              </Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Template content..."
                className="col-span-3"
                rows={8}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Active
              </Label>
              <div className="flex items-center space-x-2 col-span-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="is_active">
                  {formData.is_active ? 'Template is active' : 'Template is inactive'}
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 