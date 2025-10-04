import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Plus, 
  Copy, 
  Trash2, 
  Clock, 
  User, 
  Camera,
  Repeat,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface TaskTemplate {
  id: string;
  taskType: 'Daily Morning' | 'Room Cleaning' | 'Small Cleaning' | 'Extra' | 'Housekeeping' | 'Reception';
  title?: string;
  room?: string;
  description: string;
  assignedTo?: string;
  assignedTo2?: string;
  assignedBy: string;
  duration: number;
  points: number;
  requiresCompletionPhoto: boolean;
  explanationPhoto?: string;
  isRecurring: boolean;
  createdAt: string;
}

export default function TaskTemplates() {
  const { user, users } = useAuth();
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    // Load templates from tasks that are marked as templates
    const savedTasks = localStorage.getItem('villa_sun_tasks');
    if (savedTasks) {
      try {
        const tasks = JSON.parse(savedTasks);
        const templateTasks = tasks.filter((task: any) => task.isTemplate);
        setTemplates(templateTasks);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    }
  };

  const createTaskFromTemplate = (template: TaskTemplate) => {
    // Load existing tasks
    const savedTasks = localStorage.getItem('villa_sun_tasks');
    let tasks = [];
    if (savedTasks) {
      try {
        tasks = JSON.parse(savedTasks);
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }

    // Create new task from template
    const newTask = {
      ...template,
      id: Date.now().toString(),
      status: 'pending',
      isTemplate: false,
      createdAt: new Date().toISOString(),
      assignedBy: user?.id || ''
    };

    // Add to tasks
    const updatedTasks = [...tasks, newTask];
    localStorage.setItem('villa_sun_tasks', JSON.stringify(updatedTasks));
    
    toast.success('Aufgabe aus Vorlage erstellt');
  };

  const deleteTemplate = (templateId: string) => {
    // Remove from tasks (templates are stored as tasks with isTemplate = true)
    const savedTasks = localStorage.getItem('villa_sun_tasks');
    if (savedTasks) {
      try {
        const tasks = JSON.parse(savedTasks);
        const updatedTasks = tasks.filter((task: any) => task.id !== templateId);
        localStorage.setItem('villa_sun_tasks', JSON.stringify(updatedTasks));
        loadTemplates(); // Reload templates
        toast.success('Vorlage gelöscht');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Fehler beim Löschen der Vorlage');
      }
    }
  };

  const getTaskTypeColor = (taskType: string) => {
    switch (taskType) {
      case 'Daily Morning': return 'bg-yellow-100 text-yellow-800';
      case 'Room Cleaning': return 'bg-blue-100 text-blue-800';
      case 'Small Cleaning': return 'bg-green-100 text-green-800';
      case 'Extra': return 'bg-purple-100 text-purple-800';
      case 'Housekeeping': return 'bg-orange-100 text-orange-800';
      case 'Reception': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Aufgaben-Vorlagen</h1>
            <p className="text-gray-600 mt-1">Verfügbare Vorlagen anzeigen</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Vorlagen verfügbar</h3>
              <p className="text-gray-500">Es wurden noch keine Aufgaben-Vorlagen erstellt.</p>
            </div>
          ) : (
            templates.map((template) => {
              const assignedUser = users.find(u => u.id === template.assignedTo);
              const assignedUser2 = users.find(u => u.id === template.assignedTo2);
              const createdByUser = users.find(u => u.id === template.assignedBy);

              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {template.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge className={getTaskTypeColor(template.taskType)}>
                            {template.taskType}
                          </Badge>
                          {template.room && (
                            <Badge variant="outline">
                              {template.room}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {template.requiresCompletionPhoto && <Camera className="h-4 w-4 text-blue-600" />}
                        {template.isRecurring && <Repeat className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-3">{template.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>
                          {assignedUser?.name || 'Alle Mitarbeiter'}
                          {assignedUser2 && ` & ${assignedUser2.name}`}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {template.duration} Min • {template.points} Punkte
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          Erstellt von {createdByUser?.name}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => createTaskFromTemplate(template)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Verwenden
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Aufgaben-Vorlagen</h1>
          <p className="text-gray-600 mt-1">Vorlagen verwalten und verwenden</p>
        </div>
        <Badge variant="outline">Administrator</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Vorlagen verfügbar</h3>
            <p className="text-gray-500">
              Erstellen Sie Vorlagen im Aufgaben-Manager, indem Sie "Save as template" aktivieren.
            </p>
          </div>
        ) : (
          templates.map((template) => {
            const assignedUser = users.find(u => u.id === template.assignedTo);
            const assignedUser2 = users.find(u => u.id === template.assignedTo2);
            const createdByUser = users.find(u => u.id === template.assignedBy);

            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {template.title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className={getTaskTypeColor(template.taskType)}>
                          {template.taskType}
                        </Badge>
                        {template.room && (
                          <Badge variant="outline">
                            {template.room}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {template.requiresCompletionPhoto && <Camera className="h-4 w-4 text-blue-600" />}
                      {template.isRecurring && <Repeat className="h-4 w-4 text-green-600" />}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-3">{template.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>
                        {assignedUser?.name || 'Alle Mitarbeiter'}
                        {assignedUser2 && ` & ${assignedUser2.name}`}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {template.duration} Min • {template.points} Punkte
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        Erstellt von {createdByUser?.name}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => createTaskFromTemplate(template)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Verwenden
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}