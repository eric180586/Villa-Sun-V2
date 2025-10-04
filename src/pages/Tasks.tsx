import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { DailyMorningChecklist } from '../components/DailyMorningChecklist';
import { 
  Plus, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  Star, 
  AlertCircle, 
  Camera, 
  Upload, 
  Repeat, 
  FileText,
  Sun,
  Bed,
  Sparkles,
  Wrench,
  Home,
  Phone,
  ArrowLeft,
  Users,
  Play,
  Check,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Import the Supabase client.  This may be undefined if credentials have not
// been provided.  In that case the component will fall back to localStorage
// for persistence and will not provide realtime synchronisation across
// devices.
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  taskType: 'Daily Morning' | 'Room Cleaning' | 'Small Cleaning' | 'Extra' | 'Housekeeping' | 'Reception';
  title?: string;
  room?: string; // For Room Cleaning and Small Cleaning
  description: string;
  assignedTo?: string;
  assignedTo2?: string; // Second assignee for certain task types
  assignedBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected';
  duration: number;
  points: number;
  deadline?: string;
  createdAt: string;
  completedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  requiresCompletionPhoto: boolean;
  explanationPhoto?: string;
  completionPhoto?: string;
  completionNotes?: string;
  isTemplate: boolean;
  isRecurring: boolean;
  completedBy?: string;
  secondWorkerInvolved?: string;
  completionCount?: number; // Track rejections/resubmissions
}

// Helper function to safely convert to Date
const safeDate = (dateInput: Date | string | undefined): Date => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  return new Date(dateInput);
};

const taskCategories = [
  { id: 'Daily Morning', name: 'Daily Morning', icon: Sun, color: 'bg-yellow-500', description: 'Morgendliche Routineaufgaben' },
  { id: 'Room Cleaning', name: 'Room Cleaning', icon: Bed, color: 'bg-blue-500', description: 'Zimmerreinigung' },
  { id: 'Small Cleaning', name: 'Small Cleaning', icon: Sparkles, color: 'bg-green-500', description: 'Kleine Reinigungsarbeiten' },
  { id: 'Extra', name: 'Extra', icon: Wrench, color: 'bg-purple-500', description: 'Zusätzliche Aufgaben' },
  { id: 'Housekeeping', name: 'Housekeeping', icon: Home, color: 'bg-orange-500', description: 'Haushaltsführung' },
  { id: 'Reception', name: 'Reception', icon: Phone, color: 'bg-pink-500', description: 'Rezeptionsaufgaben' }
];

const planets = [
  'Merkur', 'Venus', 'Erde', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptun', 'Pluto'
];

export default function Tasks() {
  const { user, users } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completionPhoto, setCompletionPhoto] = useState<string>('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [secondWorkerInvolved, setSecondWorkerInvolved] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const explanationPhotoRef = useRef<HTMLInputElement>(null);

  const [newTask, setNewTask] = useState({
    taskType: 'Daily Morning' as Task['taskType'],
    title: '',
    room: '',
    description: '',
    assignedTo: '',
    assignedTo2: '',
    duration: 30,
    points: 10,
    deadline: '',
    requiresCompletionPhoto: false,
    explanationPhoto: '',
    isTemplate: false,
    isRecurring: false
  });

  // Load tasks on mount.  The load function is asynchronous to support
  // Supabase queries.  We don't await it here because React does not
  // expect a Promise from useEffect.
  useEffect(() => {
    loadTasks();
  }, []);

  // Subscribe to realtime changes on the tasks table.  Whenever a row is
  // inserted, updated or deleted the tasks list is reloaded.  This
  // subscription is only established when a Supabase client is available.
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('public:tasks')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          loadTasks();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch tasks from Supabase or fall back to localStorage.  When
  // Supabase credentials are provided, tasks will be synchronised across
  // clients via realtime subscriptions.
  const loadTasks = async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          // Cast to the local Task interface shape.  We keep field names as
          // camelCase for the React component.  Supabase returns snake_case
          // column names by default.
          const mapped = data.map((t: any) => ({
            id: t.id,
            taskType: t.task_type,
            title: t.title,
            room: t.room,
            description: t.description,
            assignedTo: t.assigned_to,
            assignedTo2: t.assigned_to2,
            assignedBy: t.assigned_by,
            status: t.status,
            duration: t.duration,
            points: t.points,
            deadline: t.deadline,
            createdAt: t.created_at,
            completedAt: t.completed_at,
            approvedAt: t.approved_at,
            rejectedAt: t.rejected_at,
            rejectionReason: t.rejection_reason,
            requiresCompletionPhoto: t.requires_completion_photo,
            explanationPhoto: t.explanation_photo,
            isTemplate: t.is_template,
            isRecurring: t.is_recurring,
            completionPhoto: t.completion_photo,
            completionNotes: t.completion_notes,
            completedBy: t.completed_by,
            secondWorkerInvolved: t.second_worker_involved,
            completionCount: t.completion_count
          })) as Task[];
          setTasks(mapped);
          return;
        }
      } catch (error) {
        console.error('Supabase error while loading tasks:', error);
      }
    }
    // Fallback to localStorage when Supabase is unavailable or returns an error
    const savedTasks = localStorage.getItem('villa_sun_tasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        const validTasks = parsedTasks.filter((task: any) => task && task.id && task.status);
        setTasks(validTasks);
      } catch (error) {
        console.error('Error loading tasks from localStorage:', error);
        setTasks([]);
      }
    }
  };

  const saveTasks = async (updatedTasks: Task[]) => {
    // Persist tasks either in Supabase (when configured) or in localStorage.
    if (supabase) {
      // Upsert each task individually.  Supabase does not support bulk upsert
      // with different conflict targets yet, so we iterate.
      try {
        for (const task of updatedTasks) {
          const record: any = {
            id: task.id,
            task_type: task.taskType,
            title: task.title,
            room: task.room,
            description: task.description,
            assigned_to: task.assignedTo,
            assigned_to2: task.assignedTo2,
            assigned_by: task.assignedBy,
            status: task.status,
            duration: task.duration,
            points: task.points,
            deadline: task.deadline,
            created_at: task.createdAt,
            completed_at: task.completedAt,
            approved_at: task.approvedAt,
            rejected_at: task.rejectedAt,
            rejection_reason: task.rejectionReason,
            requires_completion_photo: task.requiresCompletionPhoto,
            explanation_photo: task.explanationPhoto,
            is_template: task.isTemplate,
            is_recurring: task.isRecurring,
            completion_photo: task.completionPhoto,
            completion_notes: task.completionNotes,
            completed_by: task.completedBy,
            second_worker_involved: task.secondWorkerInvolved,
            completion_count: task.completionCount
          };
          await supabase.from('tasks').upsert(record);
        }
        // After upserting, state will be updated via realtime subscription
        return;
      } catch (error) {
        console.error('Supabase error while saving tasks:', error);
      }
    }
    // Filter out any null or invalid tasks before saving to localStorage
    const validTasks = updatedTasks.filter(task => task && task.id && task.status);
    localStorage.setItem('villa_sun_tasks', JSON.stringify(validTasks));
    setTasks(validTasks);
  };

  const handleExplanationPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewTask(prev => ({ ...prev, explanationPhoto: e.target?.result as string }));
        toast.success('Erklärungsfoto hochgeladen');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompletionPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCompletionPhoto(e.target?.result as string);
        toast.success('Abschlussfoto hochgeladen');
      };
      reader.readAsDataURL(file);
    }
  };

  const createTask = async () => {
    if (!newTask.taskType) {
      toast.error('Bitte wählen Sie einen Task Type aus');
      return;
    }

    // Validation for room cleaning and small cleaning
    if ((newTask.taskType === 'Room Cleaning' || newTask.taskType === 'Small Cleaning') && !newTask.room) {
      toast.error('Bitte wählen Sie ein Zimmer aus');
      return;
    }

    // Validation for other task types
    if (newTask.taskType !== 'Room Cleaning' && newTask.taskType !== 'Small Cleaning' && !newTask.title) {
      toast.error('Bitte geben Sie einen Titel ein');
      return;
    }

    const task: Task = {
      id: Date.now().toString(),
      taskType: newTask.taskType,
      title: (newTask.taskType === 'Room Cleaning' || newTask.taskType === 'Small Cleaning') 
        ? `${newTask.taskType} - ${newTask.room}` 
        : newTask.title,
      room: (newTask.taskType === 'Room Cleaning' || newTask.taskType === 'Small Cleaning') 
        ? newTask.room 
        : undefined,
      description: newTask.description,
      assignedTo: newTask.assignedTo === 'unassigned' ? undefined : newTask.assignedTo || undefined,
      assignedTo2: (['Small Cleaning', 'Room Cleaning', 'Extra'].includes(newTask.taskType) && newTask.assignedTo2 && newTask.assignedTo2 !== 'unassigned') 
        ? newTask.assignedTo2 
        : undefined,
      assignedBy: user?.id || '',
      status: 'pending',
      duration: newTask.duration,
      points: newTask.points,
      deadline: newTask.deadline || undefined,
      createdAt: new Date().toISOString(),
      requiresCompletionPhoto: newTask.requiresCompletionPhoto,
      explanationPhoto: newTask.explanationPhoto || undefined,
      isTemplate: newTask.isTemplate,
      isRecurring: newTask.isRecurring,
      completionCount: 0
    };
    // If Supabase is configured write directly to the database; otherwise
    // update localStorage.  Realtime subscribers will receive the change.
    if (supabase) {
      const record: any = {
        id: task.id,
        task_type: task.taskType,
        title: task.title,
        room: task.room,
        description: task.description,
        assigned_to: task.assignedTo,
        assigned_to2: task.assignedTo2,
        assigned_by: task.assignedBy,
        status: task.status,
        duration: task.duration,
        points: task.points,
        deadline: task.deadline,
        created_at: task.createdAt,
        requires_completion_photo: task.requiresCompletionPhoto,
        explanation_photo: task.explanationPhoto,
        is_template: task.isTemplate,
        is_recurring: task.isRecurring,
        completion_count: task.completionCount
      };
      try {
        const { error } = await supabase.from('tasks').insert(record);
        if (error) {
          console.error('Supabase insert error:', error);
          toast.error('Fehler beim Speichern der Aufgabe');
          return;
        }
      } catch (err) {
        console.error('Supabase insert error:', err);
        toast.error('Fehler beim Speichern der Aufgabe');
        return;
      }
      // Wait for realtime subscription to update state
    } else {
      const updatedTasks = [...tasks, task];
      await saveTasks(updatedTasks);
    }
    toast.success(newTask.isTemplate ? 'Vorlage erstellt' : 'Aufgabe erfolgreich erstellt');
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTask({
      taskType: 'Daily Morning',
      title: '',
      room: '',
      description: '',
      assignedTo: '',
      assignedTo2: '',
      duration: 30,
      points: 10,
      deadline: '',
      requiresCompletionPhoto: false,
      explanationPhoto: '',
      isTemplate: false,
      isRecurring: false
    });
  };

  const startTask = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task && task.id === taskId ? { ...task, status: 'in_progress' as const } : task
    ).filter(task => task !== null);
    saveTasks(updatedTasks);
    toast.success('Aufgabe gestartet');
  };

  const openCompleteDialog = (task: Task) => {
    setSelectedTask(task);
    setCompletionPhoto('');
    setCompletionNotes('');
    setSecondWorkerInvolved('none');
    setIsCompleteDialogOpen(true);
  };

  const completeTask = () => {
    if (!selectedTask) return;

    const updatedTask = {
      ...selectedTask,
      status: 'completed' as const,
      completedBy: user?.id,
      completedAt: new Date().toISOString(),
      completionPhoto: completionPhoto || undefined,
      completionNotes: completionNotes || undefined,
      secondWorkerInvolved: (secondWorkerInvolved && secondWorkerInvolved !== 'none') ? secondWorkerInvolved : undefined,
      completionCount: (selectedTask.completionCount || 0) + 1
    };

    const updatedTasks = tasks.map(task => 
      task && task.id === selectedTask.id ? updatedTask : task
    ).filter(task => task !== null);
    
    saveTasks(updatedTasks);
    setIsCompleteDialogOpen(false);
    toast.success('Aufgabe als abgeschlossen gemeldet - wartet auf Admin-Bestätigung');
  };

  const approveTask = (taskId: string) => {
    const updatedTasks = tasks.map(task => 
      task && task.id === taskId ? { 
        ...task, 
        status: 'approved' as const,
        approvedAt: new Date().toISOString()
      } : task
    ).filter(task => task !== null);
    saveTasks(updatedTasks);
    toast.success('Aufgabe genehmigt');
  };

  const rejectTask = (taskId: string, reason: string) => {
    const updatedTasks = tasks.map(task => 
      task && task.id === taskId ? { 
        ...task, 
        status: 'pending' as const, // Reset to pending after rejection
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason
      } : task
    ).filter(task => task !== null);
    saveTasks(updatedTasks);
    toast.success('Aufgabe abgelehnt');
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'approved': return <Star className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getTaskButtonText = (task: Task) => {
    if (!task || !task.status) return 'Erledigt';
    
    if (task.status === 'pending') {
      return task.completionCount && task.completionCount > 0 ? 'Me clean again' : 'Me do';
    } else if (task.status === 'in_progress') {
      return task.completionCount && task.completionCount > 0 ? 'Me clean again' : 'Me do already';
    }
    return 'Erledigt';
  };

  const getTaskButtonIcon = (task: Task) => {
    if (!task || !task.status) return <CheckCircle className="h-4 w-4" />;
    
    if (task.status === 'pending') {
      return task.completionCount && task.completionCount > 0 ? <RefreshCw className="h-4 w-4" /> : <Play className="h-4 w-4" />;
    } else if (task.status === 'in_progress') {
      return <Check className="h-4 w-4" />;
    }
    return <CheckCircle className="h-4 w-4" />;
  };

  // Filter tasks based on user role and selected category with null checks
  const filteredTasks = tasks.filter(task => {
    if (!task || !task.id || !task.status || task.isTemplate) return false;
    
    if (user?.role === 'admin') {
      return selectedCategory ? task.taskType === selectedCategory : true;
    } else {
      const isAssigned = task.assignedTo === user?.id || 
                       task.assignedTo2 === user?.id || 
                       (!task.assignedTo && !task.assignedTo2);
      return isAssigned && (selectedCategory ? task.taskType === selectedCategory : true);
    }
  });

  if (user?.role === 'staff' && !selectedCategory) {
    // Staff Category Selection View
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Aufgaben</h1>
                <p className="text-gray-600">Wählen Sie eine Kategorie aus</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {taskCategories.map((category) => {
              const Icon = category.icon;
              const categoryTasks = tasks.filter(task => 
                task && !task.isTemplate && 
                task.taskType === category.id &&
                (task.assignedTo === user?.id || task.assignedTo2 === user?.id || (!task.assignedTo && !task.assignedTo2))
              );
              
              return (
                <Card 
                  key={category.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full ${category.color} text-white`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                        <div className="mt-2 flex items-center space-x-2">
                          <Badge variant="outline">
                            {categoryTasks.length} Aufgaben
                          </Badge>
                          {categoryTasks.filter(t => t && t.status === 'pending').length > 0 && (
                            <Badge className="bg-yellow-100 text-yellow-800">
                              {categoryTasks.filter(t => t && t.status === 'pending').length} offen
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              {user?.role === 'staff' && selectedCategory && (
                <Button
                  variant="ghost"
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Zurück
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedCategory ? selectedCategory : 'Aufgaben'}
                </h1>
                <p className="text-gray-600">
                  {selectedCategory 
                    ? `${selectedCategory} Aufgaben verwalten`
                    : 'Verwalten Sie Ihre Aufgaben und Projekte'
                  }
                </p>
              </div>
            </div>
            
            {user?.role === 'admin' && (
              <div className="flex items-center gap-4">
                {/* Category Selection for Admin */}
                <Select value={selectedCategory || 'all'} onValueChange={(value) => setSelectedCategory(value === 'all' ? null : value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {taskCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Neue Aufgabe
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Neue Aufgabe erstellen</DialogTitle>
                      <DialogDescription>
                        Erstellen Sie eine neue Aufgabe für Ihr Team
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-6 py-4">
                      {/* Task Type Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="taskType">Task Type *</Label>
                        <Select value={newTask.taskType} onValueChange={(value: Task['taskType']) => setNewTask(prev => ({ ...prev, taskType: value, title: '', room: '' }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Task Type wählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {taskCategories.map(category => (
                              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Title or Room Selection */}
                      {(newTask.taskType === 'Room Cleaning' || newTask.taskType === 'Small Cleaning') ? (
                        <div className="space-y-2">
                          <Label htmlFor="room">Zimmer *</Label>
                          <Select value={newTask.room} onValueChange={(value) => setNewTask(prev => ({ ...prev, room: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Zimmer wählen" />
                            </SelectTrigger>
                            <SelectContent>
                              {planets.map(planet => (
                                <SelectItem key={planet} value={planet}>{planet}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label htmlFor="title">Titel *</Label>
                          <Input
                            id="title"
                            value={newTask.title}
                            onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Aufgabentitel eingeben"
                          />
                        </div>
                      )}

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                          id="description"
                          value={newTask.description}
                          onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Beschreibung der Aufgabe (optional)"
                          rows={3}
                        />
                      </div>

                      {/* Duration and Points */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="duration">Dauer (Minuten)</Label>
                          <Input
                            id="duration"
                            type="number"
                            min="5"
                            max="480"
                            value={newTask.duration}
                            onChange={(e) => setNewTask(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="points">Punkte</Label>
                          <Input
                            id="points"
                            type="number"
                            min="1"
                            max="100"
                            value={newTask.points}
                            onChange={(e) => setNewTask(prev => ({ ...prev, points: parseInt(e.target.value) || 10 }))}
                          />
                        </div>
                      </div>

                      {/* Staff Assignment */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="assignedTo">Mitarbeiter zuteilen</Label>
                          <Select value={newTask.assignedTo} onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedTo: value }))}>
                            <SelectTrigger>
                              <SelectValue placeholder="Mitarbeiter wählen (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Alle Mitarbeiter</SelectItem>
                              {users.filter(u => u.role === 'staff').map((user) => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Second assignee for specific task types */}
                        {['Small Cleaning', 'Room Cleaning', 'Extra'].includes(newTask.taskType) && (
                          <div className="space-y-2">
                            <Label htmlFor="assignedTo2">Zweiter Mitarbeiter (optional)</Label>
                            <Select value={newTask.assignedTo2} onValueChange={(value) => setNewTask(prev => ({ ...prev, assignedTo2: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Zweiten Mitarbeiter wählen (optional)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Keiner</SelectItem>
                                {users.filter(u => u.role === 'staff' && u.id !== newTask.assignedTo).map((user) => (
                                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="requiresCompletionPhoto"
                            checked={newTask.requiresCompletionPhoto}
                            onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, requiresCompletionPhoto: checked as boolean }))}
                          />
                          <Label htmlFor="requiresCompletionPhoto" className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            Require completion photo
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isTemplate"
                            checked={newTask.isTemplate}
                            onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, isTemplate: checked as boolean }))}
                          />
                          <Label htmlFor="isTemplate" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Save as template
                          </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isRecurring"
                            checked={newTask.isRecurring}
                            onCheckedChange={(checked) => setNewTask(prev => ({ ...prev, isRecurring: checked as boolean }))}
                          />
                          <Label htmlFor="isRecurring" className="flex items-center gap-2">
                            <Repeat className="h-4 w-4" />
                            Recurring task (daily)
                          </Label>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Abbrechen
                      </Button>
                      <Button onClick={createTask}>
                        {newTask.isTemplate ? 'Vorlage erstellen' : 'Aufgabe erstellen'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Daily Morning Checklist - Special Section */}
        {selectedCategory === 'Daily Morning' && (
          <div className="mb-8">
            <DailyMorningChecklist 
              taskId="daily-morning-checklist"
              isAdmin={user?.role === 'admin'}
            />
          </div>
        )}

        <div className="grid gap-6">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Keine Aufgaben vorhanden</h3>
                <p className="text-gray-500 text-center">
                  {user?.role === 'admin' 
                    ? 'Erstellen Sie eine neue Aufgabe für Ihr Team.'
                    : `Sie haben derzeit keine ${selectedCategory || ''} Aufgaben.`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => {
              if (!task || !task.id || !task.status) return null;
              
              const assignedUser = users.find(u => u.id === task.assignedTo);
              const assignedUser2 = users.find(u => u.id === task.assignedTo2);
              const assignedByUser = users.find(u => u.id === task.assignedBy);
              const completedByUser = users.find(u => u.id === task.completedBy);
              const secondWorkerUser = users.find(u => u.id === task.secondWorkerInvolved);
              
              return (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{task.title || 'Untitled Task'}</CardTitle>
                          {task.requiresCompletionPhoto && <Camera className="h-4 w-4 text-blue-600" />}
                          {task.isRecurring && <Repeat className="h-4 w-4 text-green-600" />}
                          {task.completionCount && task.completionCount > 0 && (
                            <Badge variant="secondary">
                              {task.completionCount}x bearbeitet
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mb-2">
                          {task.description || 'No description'}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium">{task.taskType}</span>
                          {task.room && <span>• {task.room}</span>}
                          <span>• {task.duration} Min</span>
                          <span>• {task.points} Punkte</span>
                        </div>
                        
                        {task.rejectionReason && task.status === 'pending' && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-sm text-red-800">
                              <strong>Ablehnungsgrund:</strong> {task.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(task.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(task.status)}
                            {task.status === 'pending' && 'Offen'}
                            {task.status === 'in_progress' && 'In Bearbeitung'}
                            {task.status === 'completed' && 'Abgeschlossen'}
                            {task.status === 'approved' && 'Genehmigt'}
                            {task.status === 'rejected' && 'Abgelehnt'}
                          </div>
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>
                            {assignedUser?.name || 'Alle Mitarbeiter'}
                            {assignedUser2 && ` & ${assignedUser2.name}`}
                          </span>
                        </div>
                        {task.deadline && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{safeDate(task.deadline).toLocaleString('de-DE')}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Staff Actions */}
                        {user?.role === 'staff' && (
                          <>
                            {(task.assignedTo === user?.id || task.assignedTo2 === user?.id || (!task.assignedTo && !task.assignedTo2)) && task.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startTask(task.id)}
                              >
                                {getTaskButtonIcon(task)}
                                <span className="ml-2">{getTaskButtonText(task)}</span>
                              </Button>
                            )}
                            {(task.assignedTo === user?.id || task.assignedTo2 === user?.id || (!task.assignedTo && !task.assignedTo2)) && task.status === 'in_progress' && (
                              <Button
                                size="sm"
                                onClick={() => openCompleteDialog(task)}
                              >
                                {getTaskButtonIcon(task)}
                                <span className="ml-2">{getTaskButtonText(task)}</span>
                              </Button>
                            )}
                          </>
                        )}

                        {/* Admin Actions */}
                        {user?.role === 'admin' && task.status === 'completed' && (
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => approveTask(task.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Genehmigen
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  Ablehnen
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Aufgabe ablehnen</DialogTitle>
                                  <DialogDescription>
                                    Bitte geben Sie einen Grund für die Ablehnung an
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <Textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Grund für die Ablehnung..."
                                  />
                                  <Button 
                                    onClick={() => {
                                      rejectTask(task.id, rejectionReason);
                                      setRejectionReason('');
                                    }}
                                    className="w-full"
                                  >
                                    Ablehnen
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Erstellt von {assignedByUser?.name || 'Unknown'} am {safeDate(task.createdAt).toLocaleDateString('de-DE')}</span>
                        {task.status === 'completed' && completedByUser && (
                          <span>Abgeschlossen von {completedByUser.name}</span>
                        )}
                      </div>
                      {task.secondWorkerInvolved && secondWorkerUser && (
                        <div className="mt-1">
                          <span>Zweiter Mitarbeiter: {secondWorkerUser.name}</span>
                        </div>
                      )}
                      {task.completionNotes && (
                        <div className="mt-1">
                          <span>Notizen: {task.completionNotes}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Complete Task Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aufgabe abschließen</DialogTitle>
            <DialogDescription>
              {selectedTask?.title || 'Untitled Task'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Second worker involvement for specific task types */}
            {selectedTask && ['Small Cleaning', 'Room Cleaning', 'Extra'].includes(selectedTask.taskType) && 
             !selectedTask.assignedTo && !selectedTask.assignedTo2 && (
              <div className="space-y-2">
                <Label>War noch ein zweiter Mitarbeiter beteiligt?</Label>
                <Select value={secondWorkerInvolved} onValueChange={setSecondWorkerInvolved}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zweiten Mitarbeiter wählen (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nein</SelectItem>
                    {users.filter(u => u.role === 'staff' && u.id !== user?.id).map((user) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Completion notes */}
            <div className="space-y-2">
              <Label>Notizen (optional)</Label>
              <Textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Zusätzliche Informationen..."
                rows={3}
              />
            </div>

            {/* Photo upload */}
            {(selectedTask?.requiresCompletionPhoto || 
              (selectedTask && ['Small Cleaning', 'Room Cleaning', 'Extra'].includes(selectedTask.taskType))) && (
              <div className="space-y-2">
                <Label>
                  {selectedTask?.requiresCompletionPhoto ? 'Abschlussfoto (erforderlich)' : 'Foto hochladen (optional)'}
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Foto wählen
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCompletionPhotoUpload}
                    className="hidden"
                  />
                  {completionPhoto && (
                    <span className="text-sm text-green-600">Foto hochgeladen</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={completeTask}
              disabled={selectedTask?.requiresCompletionPhoto && !completionPhoto}
            >
              Abschließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}