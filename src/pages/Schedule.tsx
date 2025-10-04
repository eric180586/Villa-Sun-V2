import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, Heart, CheckCircle, XCircle, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface ScheduleWishRequest {
  id: string;
  userId: string;
  date: string;
  preferredShift: 'off';
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
}

const Schedule: React.FC = () => {
  const { user, users } = useAuth();
  const [currentWeek, setCurrentWeek] = useState(0);
  const [showWishDialog, setShowWishDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [wishReason, setWishReason] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const getWeekDates = (weekOffset: number) => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7));
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getScheduleData = () => {
    try {
      return JSON.parse(localStorage.getItem('villa_sun_schedules') || '[]');
    } catch {
      return [];
    }
  };

  const saveScheduleData = (schedules: any[]) => {
    localStorage.setItem('villa_sun_schedules', JSON.stringify(schedules));
    setRefreshKey(prev => prev + 1); // Force re-render
  };

  const getWishRequests = () => {
    try {
      return JSON.parse(localStorage.getItem('villa_sun_wish_requests') || '[]');
    } catch {
      return [];
    }
  };

  const saveWishRequests = (requests: ScheduleWishRequest[]) => {
    localStorage.setItem('villa_sun_wish_requests', JSON.stringify(requests));
  };

  const updateShift = (userId: string, date: string, shift: 'früh' | 'spät' | 'off') => {
    if (user?.role !== 'admin') return;

    const schedules = getScheduleData();
    const existingIndex = schedules.findIndex((s: any) => 
      s.user_id === userId && s.date === date
    );

    if (existingIndex >= 0) {
      schedules[existingIndex].shift = shift;
    } else {
      schedules.push({
        id: Date.now().toString(),
        user_id: userId,
        date,
        shift,
        is_approved: true,
        created_at: new Date().toISOString()
      });
    }

    saveScheduleData(schedules);
    
    // Notify affected user about schedule change
    const affectedUser = users.find(u => u.id === userId);
    if (affectedUser && affectedUser.role === 'staff') {
      const notifications = JSON.parse(localStorage.getItem('villa_sun_notifications') || '[]');
      const newNotification = {
        id: Date.now().toString(),
        userId: userId,
        title: 'Dienstplan geändert',
        message: `Ihre Schicht für ${new Date(date).toLocaleDateString('de-DE')} wurde auf ${shift === 'früh' ? 'Frühschicht (09:00-15:00)' : shift === 'spät' ? 'Spätschicht (15:00-21:00)' : 'Frei'} geändert.`,
        type: 'info',
        createdAt: new Date().toISOString(),
        read: false
      };
      
      notifications.push(newNotification);
      localStorage.setItem('villa_sun_notifications', JSON.stringify(notifications));
    }
    
    toast.success('Schicht aktualisiert');
  };

  const getShiftForUserAndDate = (userId: string, date: string) => {
    const schedules = getScheduleData();
    const schedule = schedules.find((s: any) => 
      s.user_id === userId && s.date === date
    );
    return schedule?.shift || 'off';
  };

  const getShiftBadge = (shift: string, isClickable: boolean = false) => {
    const baseClass = isClickable ? 'cursor-pointer hover:opacity-80' : '';
    
    switch (shift) {
      case 'früh':
        return <Badge variant="default" className={`bg-blue-500 text-white ${baseClass}`}>Früh</Badge>;
      case 'spät':
        return <Badge variant="default" className={`bg-orange-500 text-white ${baseClass}`}>Spät</Badge>;
      case 'off':
        return <Badge variant="secondary" className={baseClass}>OFF</Badge>;
      default:
        return <Badge variant="outline" className={baseClass}>-</Badge>;
    }
  };

  const cycleShift = (userId: string, date: string, currentShift: string) => {
    if (user?.role !== 'admin') return;

    const shifts = ['off', 'früh', 'spät'];
    const currentIndex = shifts.indexOf(currentShift);
    const nextShift = shifts[(currentIndex + 1) % shifts.length] as 'früh' | 'spät' | 'off';
    
    updateShift(userId, date, nextShift);
  };

  const canSubmitWishes = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 5 = Friday
    const hour = now.getHours();
    
    // Can submit until Friday 22:00 for NEXT week only
    return dayOfWeek < 5 || (dayOfWeek === 5 && hour < 22);
  };

  const getNextWeekDates = () => {
    return getWeekDates(1); // Always next week
  };

  const handleWishSubmit = () => {
    if (!user || !selectedDate || !wishReason.trim()) {
      toast.error('Bitte wählen Sie ein Datum und geben Sie einen Grund an!');
      return;
    }

    if (!canSubmitWishes()) {
      toast.error('Freiwünsche können nur bis Freitag 22:00 Uhr eingereicht werden!');
      return;
    }

    const wishRequests = getWishRequests();
    
    // Check if wish already exists for this date
    const existingWish = wishRequests.find((w: ScheduleWishRequest) => 
      w.userId === user.id && w.date === selectedDate
    );

    if (existingWish) {
      toast.error('Sie haben bereits einen Wunsch für diesen Tag eingereicht!');
      return;
    }

    const newWish: ScheduleWishRequest = {
      id: Date.now().toString(),
      userId: user.id,
      date: selectedDate,
      preferredShift: 'off',
      reason: wishReason.trim(),
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };

    const updatedWishes = [...wishRequests, newWish];
    saveWishRequests(updatedWishes);
    
    setSelectedDate('');
    setWishReason('');
    setShowWishDialog(false);
    toast.success('Freiwunsch eingereicht - wartet auf Admin-Genehmigung');
  };

  const handleWishResponse = (wishId: string, status: 'approved' | 'rejected', response?: string) => {
    if (user?.role !== 'admin') return;

    const wishRequests = getWishRequests();
    const wish = wishRequests.find((w: ScheduleWishRequest) => w.id === wishId);
    
    if (!wish) return;

    // Remove the wish from pending list
    const updatedWishes = wishRequests.filter((w: ScheduleWishRequest) => w.id !== wishId);
    saveWishRequests(updatedWishes);
    
    // If approved, update the schedule
    if (status === 'approved') {
      updateShift(wish.userId, wish.date, 'off');
    }
    
    // Create notification for staff
    const notifications = JSON.parse(localStorage.getItem('villa_sun_notifications') || '[]');
    const newNotification = {
      id: Date.now().toString(),
      userId: wish.userId,
      title: `Freiwunsch ${status === 'approved' ? 'genehmigt' : 'abgelehnt'}`,
      message: `Ihr Freiwunsch für ${new Date(wish.date).toLocaleDateString('de-DE')} wurde ${status === 'approved' ? 'genehmigt' : 'abgelehnt'}.${response ? ` Grund: ${response}` : ''}`,
      type: status === 'approved' ? 'success' : 'info',
      createdAt: new Date().toISOString(),
      read: false
    };
    
    notifications.push(newNotification);
    localStorage.setItem('villa_sun_notifications', JSON.stringify(notifications));
    
    toast.success(`Freiwunsch ${status === 'approved' ? 'genehmigt' : 'abgelehnt'}`);
  };

  const weekDates = getWeekDates(currentWeek);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  const dayNames = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  // Show only staff members, exclude admin
  const displayUsers = users.filter(u => u.role === 'staff');
  const wishRequests = getWishRequests();
  const pendingWishes = wishRequests.filter((w: ScheduleWishRequest) => w.status === 'pending');

  // Get user's notifications
  const userNotifications = JSON.parse(localStorage.getItem('villa_sun_notifications') || '[]')
    .filter((n: any) => n.userId === user?.id && !n.read);

  return (
    <div key={refreshKey} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dienstplan</h1>
          <p className="text-muted-foreground">
            Wochenübersicht der Schichten
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Notifications for staff */}
          {user?.role === 'staff' && userNotifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Mark notifications as read
                const allNotifications = JSON.parse(localStorage.getItem('villa_sun_notifications') || '[]');
                const updatedNotifications = allNotifications.map((n: any) => 
                  n.userId === user?.id ? { ...n, read: true } : n
                );
                localStorage.setItem('villa_sun_notifications', JSON.stringify(updatedNotifications));
                
                // Show notifications
                userNotifications.forEach((n: any) => {
                  toast(n.title, { description: n.message });
                });
              }}
            >
              <Bell className="h-4 w-4 mr-2" />
              {userNotifications.length} Neue Nachrichten
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => setCurrentWeek(currentWeek - 1)}
          >
            ← Vorherige Woche
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentWeek(0)}
          >
            Aktuelle Woche
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentWeek(currentWeek + 1)}
          >
            Nächste Woche →
          </Button>
        </div>
      </div>

      {/* Staff Wish Request Section */}
      {user?.role === 'staff' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Freiwünsche (Nur für nächste Woche)
            </CardTitle>
            <CardDescription>
              {canSubmitWishes() 
                ? 'Beantragen Sie freie Tage für die nächste Woche (bis Freitag 22:00 Uhr)'
                : 'Freiwünsche können nur bis Freitag 22:00 Uhr eingereicht werden'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Dialog open={showWishDialog} onOpenChange={setShowWishDialog}>
                <DialogTrigger asChild>
                  <Button disabled={!canSubmitWishes()}>
                    <Heart className="h-4 w-4 mr-2" />
                    Freien Tag beantragen
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Freien Tag beantragen (Nächste Woche)</DialogTitle>
                    <DialogDescription>
                      Wählen Sie ein Datum aus der nächsten Woche und geben Sie einen Grund an
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Datum (Nächste Woche) *</Label>
                      <Select value={selectedDate} onValueChange={setSelectedDate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Datum wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {getNextWeekDates().map((date) => (
                            <SelectItem key={date.toISOString()} value={date.toISOString().split('T')[0]}>
                              {date.toLocaleDateString('de-DE', { 
                                weekday: 'long', 
                                day: '2-digit', 
                                month: '2-digit' 
                              })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Grund * (Pflichtfeld)</Label>
                      <Textarea
                        value={wishReason}
                        onChange={(e) => setWishReason(e.target.value)}
                        placeholder="Grund für den freien Tag (z.B. Arzttermin, persönlicher Anlass)..."
                        required
                      />
                    </div>
                    <Button 
                      onClick={handleWishSubmit} 
                      className="w-full"
                      disabled={!selectedDate || !wishReason.trim()}
                    >
                      Antrag einreichen
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Wish Management */}
      {user?.role === 'admin' && pendingWishes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-500" />
              Freiwünsche verwalten ({pendingWishes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingWishes.map((wish: ScheduleWishRequest) => {
                const requestUser = users.find(u => u.id === wish.userId);
                return (
                  <div key={wish.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{requestUser?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(wish.date).toLocaleDateString('de-DE')} - Freier Tag
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        <strong>Grund:</strong> {wish.reason}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleWishResponse(wish.id, 'approved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Genehmigen
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleWishResponse(wish.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Ablehnen
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Woche vom {weekStart.toLocaleDateString('de-DE')} bis {weekEnd.toLocaleDateString('de-DE')}
          </CardTitle>
          <CardDescription>
            {user?.role === 'admin' ? 'Klicken Sie auf die Schichten, um sie zu ändern' : 'Dienstplan für diese Woche'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Mitarbeiter</th>
                  {weekDates.map((date, index) => (
                    <th key={date.toISOString()} className="text-center p-3 font-medium min-w-[100px]">
                      <div className="flex flex-col items-center">
                        <span className="text-sm">{dayNames[index]}</span>
                        <span className="text-xs text-muted-foreground">
                          {date.getDate().toString().padStart(2, '0')}.{(date.getMonth() + 1).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayUsers.map((scheduleUser) => (
                  <tr key={scheduleUser.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{scheduleUser.name}</div>
                          <div className="text-sm text-muted-foreground">{scheduleUser.role}</div>
                        </div>
                      </div>
                    </td>
                    {weekDates.map((date) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const shift = getShiftForUserAndDate(scheduleUser.id, dateStr);
                      const canEdit = user?.role === 'admin';
                      
                      return (
                        <td key={dateStr} className="p-3 text-center">
                          <div 
                            onClick={() => canEdit && cycleShift(scheduleUser.id, dateStr, shift)}
                            className={canEdit ? 'cursor-pointer hover:bg-gray-100 p-1 rounded' : ''}
                          >
                            {getShiftBadge(shift, canEdit)}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend for everyone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Schichtzeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <div className="font-medium flex items-center gap-2">
                  {getShiftBadge('früh')} Frühschicht
                </div>
                <div className="text-sm text-muted-foreground">09:00 - 15:00 Uhr</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <div className="font-medium flex items-center gap-2">
                  {getShiftBadge('spät')} Spätschicht
                </div>
                <div className="text-sm text-muted-foreground">15:00 - 21:00 Uhr</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium flex items-center gap-2">
                  {getShiftBadge('off')} Frei
                </div>
                <div className="text-sm text-muted-foreground">Kein Dienst</div>
              </div>
            </div>
          </div>
          
          {user?.role === 'admin' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Administrator:</strong> Klicken Sie auf die Schicht-Badges, um zwischen OFF → Früh → Spät zu wechseln.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Schedule;