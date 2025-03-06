'use client';

import { useState } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Eye, Trash, Copy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';

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

interface TemplateListProps {
  templates: PromptTemplate[];
  loading: boolean;
  onEdit: (template: PromptTemplate) => void;
  onPreview: (template: PromptTemplate) => void;
  onDelete: (templateId: string) => void;
}

export function TemplateList({ templates, loading, onEdit, onPreview, onDelete }: TemplateListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('all');
  
  // Get unique purposes for filtering
  const uniquePurposes = Array.from(new Set(templates.map(t => t.purpose)));
  
  // Filter templates based on search and purpose filter
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPurpose = purposeFilter === 'all' || template.purpose === purposeFilter;
    
    return matchesSearch && matchesPurpose;
  });
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Filter by purpose:</span>
            <Select value={purposeFilter} onValueChange={setPurposeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purposes</SelectItem>
                {uniquePurposes.map(purpose => (
                  <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No templates found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableCaption>List of prompt templates</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map(template => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      <div>
                        {template.name}
                        {template.description && (
                          <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.purpose}</Badge>
                    </TableCell>
                    <TableCell>{template.version}</TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? "success" : "secondary"}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(template.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onPreview(template)}
                          title="Preview Template"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onEdit(template)}
                          title="Edit Template"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDelete(template.id)}
                          title="Delete Template"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 