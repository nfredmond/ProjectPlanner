'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, Agency } from '@/types';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface UserManagementProps {
  agencyId: string;
}

export default function UserManagement({ agencyId }: UserManagementProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    title: '',
    role: 'viewer',
  });
  
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  // Fetch users and agency data
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      // Fetch users for this agency
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          *,
          email:id(email)
        `)
        .eq('agency_id', agencyId);
        
      if (usersError) {
        toast({
          title: "Error",
          description: "Failed to load users: " + usersError.message,
          variant: "destructive",
        });
      } else {
        // Transform data to include email from auth.users
        const transformedUsers = usersData.map(user => ({
          ...user,
          email: user.email?.email || '',
        }));
        setUsers(transformedUsers);
      }
      
      // Fetch agency details
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', agencyId)
        .single();
        
      if (agencyError) {
        toast({
          title: "Error",
          description: "Failed to load agency details: " + agencyError.message,
          variant: "destructive",
        });
      } else {
        setAgency(agencyData);
      }
      
      setIsLoading(false);
    }
    
    fetchData();
  }, [agencyId, supabase, toast]);
  
  // Reset form when dialog opens
  const openAddUserDialog = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      title: '',
      role: 'viewer',
    });
    setIsAddUserOpen(true);
  };
  
  // Open edit user dialog with user data
  const openEditUserDialog = (user: UserProfile) => {
    setCurrentUser(user);
    setFormData({
      email: user.email || '',
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      title: user.title || '',
      role: user.role,
    });
    setIsEditUserOpen(true);
  };
  
  // Open delete confirmation dialog
  const openDeleteUserDialog = (user: UserProfile) => {
    setCurrentUser(user);
    setIsDeleteUserOpen(true);
  };
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle role selection
  const handleRoleChange = (value: string) => {
    setFormData({
      ...formData,
      role: value as 'admin' | 'editor' | 'viewer' | 'community',
    });
  };
  
  // Add new user
  const handleAddUser = async () => {
    try {
      setIsLoading(true);
      
      // Invite user via email (will create auth record)
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
        formData.email,
        {
          data: {
            agency_id: agencyId,
            role: formData.role,
          }
        }
      );
      
      if (authError) throw new Error(authError.message);
      
      // Create profile record
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData?.user?.id,
          agency_id: agencyId,
          role: formData.role,
          first_name: formData.firstName,
          last_name: formData.lastName,
          title: formData.title,
        });
      
      if (profileError) throw new Error(profileError.message);
      
      toast({
        title: "Success",
        description: `Invitation sent to ${formData.email}`,
      });
      
      // Refresh user list
      const { data: refreshedUsers } = await supabase
        .from('profiles')
        .select('*, email:id(email)')
        .eq('agency_id', agencyId);
      
      if (refreshedUsers) {
        const transformedUsers = refreshedUsers.map(user => ({
          ...user,
          email: user.email?.email || '',
        }));
        setUsers(transformedUsers);
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to add user: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsAddUserOpen(false);
    }
  };
  
  // Update existing user
  const handleUpdateUser = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      // Update profile data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: formData.role,
          first_name: formData.firstName,
          last_name: formData.lastName,
          title: formData.title,
        })
        .eq('id', currentUser.id);
      
      if (updateError) throw new Error(updateError.message);
      
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      // Refresh user list
      const { data: refreshedUsers } = await supabase
        .from('profiles')
        .select('*, email:id(email)')
        .eq('agency_id', agencyId);
      
      if (refreshedUsers) {
        const transformedUsers = refreshedUsers.map(user => ({
          ...user,
          email: user.email?.email || '',
        }));
        setUsers(transformedUsers);
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update user: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsEditUserOpen(false);
    }
  };
  
  // Delete user
  const handleDeleteUser = async () => {
    if (!currentUser) return;
    
    try {
      setIsLoading(true);
      
      // Delete user from auth (this will cascade to profiles via DB constraint)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        currentUser.id
      );
      
      if (deleteError) throw new Error(deleteError.message);
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      // Update local state
      setUsers(users.filter(user => user.id !== currentUser.id));
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete user: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteUserOpen(false);
    }
  };
  
  // Render user role badge
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">Admin</span>;
      case 'editor':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">Editor</span>;
      case 'viewer':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Viewer</span>;
      case 'community':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Community</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{role}</span>;
    }
  };
  
  if (isLoading && users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>User Management</CardTitle>
          <Button onClick={openAddUserDialog}>Add User</Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="py-3 px-4 text-left">Name</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Title</th>
                  <th className="py-3 px-4 text-left">Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {user.first_name} {user.last_name}
                    </td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">{user.title || '-'}</td>
                    <td className="py-3 px-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2"
                        onClick={() => openEditUserDialog(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openDeleteUserDialog(user)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No users found. Add users to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Send an invitation to a new user to join your agency.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="user@example.com"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Job Title
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Transportation Planner"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user details and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Email
              </Label>
              <div className="col-span-3 text-gray-700">
                {formData.email} <span className="text-gray-400">(cannot be changed)</span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right">
                First Name
              </Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right">
                Last Name
              </Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Job Title
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Transportation Planner"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="community">Community</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Confirmation */}
      <AlertDialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for {currentUser?.first_name} {currentUser?.last_name} ({currentUser?.email}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} disabled={isLoading}>
              {isLoading ? 'Deleting...' : 'Delete User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 