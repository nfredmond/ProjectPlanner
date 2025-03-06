'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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

interface TemplatePreviewProps {
  template: PromptTemplate;
  onBack: () => void;
  onEdit: () => void;
}

export function TemplatePreview({ template, onBack, onEdit }: TemplatePreviewProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [previewText, setPreviewText] = useState<string>(template.template);
  const [loading, setLoading] = useState<boolean>(false);
  const [testResponse, setTestResponse] = useState<string>('');
  const { toast } = useToast();
  
  // Extract variable names from template
  const extractVariables = (templateText: string): string[] => {
    const regex = /{{([^{}]+)}}/g;
    const matches = templateText.match(regex) || [];
    return matches.map(match => match.replace(/{{|}}/g, ''));
  };
  
  const templateVariables = extractVariables(template.template);
  
  // Update variable value
  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Update preview text
    updatePreviewText({
      ...variables,
      [name]: value
    });
  };
  
  // Update preview text with variable values
  const updatePreviewText = (vars: Record<string, string>) => {
    let text = template.template;
    
    Object.entries(vars).forEach(([name, value]) => {
      text = text.replace(new RegExp(`{{${name}}}`, 'g'), value || `{{${name}}}`);
    });
    
    setPreviewText(text);
  };
  
  // Test the template with an LLM
  const handleTestTemplate = async () => {
    setLoading(true);
    setTestResponse('');
    
    try {
      const supabase = createClientComponentClient();
      
      // Get current user for logging
      const { data: { user } } = await supabase.auth.getUser();
      
      // Prepare the request
      const response = await fetch('/api/llm/test-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: template.id,
          variables,
          purpose: template.purpose,
          user_id: user?.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to test template');
      }
      
      const result = await response.json();
      setTestResponse(result.text);
      
      toast({
        title: 'Template tested successfully',
        description: 'The LLM has processed your template.',
      });
    } catch (error) {
      console.error('Error testing template:', error);
      toast({
        title: 'Error testing template',
        description: 'There was a problem testing the template with the LLM.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{template.name}</CardTitle>
          {template.description && (
            <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{template.purpose}</Badge>
          <Badge variant={template.is_active ? "default" : "secondary"}>
            {template.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {templateVariables.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Template Variables</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateVariables.map(variable => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={`var-${variable}`}>{variable}</Label>
                  <Input
                    id={`var-${variable}`}
                    value={variables[variable] || ''}
                    onChange={e => handleVariableChange(variable, e.target.value)}
                    placeholder={`Enter value for ${variable}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Preview</h3>
          <div className="bg-muted p-4 rounded-md whitespace-pre-wrap font-mono text-sm">
            {previewText}
          </div>
        </div>
        
        {testResponse && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">LLM Response</h3>
            <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
              {testResponse}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
        
        <Button onClick={handleTestTemplate} disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Testing...
            </>
          ) : (
            'Test with LLM'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 