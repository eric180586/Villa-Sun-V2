import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { AdminPointsManagerTile } from '../components/AdminPointsManagerTile';
import ImportantInfosTile from '../components/ImportantInfosTile';
import { 
  CheckSquare, 
  Clock, 
  Award, 
  Users, 
  Calendar,
  Timer,
  LogOut,
  TrendingUp,
  AlertCircle,
  Bell,
  ClipboardCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  room: string;
  assignedTo?: string;
  assignedBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  duration: number;
  points: number;
  createdAt: string;
  requiresPhoto: boolean;
  isTemplate: boolean;
  isRecurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
}

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn?: string | Date;
  checkOut?: string | Date;
}

interface CheckOutRequest {
  id: string;
  userId: string;
  attendanceId: string;
  reason: string;
  requestedAt: string | Date;
  status: 'pending' | 'approved' | 'rejected';
}

interface PointEntry {
  id: string;
  userId: string;
  ruleId: string;
  points: number;
  reason: string;
  customReason?: string;
  assignedBy: string;
  assignedAt: string;
  multiplier: number;
}

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user, users } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [checkOutRequests, setCheckOutRequests] = useState<CheckOutRequest[]>([]);
  const [pointEntries, setPointEntries] = useState<PointEntry[]>([]);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [checkOutReason, setCheckOutReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load tasks
    const savedTasks = localStorage.getItem('villa_sun_tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }

    // Load attendance
    const savedAttendance = localStorage.getItem('villa_sun_attendance');
    if (savedAttendance) {
      try {
        setAttendance(JSON.parse(savedAttendance));
      } catch (error) {
        console.error('Error loading attendance:', error);
      }
    }

    // Load checkout requests
    const savedCheckOutRequests = localStorage.getItem('villa_sun_checkout_requests');
    if (savedCheckOutRequests) {
      try {
        setCheckOutRequests(JSON.parse(savedCheckOutRequests));
      } catch (error) {
        console.error('Error loading checkout requests:', error);
      }
    }

    // Load point entries
    const savedPointEntries = localStorage.getItem('villa_sun_point_entries');
    if (savedPointEntries) {
      try {
        setPointEntries(JSON.parse(savedPointEntries));
      } catch (error) {
        console.error('Error loading point entries:', error);
      }
    }
  };

  const today = new Date().toDateString();
  const todayAttendance = attendance.find(record => 
    record.userId === user?.id && record.date === today
  );

  // Calculate today's tasks for current user (assigned by admin) - EXCLUDE ADMIN
  const todayTasks = tasks.filter(task => {
    if (!task.createdAt) return false;
    try {
      const taskDate = new Date(task.createdAt);
      return !task.isTemplate && 
             taskDate.toDateString() === today &&
             (task.assignedTo === user?.id || (!task.assignedTo && user?.role === 'staff'));
    } catch (error) {
      console.error('Error parsing task date:', error);
      return false;
    }
  });

  // Calculate completed tasks today
  const completedTodayTasks = todayTasks.filter(task => 
    task.status === 'completed' || task.status === 'approved'
  );

  // Calculate possible points today (from assigned tasks)
  const possiblePointsToday = todayTasks.reduce((sum, task) => sum + (task.points || 0), 0);

  // Calculate earned points from completed tasks
  const earnedPointsFromTasks = completedTodayTasks.reduce((sum, task) => sum + (task.points || 0), 0);

  // Calculate violation points (negative points from admin)
  const todayViolations = pointEntries.filter(entry => {
    if (!entry.assignedAt) return false;
    try {
      const entryDate = new Date(entry.assignedAt);
      return entry.userId === user?.id && 
             entryDate.toDateString() === today &&
             entry.points < 0;
    } catch (error) {
      console.error('Error parsing point entry date:', error);
      return false;
    }
  });
  const violationPointsToday = todayViolations.reduce((sum, entry) => sum + Math.abs(entry.points || 0), 0);

  // Calculate actual points today (earned - violations)
  const actualPointsToday = Math.max(0, earnedPointsFromTasks - violationPointsToday);

  // Calculate monthly points (cumulative until today)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTasks = tasks.filter(task => {
    if (!task.createdAt) return false;
    try {
      const taskDate = new Date(task.createdAt);
      return !task.isTemplate &&
             (task.assignedTo === user?.id || (!task.assignedTo && user?.role === 'staff')) &&
             (task.status === 'completed' || task.status === 'approved') &&
             taskDate.getMonth() === currentMonth &&
             taskDate.getFullYear() === currentYear &&
             taskDate <= new Date();
    } catch (error) {
      console.error('Error parsing monthly task date:', error);
      return false;
    }
  });
  
  const monthlyViolations = pointEntries.filter(entry => {
    if (!entry.assignedAt) return false;
    try {
      const entryDate = new Date(entry.assignedAt);
      return entry.userId === user?.id &&
             entry.points < 0 &&
             entryDate.getMonth() === currentMonth &&
             entryDate.getFullYear() === currentYear &&
             entryDate <= new Date();
    } catch (error) {
      console.error('Error parsing monthly violation date:', error);
      return false;
    }
  });

  const earnedPointsMonthly = monthlyTasks.reduce((sum, task) => sum + (task.points || 0), 0);
  const violationPointsMonthly = monthlyViolations.reduce((sum, entry) => sum + Math.abs(entry.points || 0), 0);
  const actualPointsMonthly = Math.max(0, earnedPointsMonthly - violationPointsMonthly);

  // Calculate possible monthly points (from all assigned tasks this month for current user)
  const possibleMonthlyTasks = tasks.filter(task => {
    if (!task.createdAt) return false;
    try {
      const taskDate = new Date(task.createdAt);
      return !task.isTemplate &&
             (task.assignedTo === user?.id || (!task.assignedTo && user?.role === 'staff')) &&
             taskDate.getMonth() === currentMonth &&
             taskDate.getFullYear() === currentYear &&
             taskDate <= new Date();
    } catch (error) {
      console.error('Error parsing possible monthly task date:', error);
      return false;
    }
  });
  const possiblePointsMonthly = possibleMonthlyTasks.reduce((sum, task) => sum + (task.points || 0), 0);

  // Calculate team points (cumulative for all STAFF until today) - EXCLUDE ADMIN
  const teamMonthlyTasks = tasks.filter(task => {
    if (!task.createdAt) return false;
    try {
      const taskDate = new Date(task.createdAt);
      const taskUser = users.find(u => u.id === task.assignedTo);
      return !task.isTemplate &&
             (task.status === 'completed' || task.status === 'approved') &&
             taskDate.getMonth() === currentMonth &&
             taskDate.getFullYear() === currentYear &&
             taskDate <= new Date() &&
             (!task.assignedTo || taskUser?.role === 'staff'); // Only staff tasks
    } catch (error) {
      console.error('Error parsing team task date:', error);
      return false;
    }
  });
  
  const teamMonthlyViolations = pointEntries.filter(entry => {
    if (!entry.assignedAt) return false;
    try {
      const entryDate = new Date(entry.assignedAt);
      const entryUser = users.find(u => u.id === entry.userId);
      return entry.points < 0 &&
             entryDate.getMonth() === currentMonth &&
             entryDate.getFullYear() === currentYear &&
             entryDate <= new Date() &&
             entryUser?.role === 'staff'; // Only staff violations
    } catch (error) {
      console.error('Error parsing team violation date:', error);
      return false;
    }
  });

  const teamEarnedPoints = teamMonthlyTasks.reduce((sum, task) => sum + (task.points || 0), 0);
  const teamViolationPoints = teamMonthlyViolations.reduce((sum, entry) => sum + Math.abs(entry.points || 0), 0);
  const teamActualPoints = Math.max(0, teamEarnedPoints - teamViolationPoints);

  // Calculate possible team points (ONLY STAFF)
  const teamPossibleTasks = tasks.filter(task => {
    if (!task.createdAt) return false;
    try {
      const taskDate = new Date(task.createdAt);
      const taskUser = users.find(u => u.id === task.assignedTo);
      return !task.isTemplate &&
             taskDate.getMonth() === currentMonth &&
             taskDate.getFullYear() === currentYear &&
             taskDate <= new Date() &&
             (!task.assignedTo || taskUser?.role === 'staff'); // Only staff tasks
    } catch (error) {
      console.error('Error parsing team possible task date:', error);
      return false;
    }
  });
  const teamPossiblePoints = teamPossibleTasks.reduce((sum, task) => sum + (task.points || 0), 0);

  // Calculate expected working hours - Updated calculation
  const calculateExpectedWorkingHours = () => {
    if (user?.role === 'admin') return '0h 0m';
    
    const totalMinutes = todayTasks.reduce((sum, task) => sum + (task.duration || 30), 0);
    
    // Get number of present staff today (checked in) - EXCLUDE ADMIN
    const todayAttendanceRecords = attendance.filter(record => {
      const recordUser = users.find(u => u.id === record.userId);
      return record.date === today && record.checkIn && recordUser?.role === 'staff';
    });
    const presentStaffCount = todayAttendanceRecords.length || 1;
    
    // Add 2 hours (120 minutes) per staff member for general tasks
    const generalTaskMinutes = presentStaffCount * 120;
    const totalWithGeneralTasks = totalMinutes + generalTaskMinutes;
    
    const adjustedMinutes = Math.round(totalWithGeneralTasks / presentStaffCount);
    
    const hours = Math.floor(adjustedMinutes / 60);
    const minutes = adjustedMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  // Check if user has pending checkout request
  const hasPendingCheckout = checkOutRequests.some(req => 
    req.userId === user?.id && req.status === 'pending'
  );

  const handleCheckOutRequest = () => {
    if (!todayAttendance?.checkIn || todayAttendance?.checkOut) {
      toast.error('Sie sind nicht eingestempelt oder bereits ausgestempelt');
      return;
    }

    const newRequest: CheckOutRequest = {
      id: Date.now().toString(),
      userId: user!.id,
      attendanceId: todayAttendance.id,
      reason: checkOutReason,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };

    const updatedRequests = [...checkOutRequests, newRequest];
    setCheckOutRequests(updatedRequests);
    localStorage.setItem('villa_sun_checkout_requests', JSON.stringify(updatedRequests));
    
    setCheckOutReason('');
    setShowCheckOutDialog(false);
    toast.success('Feierabend-Anfrage gesendet - wartet auf Admin-Genehmigung');
  };

  // Helper function to get performance color and label - Updated with positive messaging
  const getPerformanceColor = (percentage: number) => {
    if (percentage === 0) return { color: 'text-green-600', label: 'Jetzt gehts los' };
    if (percentage >= 95) return { color: 'text-green-800', label: 'Hervorragend' };
    if (percentage >= 88) return { color: 'text-green-600', label: 'Sehr gut' };
    if (percentage >= 80) return { color: 'text-yellow-600', label: 'Gut' };
    if (percentage >= 71) return { color: 'text-yellow-800', label: 'Solide' };
    return { color: 'text-orange-600', label: 'Dranbleiben..noch ist alles schaffbar' };
  };

  // Helper function for team performance (always positive)
  const getTeamPerformanceColor = (percentage: number) => {
    if (percentage === 0) return { color: 'text-green-600', label: 'Das Team startet durch' };
    if (percentage >= 95) return { color: 'text-green-800', label: 'Fantastisches Team' };
    if (percentage >= 88) return { color: 'text-green-600', label: 'Starkes Team' };
    if (percentage >= 80) return { color: 'text-blue-600', label: 'Gutes Teamwork' };
    if (percentage >= 71) return { color: 'text-purple-600', label: 'Team auf gutem Weg' };
    return { color: 'text-green-500', label: 'Team gibt alles' };
  };

  if (user?.role === 'admin') {
    // Admin Dashboard - exclude admin from all calculations
    const todayAllTasks = tasks.filter(task => {
      if (!task.createdAt) return false;
      try {
        const taskDate = new Date(task.createdAt);
        const taskUser = users.find(u => u.id === task.assignedTo);
        return !task.isTemplate && 
               taskDate.toDateString() === today &&
               (!task.assignedTo || taskUser?.role === 'staff'); // Only staff tasks
      } catch (error) {
        console.error('Error parsing admin task date:', error);
        return false;
      }
    });
    
    // Only count staff attendance, not admin
    const todayAttendanceRecords = attendance.filter(record => {
      const recordUser = users.find(u => u.id === record.userId);
      return record.date === today && recordUser?.role === 'staff';
    });
    
    const activeStaff = todayAttendanceRecords.filter(record => record.checkIn && !record.checkOut);
    const pendingCheckOuts = checkOutRequests.filter(req => req.status === 'pending');

    // Calculate tasks that need review (completed but not approved) - ONLY STAFF TASKS
    const tasksToReview = todayAllTasks.filter(task => task.status === 'completed');

    // Calculate completion rates for admin tiles
    const completedTodayTasks = todayAllTasks.filter(task => task.status === 'completed' || task.status === 'approved');
    const taskCompletionRate = todayAllTasks.length > 0 ? Math.round((completedTodayTasks.length / todayAllTasks.length) * 100) : 0;
    
    const totalStaff = users.filter(u => u.role === 'staff').length;
    const staffAttendanceRate = totalStaff > 0 ? Math.round((todayAttendanceRecords.length / totalStaff) * 100) : 0;

    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600">Überblick über das Team und die Aufgaben</p>
          </div>
          <Badge variant="outline">
            {new Date().toLocaleDateString('de-DE')}
          </Badge>
        </div>

        {/* Admin Overview Cards - Now with 5 cards including AdminPointsManager */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('tasks')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <div className={`text-2xl font-bold ${getPerformanceColor(taskCompletionRate).color}`}>
                    {completedTodayTasks.length}/{todayAllTasks.length}
                  </div>
                  <div className="text-sm text-gray-600">Heutige Aufgaben</div>
                  <div className={`text-xs font-medium ${getPerformanceColor(taskCompletionRate).color}`}>
                    {taskCompletionRate}% {getPerformanceColor(taskCompletionRate).label}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('attendance')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <div className={`text-2xl font-bold ${getPerformanceColor(staffAttendanceRate).color}`}>
                    {activeStaff.length}/{totalStaff}
                  </div>
                  <div className="text-sm text-gray-600">Aktive Mitarbeiter</div>
                  <div className={`text-xs font-medium ${getPerformanceColor(staffAttendanceRate).color}`}>
                    {staffAttendanceRate}% {getPerformanceColor(staffAttendanceRate).label}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('tasks')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{tasksToReview.length}</div>
                  <div className="text-sm text-gray-600">Zu prüfen</div>
                  <div className="text-xs text-gray-500">Aufgaben warten</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold">{pendingCheckOuts.length}</div>
                  <div className="text-sm text-gray-600">Feierabend-Anfragen</div>
                  <div className="text-xs text-gray-500">Wartend</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AdminPointsManager Tile */}
          <AdminPointsManagerTile />
        </div>

        {/* Important Infos Tile for Admin */}
        <ImportantInfosTile isAdmin={true} />

        {/* Today's Team Status - Only staff members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Heutiges Team
            </CardTitle>
            <CardDescription>
              Übersicht der Mitarbeiter für heute
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.filter(u => u.role === 'staff').map(staff => {
                const attendanceRecord = todayAttendanceRecords.find(a => a.userId === staff.id);
                
                return (
                  <div key={staff.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {staff.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{staff.name}</div>
                        <div className="text-sm text-gray-600">Mitarbeiter</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {attendanceRecord ? (
                        <>
                          <div className="text-sm text-right">
                            <div>Ein: {attendanceRecord.checkIn ? 
                              (typeof attendanceRecord.checkIn === 'string' ? 
                                new Date(attendanceRecord.checkIn).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) :
                                attendanceRecord.checkIn.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                              ) : '-'}</div>
                          </div>
                          <Badge variant={attendanceRecord.checkOut ? "secondary" : "default"}>
                            {attendanceRecord.checkOut ? 'Beendet' : 'Aktiv'}
                          </Badge>
                        </>
                      ) : (
                        <Badge variant="outline">Nicht anwesend</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Staff Dashboard - Updated with new calculations
  const taskPerformance = todayTasks.length > 0 ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) : 0;
  const dailyPerformance = possiblePointsToday > 0 ? Math.round((actualPointsToday / possiblePointsToday) * 100) : 0;
  const monthlyPerformance = possiblePointsMonthly > 0 ? Math.round((actualPointsMonthly / possiblePointsMonthly) * 100) : 0;
  const teamPerformance = teamPossiblePoints > 0 ? Math.round((teamActualPoints / teamPossiblePoints) * 100) : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Willkommen, {user?.name}!</h1>
          <p className="text-gray-600">Ihr Dashboard für heute</p>
        </div>
        <Badge variant="outline">
          {new Date().toLocaleDateString('de-DE')}
        </Badge>
      </div>

      {/* 4 kleine Kacheln nebeneinander */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Aufgaben heute (kombiniert) */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('tasks')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <div>
                <div className={`text-2xl font-bold ${getPerformanceColor(taskPerformance).color}`}>
                  {completedTodayTasks.length}/{todayTasks.length}
                </div>
                <div className="text-sm text-gray-600">Aufgaben heute</div>
                <div className={`text-xs font-medium ${getPerformanceColor(taskPerformance).color}`}>
                  {taskPerformance}% {getPerformanceColor(taskPerformance).label}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Punkte heute */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('points')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <div>
                <div className={`text-2xl font-bold ${getPerformanceColor(dailyPerformance).color}`}>
                  {actualPointsToday}/{possiblePointsToday}
                </div>
                <div className="text-sm text-gray-600">Punkte heute</div>
                <div className={`text-xs font-medium ${getPerformanceColor(dailyPerformance).color}`}>
                  {dailyPerformance}% {getPerformanceColor(dailyPerformance).label}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Punkte monatlich */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('points')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className={`text-2xl font-bold ${getPerformanceColor(monthlyPerformance).color}`}>
                  {actualPointsMonthly}/{possiblePointsMonthly}
                </div>
                <div className="text-sm text-gray-600">Punkte monatlich</div>
                <div className={`text-xs font-medium ${getPerformanceColor(monthlyPerformance).color}`}>
                  {monthlyPerformance}% {getPerformanceColor(monthlyPerformance).label}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teampunkte */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('points')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <div className={`text-2xl font-bold ${getTeamPerformanceColor(teamPerformance).color}`}>
                  {teamActualPoints}/{teamPossiblePoints}
                </div>
                <div className="text-sm text-gray-600">Teampunkte</div>
                <div className={`text-xs font-medium ${getTeamPerformanceColor(teamPerformance).color}`}>
                  {teamPerformance}% {getTeamPerformanceColor(teamPerformance).label}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Infos Tile for Staff */}
      <ImportantInfosTile isAdmin={false} />

      {/* Große Karte "So schnell könntest du bereits wieder zu Hause sein" */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            So schnell könntest du bereits wieder zu Hause sein
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-4">{calculateExpectedWorkingHours()}</div>
              {todayAttendance?.checkIn && (
                <div className="text-sm text-gray-500">
                  Gestartet: {typeof todayAttendance.checkIn === 'string' ? 
                    new Date(todayAttendance.checkIn).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) :
                    todayAttendance.checkIn.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                  }
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schwarzer Balken - me work a lot, me go home now */}
      <Card className="bg-gray-900 text-white border-gray-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5 text-white" />
              <div>
                <div className="font-medium text-white">me work a lot, me go home now</div>
                <div className="text-sm text-gray-300">
                  {hasPendingCheckout ? 'Anfrage wartet auf Genehmigung' : 'Ausstempel-Anfrage senden'}
                </div>
              </div>
            </div>
            
            <div>
              {todayAttendance?.checkIn && !todayAttendance?.checkOut ? (
                hasPendingCheckout ? (
                  <div className="flex items-center text-orange-400">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="text-sm font-medium">Wartend</span>
                  </div>
                ) : (
                  <Dialog open={showCheckOutDialog} onOpenChange={setShowCheckOutDialog}>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm">
                        Beantragen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Feierabend beantragen</DialogTitle>
                        <DialogDescription>
                          Senden Sie eine Ausstempel-Anfrage an den Administrator
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Grund (optional)</Label>
                          <Textarea
                            value={checkOutReason}
                            onChange={(e) => setCheckOutReason(e.target.value)}
                            placeholder="Grund für Feierabend..."
                          />
                        </div>
                        <Button onClick={handleCheckOutRequest} className="w-full">
                          Anfrage senden
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )
              ) : (
                <span className="text-sm text-gray-400">Nicht eingestempelt</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}