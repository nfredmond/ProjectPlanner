'use client';

import React, { useState, useEffect } from 'react';
import { Criterion } from '@/types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CriteriaManagementProps {
  agencyId: string;
}

// Add interface for scoring scenarios
interface ScoringScenario {
  id: string;
  agency_id: string;
  name: string;
  description?: string;
  weights: Record<string, number>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export default function CriteriaManagement({ agencyId }: CriteriaManagementProps) {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [scenarios, setScenarios] = useState<ScoringScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCriterionOpen, setIsAddCriterionOpen] = useState(false);
  const [isEditCriterionOpen, setIsEditCriterionOpen] = useState(false);
  const [isDeleteCriterionOpen, setIsDeleteCriterionOpen] = useState(false);
  const [isSaveScenarioOpen, setIsSaveScenarioOpen] = useState(false);
  const [currentCriterion, setCurrentCriterion] = useState<Criterion | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxPoints: 5,
    weight: 1.0,
    order: 0,
    isDefault: false,
  });
  const [scenarioFormData, setScenarioFormData] = useState({
    name: '',
    description: '',
  });
  
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  // Fetch criteria data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      // Fetch criteria for this agency
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('criteria')
        .select('*')
        .eq('agency_id', agencyId)
        .order('order', { ascending: true });
        
      if (criteriaError) {
        toast({
          title: "Error",
          description: "Failed to load criteria: " + criteriaError.message,
          variant: "destructive",
        });
      } else {
        setCriteria(criteriaData || []);
      }
      
      // Fetch scoring scenarios
      const { data: scenariosData, error: scenariosError } = await supabase
        .from('scoring_scenarios')
        .select('*')
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });
        
      if (scenariosError) {
        toast({
          title: "Error",
          description: "Failed to load scoring scenarios: " + scenariosError.message,
          variant: "destructive",
        });
      } else {
        setScenarios(scenariosData || []);
      }
      
      setIsLoading(false);
    }
    
    fetchData();
  }, [agencyId, supabase, toast]);
  
  // Reset form when add dialog opens
  const openAddCriterionDialog = () => {
    setFormData({
      name: '',
      description: '',
      maxPoints: 5,
      weight: 1.0,
      order: criteria.length, // Set order to the next available position
      isDefault: false,
    });
    setIsAddCriterionOpen(true);
  };
  
  // Open edit dialog with criterion data
  const openEditCriterionDialog = (criterion: Criterion) => {
    setCurrentCriterion(criterion);
    setFormData({
      name: criterion.name,
      description: criterion.description || '',
      maxPoints: criterion.max_points,
      weight: criterion.weight,
      order: criterion.order,
      isDefault: criterion.is_default,
    });
    setIsEditCriterionOpen(true);
  };
  
  // Open delete confirmation dialog
  const openDeleteCriterionDialog = (criterion: Criterion) => {
    setCurrentCriterion(criterion);
    setIsDeleteCriterionOpen(true);
  };
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value),
      });
    } else if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // Add new criterion
  const handleAddCriterion = async () => {
    try {
      setIsLoading(true);
      
      const newCriterion = {
        agency_id: agencyId,
        name: formData.name,
        description: formData.description,
        max_points: formData.maxPoints,
        weight: formData.weight,
        order: formData.order,
        is_default: formData.isDefault,
      };
      
      const { data, error } = await supabase
        .from('criteria')
        .insert(newCriterion)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      toast({
        title: "Success",
        description: "Criterion added successfully",
      });
      
      // Update local state
      setCriteria([...criteria, data]);
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to add criterion: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsAddCriterionOpen(false);
    }
  };
  
  // Update existing criterion
  const handleUpdateCriterion = async () => {
    if (!currentCriterion) return;
    
    try {
      setIsLoading(true);
      
      const updatedCriterion = {
        name: formData.name,
        description: formData.description,
        max_points: formData.maxPoints,
        weight: formData.weight,
        order: formData.order,
        is_default: formData.isDefault,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('criteria')
        .update(updatedCriterion)
        .eq('id', currentCriterion.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      toast({
        title: "Success",
        description: "Criterion updated successfully",
      });
      
      // Update local state
      setCriteria(criteria.map(c => c.id === currentCriterion.id ? data : c));
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update criterion: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsEditCriterionOpen(false);
    }
  };
  
  // Delete criterion
  const handleDeleteCriterion = async () => {
    if (!currentCriterion) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('criteria')
        .delete()
        .eq('id', currentCriterion.id);
      
      if (error) throw new Error(error.message);
      
      toast({
        title: "Success",
        description: "Criterion deleted successfully",
      });
      
      // Update local state
      setCriteria(criteria.filter(c => c.id !== currentCriterion.id));
      
      // Reorder remaining criteria
      const updatedCriteria = criteria
        .filter(c => c.id !== currentCriterion.id)
        .sort((a, b) => a.order - b.order)
        .map((c, index) => ({ ...c, order: index }));
        
      // Update order in database in a batch
      for (const criterion of updatedCriteria) {
        await supabase
          .from('criteria')
          .update({ order: criterion.order })
          .eq('id', criterion.id);
      }
      
      setCriteria(updatedCriteria);
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete criterion: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteCriterionOpen(false);
    }
  };
  
  // Move criterion up in the order
  const handleMoveUp = async (criterion: Criterion) => {
    if (criterion.order === 0) return; // Already at the top
    
    const prevCriterion = criteria.find(c => c.order === criterion.order - 1);
    if (!prevCriterion) return;
    
    try {
      setIsLoading(true);
      
      // Swap orders in database
      await supabase
        .from('criteria')
        .update({ order: criterion.order - 1 })
        .eq('id', criterion.id);
        
      await supabase
        .from('criteria')
        .update({ order: criterion.order })
        .eq('id', prevCriterion.id);
      
      // Update local state
      const updatedCriteria = criteria.map(c => {
        if (c.id === criterion.id) {
          return { ...c, order: c.order - 1 };
        } else if (c.id === prevCriterion.id) {
          return { ...c, order: c.order + 1 };
        }
        return c;
      });
      
      setCriteria(updatedCriteria.sort((a, b) => a.order - b.order));
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to reorder criteria: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Move criterion down in the order
  const handleMoveDown = async (criterion: Criterion) => {
    if (criterion.order === criteria.length - 1) return; // Already at the bottom
    
    const nextCriterion = criteria.find(c => c.order === criterion.order + 1);
    if (!nextCriterion) return;
    
    try {
      setIsLoading(true);
      
      // Swap orders in database
      await supabase
        .from('criteria')
        .update({ order: criterion.order + 1 })
        .eq('id', criterion.id);
        
      await supabase
        .from('criteria')
        .update({ order: criterion.order })
        .eq('id', nextCriterion.id);
      
      // Update local state
      const updatedCriteria = criteria.map(c => {
        if (c.id === criterion.id) {
          return { ...c, order: c.order + 1 };
        } else if (c.id === nextCriterion.id) {
          return { ...c, order: c.order - 1 };
        }
        return c;
      });
      
      setCriteria(updatedCriteria.sort((a, b) => a.order - b.order));
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to reorder criteria: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Open save scenario dialog
  const openSaveScenarioDialog = () => {
    setScenarioFormData({
      name: `Scenario ${scenarios.length + 1}`,
      description: '',
    });
    setIsSaveScenarioOpen(true);
  };
  
  // Save current criteria weights as a new scenario
  const handleSaveScenario = async () => {
    try {
      setIsLoading(true);
      
      // Create weights object from current criteria
      const weights: Record<string, number> = {};
      criteria.forEach(criterion => {
        weights[criterion.id] = criterion.weight;
      });
      
      const newScenario = {
        agency_id: agencyId,
        name: scenarioFormData.name,
        description: scenarioFormData.description,
        weights: weights,
        is_active: false,
      };
      
      const { data, error } = await supabase
        .from('scoring_scenarios')
        .insert(newScenario)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      toast({
        title: "Success",
        description: "Scoring scenario saved successfully",
      });
      
      // Update local state
      setScenarios([data, ...scenarios]);
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save scenario: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsSaveScenarioOpen(false);
    }
  };
  
  // Apply a saved scenario
  const handleApplyScenario = async (scenario: ScoringScenario) => {
    try {
      setIsLoading(true);
      
      // Get current criteria
      const updatedCriteria = [...criteria];
      
      // Update weights based on scenario
      for (let i = 0; i < updatedCriteria.length; i++) {
        const criterion = updatedCriteria[i];
        if (scenario.weights[criterion.id]) {
          // Create a new criterion object with updated weight
          updatedCriteria[i] = {
            ...criterion,
            weight: scenario.weights[criterion.id]
          };
          
          // Update in database
          await supabase
            .from('criteria')
            .update({ weight: scenario.weights[criterion.id] })
            .eq('id', criterion.id);
        }
      }
      
      // Set scenario as active
      await supabase
        .from('scoring_scenarios')
        .update({ is_active: false })
        .eq('agency_id', agencyId);
        
      await supabase
        .from('scoring_scenarios')
        .update({ is_active: true })
        .eq('id', scenario.id);
      
      // Update scenarios in state
      const updatedScenarios = scenarios.map(s => ({
        ...s,
        is_active: s.id === scenario.id
      }));
      
      // Update state
      setCriteria(updatedCriteria);
      setScenarios(updatedScenarios);
      
      toast({
        title: "Success",
        description: `Applied scenario: ${scenario.name}`,
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to apply scenario: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete a scenario
  const handleDeleteScenario = async (scenarioId: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('scoring_scenarios')
        .delete()
        .eq('id', scenarioId);
      
      if (error) throw new Error(error.message);
      
      // Update state
      setScenarios(scenarios.filter(s => s.id !== scenarioId));
      
      toast({
        title: "Success",
        description: "Scenario deleted successfully",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete scenario: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle scenario form input changes
  const handleScenarioFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setScenarioFormData({
      ...scenarioFormData,
      [name]: value,
    });
  };
  
  if (isLoading && criteria.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scoring Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Tabs defaultValue="criteria">
      <TabsList className="mb-4">
        <TabsTrigger value="criteria">Scoring Criteria</TabsTrigger>
        <TabsTrigger value="scenarios">Scoring Scenarios</TabsTrigger>
      </TabsList>
      
      <TabsContent value="criteria">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Scoring Criteria</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={openSaveScenarioDialog}
                disabled={criteria.length === 0}
              >
                Save as Scenario
              </Button>
              <Button onClick={openAddCriterionDialog}>Add Criterion</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                These criteria are used to score and prioritize transportation projects. 
                Adjust the weights to change the relative importance of each criterion.
              </p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left">Order</th>
                      <th className="py-3 px-4 text-left">Name</th>
                      <th className="py-3 px-4 text-left">Description</th>
                      <th className="py-3 px-4 text-center">Max Points</th>
                      <th className="py-3 px-4 text-center">Weight</th>
                      <th className="py-3 px-4 text-center">Default</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criteria.map((criterion) => (
                      <tr key={criterion.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveUp(criterion)}
                              disabled={criterion.order === 0}
                              className="h-6 w-6 p-0"
                            >
                              ↑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveDown(criterion)}
                              disabled={criterion.order === criteria.length - 1}
                              className="h-6 w-6 p-0"
                            >
                              ↓
                            </Button>
                            <span className="ml-2">{criterion.order + 1}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium">{criterion.name}</td>
                        <td className="py-3 px-4 text-sm">
                          {criterion.description ? (
                            criterion.description.length > 100 
                              ? `${criterion.description.substring(0, 100)}...` 
                              : criterion.description
                          ) : (
                            <span className="text-gray-400 italic">No description</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">{criterion.max_points}</td>
                        <td className="py-3 px-4 text-center">{criterion.weight.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          {criterion.is_default ? (
                            <span className="text-green-600">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => openEditCriterionDialog(criterion)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteCriterionDialog(criterion)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {criteria.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          No criteria defined. Add criteria to start scoring projects.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="scenarios">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Saved Scoring Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-4">
                <p>Loading scenarios...</p>
              </div>
            ) : scenarios.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No scoring scenarios saved yet.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Configure your criteria weights and use &quot;Save as Scenario&quot; to create reusable scoring models.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {scenarios.map((scenario) => (
                  <div key={scenario.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium flex items-center">
                          {scenario.name}
                          {scenario.is_active && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                              Active
                            </span>
                          )}
                        </h3>
                        {scenario.description && (
                          <p className="text-sm text-gray-500 mt-1">{scenario.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Created: {new Date(scenario.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleApplyScenario(scenario)}
                          disabled={scenario.is_active}
                        >
                          Apply
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          onClick={() => handleDeleteScenario(scenario.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Add Criterion Dialog */}
      <Dialog open={isAddCriterionOpen} onOpenChange={setIsAddCriterionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Criterion</DialogTitle>
            <DialogDescription>
              Define a new criterion for scoring transportation projects.
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
                onChange={handleChange}
                placeholder="e.g., Safety"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what this criterion measures and how it should be scored..."
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="maxPoints" className="text-right">
                Max Points
              </Label>
              <Input
                id="maxPoints"
                name="maxPoints"
                type="number"
                min="1"
                max="100"
                value={formData.maxPoints}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="weight" className="text-right">
                Weight
              </Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                min="0.01"
                max="10"
                step="0.01"
                value={formData.weight}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order" className="text-right">
                Order
              </Label>
              <Input
                id="order"
                name="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Default
                </Label>
              </div>
              <div className="col-span-3 flex items-center">
                <input
                  id="isDefault"
                  name="isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="h-4 w-4 text-rtpa-blue-600 focus:ring-rtpa-blue-500 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-600">
                  Include this criterion in default scoring templates
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCriterionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCriterion} disabled={isLoading || !formData.name}>
              {isLoading ? 'Adding...' : 'Add Criterion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Criterion Dialog */}
      <Dialog open={isEditCriterionOpen} onOpenChange={setIsEditCriterionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Criterion</DialogTitle>
            <DialogDescription>
              Update the criterion details and scoring parameters.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-description" className="text-right pt-2">
                Description
              </Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-maxPoints" className="text-right">
                Max Points
              </Label>
              <Input
                id="edit-maxPoints"
                name="maxPoints"
                type="number"
                min="1"
                max="100"
                value={formData.maxPoints}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-weight" className="text-right">
                Weight
              </Label>
              <Input
                id="edit-weight"
                name="weight"
                type="number"
                min="0.01"
                max="10"
                step="0.01"
                value={formData.weight}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-order" className="text-right">
                Order
              </Label>
              <Input
                id="edit-order"
                name="order"
                type="number"
                min="0"
                value={formData.order}
                onChange={handleChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <div className="text-right">
                <Label htmlFor="edit-isDefault" className="cursor-pointer">
                  Default
                </Label>
              </div>
              <div className="col-span-3 flex items-center">
                <input
                  id="edit-isDefault"
                  name="isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="h-4 w-4 text-rtpa-blue-600 focus:ring-rtpa-blue-500 rounded"
                />
                <label htmlFor="edit-isDefault" className="ml-2 text-sm text-gray-600">
                  Include this criterion in default scoring templates
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCriterionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCriterion} disabled={isLoading || !formData.name}>
              {isLoading ? 'Updating...' : 'Update Criterion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Criterion Confirmation */}
      <AlertDialog open={isDeleteCriterionOpen} onOpenChange={setIsDeleteCriterionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the criterion &quot;{currentCriterion?.name}&quot;.
              Any project scores using this criterion will also be deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCriterion} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete Criterion'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Save Scenario Dialog */}
      <Dialog open={isSaveScenarioOpen} onOpenChange={setIsSaveScenarioOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Scoring Scenario</DialogTitle>
            <DialogDescription>
              Save the current criteria weights as a scenario that can be reused later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="scenario-name">Scenario Name</Label>
              <Input
                id="scenario-name"
                name="name"
                value={scenarioFormData.name}
                onChange={handleScenarioFormChange}
                placeholder="e.g., Rural Focus, Urban Focus, Safety Priority"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scenario-description">Description (Optional)</Label>
              <Textarea
                id="scenario-description"
                name="description"
                value={scenarioFormData.description}
                onChange={handleScenarioFormChange}
                placeholder="Describe the purpose or focus of this scoring scenario"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveScenarioOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveScenario} disabled={!scenarioFormData.name}>
              Save Scenario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
} 