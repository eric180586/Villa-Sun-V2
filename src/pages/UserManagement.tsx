import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { 
  Users,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';
import { toast } from 'sonner';

export default function UserManagement() {
  const { user, users, setUsers } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    role: 'staff' as 'admin' | 'staff' | 'teamleader',
    pin: ''
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleAddUser = () => {
    if (!newUser.name || !newUser.pin || newUser.pin.length !== 4) {
      toast.error('Please fill all fields and ensure PIN is 4 digits');
      return;
    }

    // Check if PIN already exists
    if (users.some(u => u.pin === newUser.pin)) {
      toast.error('PIN already exists. Please choose a different PIN.');
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      name: newUser.name,
      role: newUser.role,
      pin: newUser.pin,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, user]);
    setNewUser({ name: '', role: 'staff', pin: '' });
    setIsAddDialogOpen(false);
    toast.success('User added successfully');
  };

  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setNewUser({
      name: userToEdit.name,
      role: userToEdit.role,
      pin: userToEdit.pin
    });
  };

  const handleUpdateUser = () => {
    if (!editingUser || !newUser.name || !newUser.pin || newUser.pin.length !== 4) {
      toast.error('Please fill all fields and ensure PIN is 4 digits');
      return;
    }

    // Check if PIN already exists (excluding current user)
    if (users.some(u => u.pin === newUser.pin && u.id !== editingUser.id)) {
      toast.error('PIN already exists. Please choose a different PIN.');
      return;
    }

    setUsers(prev => prev.map(u => 
      u.id === editingUser.id 
        ? { ...u, name: newUser.name, role: newUser.role, pin: newUser.pin }
        : u
    ));

    setEditingUser(null);
    setNewUser({ name: '', role: 'staff', pin: '' });
    toast.success('User updated successfully');
  };

  const handleToggleActive = (userId: string) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, isActive: !u.isActive } : u
    ));
    toast.success('User status updated');
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === user?.id) {
      toast.error('You cannot delete your own account');
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    toast.success('User deleted successfully');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'teamleader':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 pt-20">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold">User Management</h1>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account for Villa Sun staff.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter user name"
                />
              </div>
              
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value: 'admin' | 'staff' | 'teamleader') => 
                  setNewUser(prev => ({ ...prev, role: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="teamleader">Team Leader</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="pin">PIN (4 digits)</Label>
                <Input
                  id="pin"
                  type="password"
                  value={newUser.pin}
                  onChange={(e) => setNewUser(prev => ({ ...prev, pin: e.target.value }))}
                  placeholder="Enter 4-digit PIN"
                  maxLength={4}
                  className="text-center font-mono"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>
                  Add User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{users.filter(u => u.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold">{users.filter(u => !u.isActive).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Manage Villa Sun staff accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((u) => (
              <div
                key={u.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  u.isActive ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-sm text-gray-600">
                      PIN: {u.pin} • Created: {new Date(u.createdAt || '').toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className={getRoleBadgeColor(u.role)}>
                    {u.role}
                  </Badge>
                  
                  <Badge variant={u.isActive ? "default" : "secondary"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </Badge>
                  
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditUser(u)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(u.id)}
                    >
                      {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    
                    {u.id !== user?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(u.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information for {editingUser?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter user name"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select value={newUser.role} onValueChange={(value: 'admin' | 'staff' | 'teamleader') => 
                setNewUser(prev => ({ ...prev, role: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="teamleader">Team Leader</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-pin">PIN (4 digits)</Label>
              <Input
                id="edit-pin"
                type="password"
                value={newUser.pin}
                onChange={(e) => setNewUser(prev => ({ ...prev, pin: e.target.value }))}
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                className="text-center font-mono"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>
                Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}