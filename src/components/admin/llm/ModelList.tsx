'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Save, X } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ModelListProps {
  models: any[];
  loading: boolean;
  onUpdate: (model: any) => void;
}

export function ModelList({ models, loading, onUpdate }: ModelListProps) {
  const [editingModel, setEditingModel] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  
  // Get unique providers for filtering
  const uniqueProviders = Array.from(new Set(models.map(m => m.provider)));
  
  // Filter models based on search and provider filter
  const filteredModels = models.filter(model => {
    const matchesSearch = 
      model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvider = providerFilter === 'all' || model.provider === providerFilter;
    
    return matchesSearch && matchesProvider;
  });
  
  // Handle edit button click
  const handleEditClick = (model: any) => {
    setEditingModel({
      ...model,
      editedCost: model.cost_per_1k_tokens,
      editedTasks: model.default_for_tasks || [],
    });
    setEditDialogOpen(true);
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    if (!editingModel) return;
    
    const updatedModel = {
      ...editingModel,
      cost_per_1k_tokens: editingModel.editedCost,
      default_for_tasks: editingModel.editedTasks,
    };
    
    onUpdate(updatedModel);
    setEditDialogOpen(false);
  };
  
  // Handle task selection
  const handleTaskToggle = (task: string) => {
    if (!editingModel) return;
    
    const tasks = editingModel.editedTasks || [];
    const newTasks = tasks.includes(task)
      ? tasks.filter((t: string) => t !== task)
      : [...tasks, task];
    
    setEditingModel({
      ...editingModel,
      editedTasks: newTasks,
    });
  };
  
  // Available tasks
  const availableTasks = [
    { value: 'analyze', label: 'Project Analysis' },
    { value: 'grant-analysis', label: 'Grant Analysis' },
    { value: 'generate-report', label: 'Report Generation' },
    { value: 'project-recommendations', label: 'Project Recommendations' },
    { value: 'feedback-response', label: 'Feedback Response' },
  ];
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <Input
          placeholder="Search models..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        
        <div className="flex items-center gap-2">
          <span className="text-sm">Filter by provider:</span>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              {uniqueProviders.map(provider => (
                <SelectItem key={provider} value={provider}>{provider}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Context Size</TableHead>
              <TableHead>Cost per 1K Tokens</TableHead>
              <TableHead>Default For</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredModels.map(model => (
              <TableRow key={model.id}>
                <TableCell className="font-medium">{model.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{model.provider}</Badge>
                </TableCell>
                <TableCell>{model.context_size.toLocaleString()}</TableCell>
                <TableCell>${model.cost_per_1k_tokens.toFixed(4)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {model.default_for_tasks && model.default_for_tasks.map((task: string) => (
                      <Badge key={task} variant="secondary" className="text-xs">
                        {task}
                      </Badge>
                    ))}
                    {(!model.default_for_tasks || model.default_for_tasks.length === 0) && (
                      <span className="text-muted-foreground text-xs">None</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={model.is_active}
                    onCheckedChange={checked => onUpdate({ ...model, is_active: checked })}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(model)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Model Settings</DialogTitle>
            <DialogDescription>
              Update settings for {editingModel?.name}
            </DialogDescription>
          </DialogHeader>
          
          {editingModel && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost per 1K Tokens</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={editingModel.editedCost}
                  onChange={e => setEditingModel({
                    ...editingModel,
                    editedCost: parseFloat(e.target.value),
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Default For Tasks</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableTasks.map(task => (
                    <div key={task.value} className="flex items-center space-x-2">
                      <Switch
                        id={`task-${task.value}`}
                        checked={editingModel.editedTasks?.includes(task.value)}
                        onCheckedChange={() => handleTaskToggle(task.value)}
                      />
                      <Label htmlFor={`task-${task.value}`}>{task.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="status"
                    checked={editingModel.is_active}
                    onCheckedChange={checked => setEditingModel({
                      ...editingModel,
                      is_active: checked,
                    })}
                  />
                  <Label htmlFor="status">
                    {editingModel.is_active ? 'Active' : 'Inactive'}
                  </Label>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveChanges}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 