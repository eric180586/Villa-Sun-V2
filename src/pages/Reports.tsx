import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Clock, 
  Award,
  Users,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  workingHours: number;
  status: 'present' | 'late' | 'absent';
}

interface PointEntry {
  id: string;
  userId: string;
  ruleId: string;
  points: number;
  reason: string;
  assignedBy: string;
  assignedAt: string;
}

interface Task {
  id: string;
  title: string;
  assignedTo?: string;
  assignedBy: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  createdAt: string;
  completedAt?: string;
  points: number;
}

// Helper function to safely convert to Date
const safeDate = (dateInput: Date | string | undefined): Date => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  return new Date(dateInput);
};

export default function ReportsPage() {
  const { user, users } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [pointEntries, setPointEntries] = useState<PointEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load attendance records
    const savedAttendance = localStorage.getItem('villa_sun_attendance');
    if (savedAttendance) {
      try {
        setAttendanceRecords(JSON.parse(savedAttendance));
      } catch (error) {
        console.error('Error loading attendance:', error);
      }
    }

    // Load point entries
    const savedPoints = localStorage.getItem('villa_sun_point_entries');
    if (savedPoints) {
      try {
        setPointEntries(JSON.parse(savedPoints));
      } catch (error) {
        console.error('Error loading points:', error);
      }
    }

    // Load tasks
    const savedTasks = localStorage.getItem('villa_sun_tasks');
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (error) {
        console.error('Error loading tasks:', error);
      }
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate: now };
  };

  const getFilteredData = () => {
    const { startDate, endDate } = getDateRange();

    const filteredAttendance = attendanceRecords.filter(record => {
      try {
        const recordDate = safeDate(record.date);
        return recordDate >= startDate && recordDate <= endDate;
      } catch (error) {
        console.error('Error filtering attendance:', error);
        return false;
      }
    });

    const filteredPoints = pointEntries.filter(entry => {
      try {
        const entryDate = safeDate(entry.assignedAt);
        return entryDate >= startDate && entryDate <= endDate;
      } catch (error) {
        console.error('Error filtering points:', error);
        return false;
      }
    });

    const filteredTasks = tasks.filter(task => {
      try {
        const taskDate = safeDate(task.createdAt);
        return taskDate >= startDate && taskDate <= endDate;
      } catch (error) {
        console.error('Error filtering tasks:', error);
        return false;
      }
    });

    return { filteredAttendance, filteredPoints, filteredTasks };
  };

  const calculateStaffMetrics = () => {
    const { filteredAttendance, filteredPoints, filteredTasks } = getFilteredData();
    const staffUsers = users.filter(u => u.role === 'staff');

    return staffUsers.map(staff => {
      // Attendance metrics
      const staffAttendance = filteredAttendance.filter(record => record.userId === staff.id);
      const totalWorkingDays = staffAttendance.length;
      const presentDays = staffAttendance.filter(record => record.status === 'present').length;
      const lateDays = staffAttendance.filter(record => record.status === 'late').length;
      const attendanceRate = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 0;

      // Points metrics
      const staffPoints = filteredPoints.filter(entry => entry.userId === staff.id);
      const totalPoints = staffPoints.reduce((sum, entry) => sum + entry.points, 0);
      const positivePoints = staffPoints.filter(entry => entry.points > 0).reduce((sum, entry) => sum + entry.points, 0);
      const negativePoints = Math.abs(staffPoints.filter(entry => entry.points < 0).reduce((sum, entry) => sum + entry.points, 0));

      // Task metrics
      const staffTasks = filteredTasks.filter(task => task.assignedTo === staff.id);
      const completedTasks = staffTasks.filter(task => task.status === 'completed' || task.status === 'approved').length;
      const taskCompletionRate = staffTasks.length > 0 ? (completedTasks / staffTasks.length) * 100 : 0;

      return {
        staff,
        attendance: {
          totalDays: totalWorkingDays,
          presentDays,
          lateDays,
          rate: attendanceRate
        },
        points: {
          total: totalPoints,
          positive: positivePoints,
          negative: negativePoints
        },
        tasks: {
          total: staffTasks.length,
          completed: completedTasks,
          completionRate: taskCompletionRate
        }
      };
    });
  };

  const getOverallMetrics = () => {
    const { filteredAttendance, filteredPoints, filteredTasks } = getFilteredData();
    
    const totalAttendanceRecords = filteredAttendance.length;
    const presentRecords = filteredAttendance.filter(record => record.status === 'present').length;
    const overallAttendanceRate = totalAttendanceRecords > 0 ? (presentRecords / totalAttendanceRecords) * 100 : 0;

    const totalPointsAwarded = filteredPoints.reduce((sum, entry) => sum + Math.abs(entry.points), 0);
    const averagePointsPerEntry = filteredPoints.length > 0 ? totalPointsAwarded / filteredPoints.length : 0;

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.status === 'completed' || task.status === 'approved').length;
    const overallTaskCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      attendance: overallAttendanceRate,
      pointsAwarded: totalPointsAwarded,
      avgPointsPerEntry: averagePointsPerEntry,
      taskCompletion: overallTaskCompletion,
      totalTasks,
      completedTasks
    };
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Zugriff verweigert</h3>
          <p className="text-gray-500">Diese Seite ist nur für Administratoren verfügbar.</p>
        </div>
      </div>
    );
  }

  const staffMetrics = calculateStaffMetrics();
  const overallMetrics = getOverallMetrics();

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Berichte</h1>
          <p className="text-gray-600">Leistungsübersicht und Statistiken</p>
        </div>

        <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Letzte Woche</SelectItem>
            <SelectItem value="month">Letzter Monat</SelectItem>
            <SelectItem value="quarter">Letztes Quartal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{overallMetrics.attendance.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Anwesenheit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{overallMetrics.pointsAwarded}</div>
                <div className="text-sm text-gray-600">Punkte vergeben</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{overallMetrics.taskCompletion.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Aufgaben erledigt</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{overallMetrics.avgPointsPerEntry.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Ø Punkte/Eintrag</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Mitarbeiter-Leistung</CardTitle>
          <CardDescription>
            Detaillierte Übersicht der Mitarbeiterleistung für den ausgewählten Zeitraum
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {staffMetrics.map(metric => (
              <div key={metric.staff.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-lg">{metric.staff.name}</h3>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {metric.attendance.rate.toFixed(1)}% Anwesenheit
                    </Badge>
                    <Badge className={metric.points.total >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {metric.points.total > 0 ? `+${metric.points.total}` : metric.points.total} Punkte
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-gray-700 mb-1">Anwesenheit</div>
                    <div className="space-y-1">
                      <div>Anwesend: {metric.attendance.presentDays} Tage</div>
                      <div>Verspätet: {metric.attendance.lateDays} Tage</div>
                      <div>Gesamt: {metric.attendance.totalDays} Tage</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-gray-700 mb-1">Punkte</div>
                    <div className="space-y-1">
                      <div className="text-green-600">Bonus: +{metric.points.positive}</div>
                      <div className="text-red-600">Abzüge: -{metric.points.negative}</div>
                      <div>Netto: {metric.points.total > 0 ? `+${metric.points.total}` : metric.points.total}</div>
                    </div>
                  </div>

                  <div>
                    <div className="font-medium text-gray-700 mb-1">Aufgaben</div>
                    <div className="space-y-1">
                      <div>Erledigt: {metric.tasks.completed}</div>
                      <div>Gesamt: {metric.tasks.total}</div>
                      <div>Rate: {metric.tasks.completionRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}