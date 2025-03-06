'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createServerComponentClient } from '@/lib/supabase-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash, Eye, Copy, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TemplateList } from '@/components/admin/templates/TemplateList';
import { TemplateForm } from '@/components/admin/templates/TemplateForm';
import { TemplatePreview } from '@/components/admin/templates/TemplatePreview';
import { useToast } from '@/components/ui/use-toast';

// Types for template data
interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  purpose: string;
  template: string;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState('list');
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch templates on load
  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from('prompt_templates')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setTemplates(data || []);
      } catch (error) {
        console.error('Error fetching templates:', error);
        toast({
          title: 'Error fetching templates',
          description: 'There was a problem loading the prompt templates.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }
    
    fetchTemplates();
  }, [toast]);

  // Handle template selection for editing
  const handleEditTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('edit');
  };

  // Handle template selection for preview
  const handlePreviewTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setActiveTab('preview');
  };

  // Handle template creation
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setActiveTab('edit');
  };

  // Handle template deletion
  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }
    
    try {
      const supabase = createClientComponentClient();
      const { error } = await supabase
        .from('prompt_templates')
        .delete()
        .match({ id: templateId });
      
      if (error) throw error;
      
      // Update local state
      setTemplates(templates.filter(t => t.id !== templateId));
      
      toast({
        title: 'Template deleted',
        description: 'The prompt template has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error deleting template',
        description: 'There was a problem deleting the prompt template.',
        variant: 'destructive',
      });
    }
  };

  // Handle template save (create or update)
  const handleSaveTemplate = async (template: PromptTemplate) => {
    try {
      const supabase = createClientComponentClient();
      
      if (template.id) {
        // Update existing template
        const { data, error } = await supabase
          .from('prompt_templates')
          .update({
            name: template.name,
            description: template.description,
            purpose: template.purpose,
            template: template.template,
            is_active: template.is_active,
          })
          .match({ id: template.id })
          .select();
        
        if (error) throw error;
        
        // Update local state
        setTemplates(templates.map(t => t.id === template.id ? data[0] : t));
        
        toast({
          title: 'Template updated',
          description: 'The prompt template has been updated successfully.',
        });
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('prompt_templates')
          .insert({
            name: template.name,
            description: template.description,
            purpose: template.purpose,
            template: template.template,
            is_active: template.is_active || true,
          })
          .select();
        
        if (error) throw error;
        
        // Update local state
        setTemplates([...templates, data[0]]);
        
        toast({
          title: 'Template created',
          description: 'A new prompt template has been created successfully.',
        });
      }
      
      // Return to list view
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error saving template',
        description: 'There was a problem saving the prompt template.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Prompt Templates</h1>
        {activeTab === 'list' && (
          <Button onClick={handleCreateTemplate}>
            <Plus className="mr-2 h-4 w-4" /> Create Template
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">Template List</TabsTrigger>
          <TabsTrigger value="edit">
            {selectedTemplate ? 'Edit Template' : 'Create Template'}
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!selectedTemplate}>
            Preview Template
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          <TemplateList
            templates={templates}
            loading={loading}
            onEdit={handleEditTemplate}
            onPreview={handlePreviewTemplate}
            onDelete={handleDeleteTemplate}
          />
        </TabsContent>
        
        <TabsContent value="edit">
          <TemplateForm
            template={selectedTemplate}
            onSave={handleSaveTemplate}
            onCancel={() => setActiveTab('list')}
          />
        </TabsContent>
        
        <TabsContent value="preview">
          {selectedTemplate && (
            <TemplatePreview
              template={selectedTemplate}
              onBack={() => setActiveTab('list')}
              onEdit={() => setActiveTab('edit')}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'; 