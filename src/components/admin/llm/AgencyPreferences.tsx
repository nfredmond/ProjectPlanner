'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface AgencyPreferencesProps {
  preferences: any[];
  models: any[];
  loading: boolean;
  onUpdate: (preference: any) => void;
}

export function AgencyPreferences({ preferences, models, loading, onUpdate }: AgencyPreferencesProps) {
  const [editingPref, setEditingPref] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [purposeFilter, setPurposeFilter] = useState('all');
  
  // Get unique purposes for filtering
  const uniquePurposes = Array.from(new Set(preferences.map(p => p.purpose)));
  
  // Filter preferences based on purpose filter
  const filteredPreferences = preferences.filter(pref => {
    return purposeFilter === 'all' || pref.purpose === purposeFilter;
  });
  
  // Get models by provider
  const getModelsByProvider = (provider: string) => {
    return models.filter(m => m.provider === provider && m.is_active);
  };
  
  // Handle edit button click
  const handleEditClick = (pref: any) => {
    setEditingPref({
      ...pref,
      editedProvider: pref.preferred_provider,
      editedModel: pref.preferred_model,
      editedTemperature: pref.temperature * 100, // Scale for slider (0-100)
      editedMaxTokens: pref.max_tokens,
    });
    setEditDialogOpen(true);
  };
  
  // Handle save changes
  const handleSaveChanges = () => {
    if (!editingPref) return;
    
    const updatedPref = {
      ...editingPref,
      preferred_provider: editingPref.editedProvider,
      preferred_model: editingPref.editedModel,
      temperature: editingPref.editedTemperature / 100, // Scale back to 0-1
      max_tokens: editingPref.editedMaxTokens,
    };
    
    onUpdate(updatedPref);
    setEditDialogOpen(false);
  };
  
  // Format purpose for display
  const formatPurpose = (purpose: string) => {
    return purpose
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm">Filter by purpose:</span>
        <Select value={purposeFilter} onValueChange={setPurposeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select purpose" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Purposes</SelectItem>
            {uniquePurposes.map(purpose => (
              <SelectItem key={purpose} value={purpose}>
                {formatPurpose(purpose)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Purpose</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Temperature</TableHead>
              <TableHead>Max Tokens</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPreferences.map(pref => (
              <TableRow key={pref.id}>
                <TableCell className="font-medium">{formatPurpose(pref.purpose)}</TableCell>
                <TableCell>{pref.agencies?.name || 'Unknown Agency'}</TableCell>
                <TableCell>{pref.preferred_provider}</TableCell>
                <TableCell>{pref.preferred_model}</TableCell>
                <TableCell>{pref.temperature.toFixed(2)}</TableCell>
                <TableCell>{pref.max_tokens.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(pref)}>
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
            <DialogTitle>Edit Preferences</DialogTitle>
            <DialogDescription>
              Update LLM preferences for {formatPurpose(editingPref?.purpose || '')}
            </DialogDescription>
          </DialogHeader>
          
          {editingPref && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={editingPref.editedProvider}
                  onValueChange={value => setEditingPref({
                    ...editingPref,
                    editedProvider: value,
                    editedModel: '', // Reset model when provider changes
                  })}
                >
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set(models.map(m => m.provider))).map(provider => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select
                  value={editingPref.editedModel}
                  onValueChange={value => setEditingPref({
                    ...editingPref,
                    editedModel: value,
                  })}
                  disabled={!editingPref.editedProvider}
                >
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {getModelsByProvider(editingPref.editedProvider).map(model => (
                      <SelectItem key={model.id} value={model.name}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="temperature">Temperature</Label>
                  <span className="text-sm">{(editingPref.editedTemperature / 100).toFixed(2)}</span>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={100}
                  step={1}
                  value={[editingPref.editedTemperature]}
                  onValueChange={value => setEditingPref({
                    ...editingPref,
                    editedTemperature: value[0],
                  })}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>More Deterministic</span>
                  <span>More Creative</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-tokens">Max Tokens</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min="100"
                  step="100"
                  value={editingPref.editedMaxTokens}
                  onChange={e => setEditingPref({
                    ...editingPref,
                    editedMaxTokens: parseInt(e.target.value),
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of tokens to generate in the response
                </p>
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