import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Plus, Edit, Trash2, List } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  text: string;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  category: 'daily_morning' | 'housekeeping' | 'reception';
  items: ChecklistItem[];
  createdAt: string;
}

const ChecklistTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    category: '' as 'daily_morning' | 'housekeeping' | 'reception' | '',
    items: [] as ChecklistItem[]
  });
  const [newItemText, setNewItemText] = useState('');

  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const saved = localStorage.getItem('villa_sun_checklist_templates');
      if (saved) {
        setTemplates(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const saveTemplates = (updatedTemplates: ChecklistTemplate[]) => {
    setTemplates(updatedTemplates);
    localStorage.setItem('villa_sun_checklist_templates', JSON.stringify(updatedTemplates));
  };

  const addItemToNewTemplate = () => {
    if (!newItemText.trim()) return;
    
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim()
    };
    
    setNewTemplate(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    
    setNewItemText('');
  };

  const removeItemFromNewTemplate = (itemId: string) => {
    setNewTemplate(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const createTemplate = () => {
    if (!newTemplate.name.trim() || !newTemplate.category || newTemplate.items.length === 0) {
      toast.error('Bitte füllen Sie alle Felder aus und fügen Sie mindestens ein Element hinzu');
      return;
    }

    const template: ChecklistTemplate = {
      id: Date.now().toString(),
      name: newTemplate.name.trim(),
      category: newTemplate.category,
      items: newTemplate.items,
      createdAt: new Date().toISOString()
    };

    const updatedTemplates = [...templates, template];
    saveTemplates(updatedTemplates);
    
    setNewTemplate({ name: '', category: '', items: [] });
    setShowCreateDialog(false);
    toast.success('Checklisten-Vorlage erstellt');
  };

  const deleteTemplate = (templateId: string) => {
    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(updatedTemplates);
    toast.success('Vorlage gelöscht');
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'daily_morning': return 'Daily Morning';
      case 'housekeeping': return 'Housekeeping';
      case 'reception': return 'Reception';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'daily_morning': return 'bg-blue-500';
      case 'housekeeping': return 'bg-green-500';
      case 'reception': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Checklisten-Vorlagen verwalten
        </CardTitle>
        <CardDescription>
          Erstellen und verwalten Sie Vorlagen für wiederkehrende Checklisten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Neue Checklisten-Vorlage erstellen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Neue Checklisten-Vorlage</DialogTitle>
                <DialogDescription>
                  Erstellen Sie eine neue Vorlage für wiederkehrende Checklisten
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Name der Vorlage</Label>
                    <Input
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="z.B. Morgen-Routine"
                    />
                  </div>
                  <div>
                    <Label>Bereich</Label>
                    <Select 
                      value={newTemplate.category}
                      onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Bereich wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily_morning">Daily Morning</SelectItem>
                        <SelectItem value="housekeeping">Housekeeping</SelectItem>
                        <SelectItem value="reception">Reception</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <Label>Checklisten-Elemente</Label>
                    <span className="text-sm text-muted-foreground">
                      {newTemplate.items.length} Elemente
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {newTemplate.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="flex-1">{item.text}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItemFromNewTemplate(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="Neues Element hinzufügen..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && addItemToNewTemplate()}
                    />
                    <Button onClick={addItemToNewTemplate}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Button onClick={createTemplate} className="w-full">
                  Vorlage erstellen
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryColor(template.category)}>
                      {getCategoryLabel(template.category)}
                    </Badge>
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {template.items.length} Elemente
                </div>
                <div className="mt-2 space-y-1">
                  {template.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <CheckSquare className="h-3 w-3 text-gray-400" />
                      {item.text}
                    </div>
                  ))}
                  {template.items.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      ... und {template.items.length - 3} weitere Elemente
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {templates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Noch keine Checklisten-Vorlagen erstellt
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChecklistTemplateManager;