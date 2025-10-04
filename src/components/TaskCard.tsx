import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Task, User } from '../types';
import { 
  CheckSquare, 
  Clock, 
  Award, 
  User as UserIcon, 
  MapPin,
  CheckCircle,
  XCircle,
  Camera
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  currentUser: User;
  users: User[];
  onStatusChange: (taskId: string, newStatus: Task['status'], completionPhoto?: string) => void;
  onApproval?: (taskId: string, approved: boolean) => void;
}

export function TaskCard({ task, currentUser, users, onStatusChange, onApproval }: TaskCardProps) {
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionNote, setCompletionNote] = useState('');

  const assignedUser = task.assignedTo ? users.find(u => u.id === task.assignedTo) : null;

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusText = (status: Task['status']) => {
    switch (status) {
      case 'pending': return 'Ausstehend';
      case 'in-progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      default: return 'Unbekannt';
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getPriorityText = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'Hoch';
      case 'medium': return 'Mittel';
      case 'low': return 'Niedrig';
      default: return 'Normal';
    }
  };

  const handleCompleteTask = () => {
    onStatusChange(task.id, 'completed');
    setShowCompletionDialog(false);
    setCompletionNote('');
  };

  const handleStartTask = () => {
    onStatusChange(task.id, 'in-progress');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">{task.title}</h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getStatusColor(task.status)}>
                  {getStatusText(task.status)}
                </Badge>
                {task.priority && (
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {getPriorityText(task.priority)}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-gray-600 text-sm">{task.description}</p>
          )}

          {/* Details */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {task.room && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{task.room}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{task.duration} Min</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4" />
              <span>{task.points} Punkte</span>
            </div>
            
            {assignedUser && (
              <div className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                <span>{assignedUser.name}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {/* Staff Actions */}
            {currentUser.role === 'staff' && (
              <>
                {task.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={handleStartTask}
                    variant="outline"
                  >
                    Beginnen
                  </Button>
                )}
                
                {task.status === 'in-progress' && (
                  <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Abschließen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Aufgabe abschließen</DialogTitle>
                        <DialogDescription>
                          Bestätigen Sie, dass Sie die Aufgabe "{task.title}" abgeschlossen haben.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Notizen (optional)</Label>
                          <Textarea
                            value={completionNote}
                            onChange={(e) => setCompletionNote(e.target.value)}
                            placeholder="Zusätzliche Informationen zur Aufgabe..."
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setShowCompletionDialog(false)}>
                            Abbrechen
                          </Button>
                          <Button onClick={handleCompleteTask}>
                            Abschließen
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </>
            )}

            {/* Admin Actions */}
            {currentUser.role === 'admin' && task.status === 'completed' && onApproval && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onApproval(task.id, true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Bestätigen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onApproval(task.id, false)}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Ablehnen
                </Button>
              </div>
            )}
          </div>

          {/* Completion Info */}
          {task.completedAt && (
            <div className="text-xs text-gray-500 pt-2 border-t">
              Abgeschlossen: {new Date(task.completedAt).toLocaleDateString('de-DE')} um{' '}
              {new Date(task.completedAt).toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}