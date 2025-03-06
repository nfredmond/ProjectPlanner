'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

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

interface TemplateFormProps {
  template: PromptTemplate | null;
  onSave: (template: PromptTemplate) => void;
  onCancel: () => void;
}

export function TemplateForm({ template, onSave, onCancel }: TemplateFormProps) {
  const [formData, setFormData] = useState<Partial<PromptTemplate>>({
    name: '',
    description: '',
    purpose: 'analyze',
    template: '',
    is_active: true,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  
  // Load template data if editing
  useEffect(() => {
    if (template) {
      setFormData({
        id: template.id,
        name: template.name,
        description: template.description,
        purpose: template.purpose,
        template: template.template,
        is_active: template.is_active,
      });
    } else {
      // Reset form for new template
      setFormData({
        name: '',
        description: '',
        purpose: 'analyze',
        template: '',
        is_active: true,
      });
    }
  }, [template]);
  
  // Handle form field changes
  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.purpose?.trim()) {
      newErrors.purpose = 'Purpose is required';
    }
    
    if (!formData.template?.trim()) {
      newErrors.template = 'Template content is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form.',
        variant: 'destructive',
      });
      return;
    }
    
    // Call parent save handler
    onSave(formData as PromptTemplate);
  };
  
  // Available purposes for templates
  const purposeOptions = [
    { value: 'analyze', label: 'Project Analysis' },
    { value: 'grant-analysis', label: 'Grant Analysis' },
    { value: 'generate-report', label: 'Report Generation' },
    { value: 'project-recommendations', label: 'Project Recommendations' },
    { value: 'feedback-response', label: 'Feedback Response' },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{template ? 'Edit Template' : 'Create New Template'}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={e => handleChange('name', e.target.value)}
              placeholder="Enter template name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description || ''}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Enter template description"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Select
              value={formData.purpose || 'analyze'}
              onValueChange={value => handleChange('purpose', value)}
            >
              <SelectTrigger id="purpose" className={errors.purpose ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                {purposeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.purpose && <p className="text-sm text-red-500">{errors.purpose}</p>}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="template">Template Content</Label>
              <div className="text-xs text-muted-foreground">
                Use {'{{'} variable_name {'}}' } for dynamic variables
              </div>
            </div>
            <Textarea
              id="template"
              value={formData.template || ''}
              onChange={e => handleChange('template', e.target.value)}
              placeholder="Enter template content with variables in {{variable_name}} format"
              className={`min-h-[200px] font-mono ${errors.template ? 'border-red-500' : ''}`}
            />
            {errors.template && <p className="text-sm text-red-500">{errors.template}</p>}
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={checked => handleChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>
          
          {template && (
            <div className="text-sm text-muted-foreground">
              <p>Version: {template.version}</p>
              <p>Last Updated: {new Date(template.updated_at).toLocaleDateString()}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 