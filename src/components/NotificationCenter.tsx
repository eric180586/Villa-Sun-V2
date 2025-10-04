import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Task } from '../types';
import { 
  Bell, 
  BellRing,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'task_assigned' | 'task_completed' | 'task_verified' | 'task_rejected' | 'deadline_warning';
  title: string;
  message: string;
  taskId?: string;
  userId?: string;
  createdAt: Date;
  read: boolean;
}

export default function NotificationCenter() {
  const { user, users } = useAuth();
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('villa_sun_notifications', []);
  const [tasks] = useLocalStorage<Task[]>('villa_sun_tasks', []);
  const [isOpen, setIsOpen] = useState(false);

  // Generate notifications based on task changes
  useEffect(() => {
    if (!user) return;

    const generateNotifications = () => {
      const newNotifications: Notification[] = [];
      const now = new Date();

      // Check for new task assignments
      tasks.forEach(task => {
        if (task.assignedTo === user.id && task.status === 'open') {
          const existingNotification = notifications.find(n => 
            n.type === 'task_assigned' && n.taskId === task.id
          );
          
          if (!existingNotification) {
            const assigner = users.find(u => u.id === task.createdBy);
            newNotifications.push({
              id: `task_assigned_${task.id}`,
              type: 'task_assigned',
              title: 'New Task Assigned',
              message: `You have been assigned: ${task.title}${assigner ? ` by ${assigner.name}` : ''}`,
              taskId: task.id,
              userId: task.createdBy,
              createdAt: task.createdAt,
              read: false
            });
          }
        }

        // Check for completed tasks (for admin/teamleader)
        if ((user.role === 'admin' || user.role === 'teamleader') && task.status === 'completed') {
          const existingNotification = notifications.find(n => 
            n.type === 'task_completed' && n.taskId === task.id
          );
          
          if (!existingNotification && task.completedAt) {
            const completer = users.find(u => u.id === task.assignedTo);
            newNotifications.push({
              id: `task_completed_${task.id}`,
              type: 'task_completed',
              title: 'Task Completed',
              message: `${task.title} has been completed${completer ? ` by ${completer.name}` : ''}`,
              taskId: task.id,
              userId: task.assignedTo,
              createdAt: task.completedAt,
              read: false
            });
          }
        }

        // Check for verified/rejected tasks (for task assignee)
        if (task.assignedTo === user.id && (task.status === 'verified' || task.status === 'rejected')) {
          const existingNotification = notifications.find(n => 
            (n.type === 'task_verified' || n.type === 'task_rejected') && n.taskId === task.id
          );
          
          if (!existingNotification && task.verifiedAt) {
            const verifier = users.find(u => u.id === task.verifiedBy);
            newNotifications.push({
              id: `task_${task.status}_${task.id}`,
              type: task.status === 'verified' ? 'task_verified' : 'task_rejected',
              title: task.status === 'verified' ? 'Task Verified' : 'Task Rejected',
              message: `Your task "${task.title}" has been ${task.status}${verifier ? ` by ${verifier.name}` : ''}`,
              taskId: task.id,
              userId: task.verifiedBy,
              createdAt: task.verifiedAt,
              read: false
            });
          }
        }

        // Check for deadline warnings
        if (task.assignedTo === user.id && task.deadline && task.status === 'open') {
          const deadline = new Date(task.deadline);
          const timeUntilDeadline = deadline.getTime() - now.getTime();
          const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60);
          
          if (hoursUntilDeadline <= 2 && hoursUntilDeadline > 0) {
            const existingNotification = notifications.find(n => 
              n.type === 'deadline_warning' && n.taskId === task.id
            );
            
            if (!existingNotification) {
              newNotifications.push({
                id: `deadline_warning_${task.id}`,
                type: 'deadline_warning',
                title: 'Deadline Warning',
                message: `Task "${task.title}" is due in ${Math.round(hoursUntilDeadline)} hour(s)`,
                taskId: task.id,
                createdAt: now,
                read: false
              });
            }
          }
        }
      });

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
      }
    };

    generateNotifications();
    const interval = setInterval(generateNotifications, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks, user, users, notifications, setNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned': return <User className="h-4 w-4 text-blue-600" />;
      case 'task_completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'task_verified': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'task_rejected': return <X className="h-4 w-4 text-red-600" />;
      case 'deadline_warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned': return 'border-blue-200 bg-blue-50';
      case 'task_completed': return 'border-green-200 bg-green-50';
      case 'task_verified': return 'border-green-200 bg-green-50';
      case 'task_rejected': return 'border-red-200 bg-red-50';
      case 'deadline_warning': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Notifications
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all read
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] mt-6">
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No notifications yet</p>
                <p className="text-sm text-gray-500">You'll see updates about your tasks here</p>
              </div>
            ) : (
              notifications.map(notification => (
                <Card 
                  key={notification.id} 
                  className={`cursor-pointer transition-all ${
                    !notification.read ? getNotificationColor(notification.type) : 'hover:bg-gray-50'
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <CardTitle className="text-sm">
                          {notification.title}
                        </CardTitle>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}