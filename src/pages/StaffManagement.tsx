import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, User, Mail, Shield, Globe } from 'lucide-react';
import { toast } from 'sonner';

const StaffManagement: React.FC = () => {
  const { users, refreshUsers } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'staff' as 'admin' | 'staff',
    language: 'de'
  });

  const handleCreateUser = async () => {
    try {
      // Get existing users from localStorage
      const existingUsers = JSON.parse(localStorage.getItem('villa_sun_users') || '[]');
      
      // Create new user with ID
      const userToCreate = {
        id: Date.now().toString(),
        ...newUser,
        created_at: new Date().toISOString()
      };

      // Add to existing users
      const updatedUsers = [...existingUsers, userToCreate];
      
      // Save to localStorage
      localStorage.setItem('villa_sun_users', JSON.stringify(updatedUsers));
      
      // Refresh users in context
      await refreshUsers();
      
      // Reset form and close dialog
      setNewUser({
        name: '',
        email: '',
        role: 'staff',
        language: 'de'
      });
      setIsCreateDialogOpen(false);
      
      toast.success(`Benutzer ${userToCreate.name} wurde erfolgreich erstellt`);
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Fehler beim Erstellen des Benutzers');
    }
  };

  const handleEditUser = async () => {
    try {
      if (!selectedUser) return;
      
      // Get existing users from localStorage
      const existingUsers = JSON.parse(localStorage.getItem('villa_sun_users') || '[]');
      
      // Update the user
      const updatedUsers = existingUsers.map((user: any) => 
        user.id === selectedUser.id ? { ...user, ...newUser } : user
      );
      
      // Save to localStorage
      localStorage.setItem('villa_sun_users', JSON.stringify(updatedUsers));
      
      // Refresh users in context
      await refreshUsers();
      
      // Reset form and close dialog
      setSelectedUser(null);
      setNewUser({
        name: '',
        email: '',
        role: 'staff',
        language: 'de'
      });
      setIsEditDialogOpen(false);
      
      toast.success(`Benutzer wurde erfolgreich aktualisiert`);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Fehler beim Aktualisieren des Benutzers');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Get existing users from localStorage
      const existingUsers = JSON.parse(localStorage.getItem('villa_sun_users') || '[]');
      
      // Remove the user
      const updatedUsers = existingUsers.filter((user: any) => user.id !== userId);
      
      // Save to localStorage
      localStorage.setItem('villa_sun_users', JSON.stringify(updatedUsers));
      
      // Refresh users in context
      await refreshUsers();
      
      toast.success('Benutzer wurde erfolgreich gelöscht');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Fehler beim Löschen des Benutzers');
    }
  };

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      role: user.role,
      language: user.language
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Mitarbeiterverwaltung</h1>
          <p className="text-gray-600">Verwalten Sie Ihre Teammitglieder</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Mitarbeiter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Mitarbeiter hinzufügen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein neues Teammitglied-Konto
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Vollständiger Name"
                />
              </div>
              <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@villasun.com"
                />
              </div>
              <div>
                <Label htmlFor="role">Rolle</Label>
                <Select value={newUser.role} onValueChange={(value: 'admin' | 'staff') => setNewUser(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Mitarbeiter</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="language">Sprache</Label>
                <Select value={newUser.language} onValueChange={(value) => setNewUser(prev => ({ ...prev, language: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleCreateUser}>
                Erstellen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </div>
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-1" />
                        {user.language === 'de' ? 'Deutsch' : 'English'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mitarbeiter bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Informationen des Mitarbeiters
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Vollständiger Name"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">E-Mail</Label>
              <Input
                id="edit-email"
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@villasun.com"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Rolle</Label>
              <Select value={newUser.role} onValueChange={(value: 'admin' | 'staff') => setNewUser(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Mitarbeiter</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-language">Sprache</Label>
              <Select value={newUser.language} onValueChange={(value) => setNewUser(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleEditUser}>
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;