'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Agency } from '@/types';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Edit, Trash2, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface AgencyManagementProps {
  userAgencyId: string;
}

interface AgencyRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  agencyName: string;
  createdAt: string;
}

export default function AgencyManagement({ userAgencyId }: AgencyManagementProps) {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [agencyRequests, setAgencyRequests] = useState<AgencyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    region: '',
  });
  
  // Fetch agencies
  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setAgencies(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load agencies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAgencies();
  }, [supabase, toast]);
  
  // Fetch agency requests from auth users
  useEffect(() => {
    async function fetchAgencyRequests() {
      try {
        setLoadingRequests(true);
        
        // We need to create a database view or function for this in a real app
        // For this demo, we'll simplify and just focus on the metadata in profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            created_at,
            metadata
          `)
          .not('metadata', 'is', null);
        
        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }
        
        // Transform the data to our AgencyRequest format
        const requests: AgencyRequest[] = (profilesData || [])
          .filter(profile => profile.metadata && 
                            typeof profile.metadata === 'object' && 
                            'new_agency_request' in profile.metadata && 
                            profile.metadata.new_agency_request === true)
          .map(profile => {
            const metadata = profile.metadata as Record<string, any>;
            return {
              userId: profile.id,
              email: metadata.email || 'Unknown',
              firstName: profile.first_name || metadata.first_name || '',
              lastName: profile.last_name || metadata.last_name || '',
              agencyName: metadata.new_agency_name || 'Unnamed Organization',
              createdAt: profile.created_at || '',
            };
          });
        
        setAgencyRequests(requests);
      } catch (error: any) {
        console.error('Error fetching agency requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    }
    
    fetchAgencyRequests();
  }, [supabase]);
  
  const openNewAgencyDialog = () => {
    setSelectedAgency(null);
    setFormData({ name: '', region: '' });
    setOpenDialog(true);
  };
  
  const openEditAgencyDialog = (agency: Agency) => {
    setSelectedAgency(agency);
    setFormData({
      name: agency.name,
      region: agency.region || '',
    });
    setOpenDialog(true);
  };
  
  const confirmDeleteAgency = (agency: Agency) => {
    setSelectedAgency(agency);
    setDeleteDialogOpen(true);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSaveAgency = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Agency name is required',
          variant: 'destructive',
        });
        return;
      }
      
      setLoading(true);
      
      if (selectedAgency) {
        // Update existing agency
        const { error } = await supabase
          .from('agencies')
          .update({
            name: formData.name.trim(),
            region: formData.region.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedAgency.id);
          
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Agency updated successfully',
        });
      } else {
        // Create new agency
        const { error } = await supabase
          .from('agencies')
          .insert({
            name: formData.name.trim(),
            region: formData.region.trim(),
            settings: {},
          });
          
        if (error) throw error;
        
        toast({
          title: 'Success',
          description: 'Agency created successfully',
        });
      }
      
      // Refresh agency list
      const { data, error } = await supabase
        .from('agencies')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setAgencies(data || []);
      setOpenDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save agency',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAgency = async () => {
    try {
      if (!selectedAgency) return;
      
      // Prevent deleting the user's own agency
      if (selectedAgency.id === userAgencyId) {
        toast({
          title: 'Error',
          description: 'You cannot delete your own agency',
          variant: 'destructive',
        });
        return;
      }
      
      setLoading(true);
      
      const { error } = await supabase
        .from('agencies')
        .delete()
        .eq('id', selectedAgency.id);
        
      if (error) throw error;
      
      // Refresh agency list
      const { data, error: fetchError } = await supabase
        .from('agencies')
        .select('*')
        .order('name');
        
      if (fetchError) throw fetchError;
      
      setAgencies(data || []);
      toast({
        title: 'Success',
        description: 'Agency deleted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete agency',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };
  
  // Process an agency request
  const handleAgencyRequest = async (request: AgencyRequest, approve: boolean) => {
    try {
      setLoading(true);
      
      if (approve) {
        // 1. Create the new agency
        const { data: newAgency, error: agencyError } = await supabase
          .from('agencies')
          .insert({
            name: request.agencyName,
            region: '',
            settings: {},
          })
          .select('id')
          .single();
          
        if (agencyError) throw agencyError;
        
        // 2. Update the user's profile with the new agency
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            agency_id: newAgency.id,
            // Remove the metadata via an update to profiles table
            // instead of trying to use admin functions
            metadata: null
          })
          .eq('id', request.userId);
          
        if (profileError) throw profileError;
        
        toast({
          title: "Success",
          description: `New organization "${request.agencyName}" created and assigned to ${request.email}`,
        });
      } else {
        // Just remove the metadata via profiles update
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            metadata: null
          })
          .eq('id', request.userId);
          
        if (profileError) throw profileError;
        
        toast({
          title: "Request Denied",
          description: `Organization request from ${request.email} has been denied`,
        });
      }
      
      // Refresh requests
      setAgencyRequests(prev => prev.filter(r => r.userId !== request.userId));
      
      // Also refresh agencies list if we approved
      if (approve) {
        fetchAgencies();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process organization request',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Agency Management</CardTitle>
        <Button onClick={openNewAgencyDialog} className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          <span>Add Agency</span>
        </Button>
      </CardHeader>
      <CardContent>
        {/* Organization Requests Section */}
        {agencyRequests.length > 0 && (
          <>
            <h3 className="text-lg font-semibold mb-4">New Organization Requests</h3>
            <div className="bg-yellow-50 rounded-lg p-4 mb-8 border border-yellow-200">
              <div className="space-y-4">
                {agencyRequests.map((request) => (
                  <div key={request.userId} className="flex items-center justify-between p-3 bg-white rounded shadow">
                    <div>
                      <div className="font-medium">{request.agencyName}</div>
                      <div className="text-sm text-gray-600">
                        Requested by: {request.firstName} {request.lastName} ({request.email})
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleAgencyRequest(request, true)}
                        disabled={loading}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleAgencyRequest(request, false)}
                        disabled={loading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        
        {/* Existing Agencies Section */}
        <h3 className="text-lg font-semibold mb-4">Manage Agencies</h3>
        {loading && <p>Loading agencies...</p>}
        
        {!loading && agencies.length === 0 && (
          <p className="text-center py-8 text-gray-500">No agencies found. Create one to get started.</p>
        )}
        
        {!loading && agencies.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agencies.map((agency) => (
                <TableRow key={agency.id}>
                  <TableCell className="font-medium">{agency.name}</TableCell>
                  <TableCell>{agency.region || '-'}</TableCell>
                  <TableCell>{new Date(agency.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openEditAgencyDialog(agency)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => confirmDeleteAgency(agency)}
                        disabled={agency.id === userAgencyId}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {/* Add/Edit Agency Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedAgency ? 'Edit Agency' : 'Add New Agency'}
              </DialogTitle>
              <DialogDescription>
                {selectedAgency 
                  ? 'Update the agency details below.'
                  : 'Fill in the details to create a new agency.'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agency Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter agency name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  name="region"
                  placeholder="Enter region (optional)"
                  value={formData.region}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAgency} disabled={loading}>
                {selectedAgency ? 'Save Changes' : 'Create Agency'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the agency "{selectedAgency?.name}".
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAgency}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
} 