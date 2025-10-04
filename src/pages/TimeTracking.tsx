import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { Clock, Calendar, TrendingUp, Users, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  location?: string;
  wifi_ssid?: string;
  notes?: string;
  status: 'present' | 'late' | 'absent';
  working_hours?: number;
  created_at: string;
}

interface ScheduleEntry {
  id: string;
  user_id: string;
  date: string;
  shift: 'früh' | 'spät' | 'off';
  is_approved: boolean;
  created_at: string;
}

const TimeTracking: React.FC = () => {
  const { user, users } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedAttendance = localStorage.getItem('villa_sun_attendance');
    if (savedAttendance) {
      setAttendanceRecords(JSON.parse(savedAttendance));
    }

    const savedSchedules = localStorage.getItem('villa_sun_schedules');
    if (savedSchedules) {
      setSchedules(JSON.parse(savedSchedules));
    }
  };

  const getWeekDates = (date: Date) => {
    const week = [];
    const startDate = new Date(date);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      week.push(currentDate);
    }
    return week;
  };

  const calculateWorkingHours = (checkIn: string, checkOut: string, shift: 'früh' | 'spät' | 'off') => {
    if (!checkIn || !checkOut || shift === 'off') return 0;

    const checkInTime = new Date(`1970-01-01T${checkIn}`);
    const checkOutTime = new Date(`1970-01-01T${checkOut}`);
    
    // Handle overnight shifts
    if (checkOutTime < checkInTime) {
      checkOutTime.setDate(checkOutTime.getDate() + 1);
    }

    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    // Standard working hours based on shift
    const standardHours = shift === 'früh' ? 6 : 6; // Both shifts are 6 hours
    
    return Math.max(0, Math.min(diffHours, 12)); // Cap at 12 hours maximum
  };

  const getScheduleForUserAndDate = (userId: string, date: string): ScheduleEntry | undefined => {
    return schedules.find(s => s.user_id === userId && s.date === date);
  };

  const getAttendanceForUserAndDate = (userId: string, date: string): AttendanceRecord | undefined => {
    return attendanceRecords.find(a => a.user_id === userId && a.date === date);
  };

  const getExpectedHours = (shift: 'früh' | 'spät' | 'off') => {
    switch (shift) {
      case 'früh': return 6; // 9:00 - 15:00
      case 'spät': return 6;  // 15:00 - 21:00
      case 'off': return 0;
      default: return 0;
    }
  };

  const getShiftTimeRange = (shift: 'früh' | 'spät' | 'off') => {
    switch (shift) {
      case 'früh': return '09:00 - 15:00';
      case 'spät': return '15:00 - 21:00';
      case 'off': return 'Frei';
      default: return '-';
    }
  };

  const weekDates = getWeekDates(selectedWeek);
  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(selectedWeek.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedWeek(newDate);
  };

  const calculateWeeklyStats = (userId: string) => {
    let totalHours = 0;
    let expectedHours = 0;
    let daysWorked = 0;
    let daysScheduled = 0;

    weekDates.forEach(date => {
      const dateStr = date.toISOString().split('T')[0];
      const schedule = getScheduleForUserAndDate(userId, dateStr);
      const attendance = getAttendanceForUserAndDate(userId, dateStr);

      if (schedule && schedule.shift !== 'off') {
        daysScheduled++;
        expectedHours += getExpectedHours(schedule.shift);

        if (attendance && attendance.check_in && attendance.check_out) {
          const hours = calculateWorkingHours(attendance.check_in, attendance.check_out, schedule.shift);
          totalHours += hours;
          daysWorked++;
        }
      }
    });

    return { totalHours, expectedHours, daysWorked, daysScheduled };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zeiterfassung</h1>
          <p className="text-muted-foreground">
            Arbeitszeiten und Anwesenheitsübersicht
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigateWeek('prev')}>
            ← Vorherige Woche
          </Button>
          <Button variant="outline" onClick={() => navigateWeek('next')}>
            Nächste Woche →
          </Button>
        </div>
      </div>

      {/* Week Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Woche vom {weekDates[0].toLocaleDateString('de-DE')} bis {weekDates[6].toLocaleDateString('de-DE')}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Time Tracking Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Mitarbeiter</th>
                  {weekdays.map((day, index) => (
                    <th key={day} className="text-center p-4 font-medium min-w-[140px]">
                      <div className="flex flex-col">
                        <span>{day}</span>
                        <span className="text-sm text-muted-foreground font-normal">
                          {weekDates[index].toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="text-center p-4 font-medium">Wochensumme</th>
                </tr>
              </thead>
              <tbody>
                {users.map((staffUser) => {
                  const weeklyStats = calculateWeeklyStats(staffUser.id);
                  
                  return (
                    <tr key={staffUser.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{staffUser.name}</div>
                            <div className="text-sm text-muted-foreground">{staffUser.role}</div>
                          </div>
                        </div>
                      </td>
                      {weekDates.map((date) => {
                        const dateStr = date.toISOString().split('T')[0];
                        const schedule = getScheduleForUserAndDate(staffUser.id, dateStr);
                        const attendance = getAttendanceForUserAndDate(staffUser.id, dateStr);
                        
                        return (
                          <td key={dateStr} className="p-4 text-center">
                            <div className="space-y-1">
                              {schedule ? (
                                <>
                                  <Badge 
                                    className={
                                      schedule.shift === 'früh' ? 'bg-green-100 text-green-800' :
                                      schedule.shift === 'spät' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }
                                  >
                                    {schedule.shift.toUpperCase()}
                                  </Badge>
                                  <div className="text-xs text-muted-foreground">
                                    {getShiftTimeRange(schedule.shift)}
                                  </div>
                                  {attendance && attendance.check_in && attendance.check_out && schedule.shift !== 'off' && (
                                    <div className="text-xs">
                                      <div className="font-mono">
                                        {attendance.check_in} - {attendance.check_out}
                                      </div>
                                      <div className="font-semibold text-blue-600">
                                        {calculateWorkingHours(attendance.check_in, attendance.check_out, schedule.shift).toFixed(1)}h
                                      </div>
                                    </div>
                                  )}
                                  {schedule.shift !== 'off' && (!attendance || !attendance.check_in || !attendance.check_out) && (
                                    <div className="text-xs text-red-600 flex items-center justify-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      Nicht erfasst
                                    </div>
                                  )}
                                </>
                              ) : (
                                <Badge variant="outline">-</Badge>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-4 text-center">
                        <div className="space-y-1">
                          <div className="font-semibold text-lg">
                            {weeklyStats.totalHours.toFixed(1)}h
                          </div>
                          <div className="text-xs text-muted-foreground">
                            von {weeklyStats.expectedHours}h geplant
                          </div>
                          <div className="text-xs">
                            {weeklyStats.daysWorked}/{weeklyStats.daysScheduled} Tage
                          </div>
                          {weeklyStats.totalHours >= weeklyStats.expectedHours ? (
                            <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-600 mx-auto" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtstunden diese Woche</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((total, user) => {
                const stats = calculateWeeklyStats(user.id);
                return total + stats.totalHours;
              }, 0).toFixed(1)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Alle Mitarbeiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Geplante Stunden</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.reduce((total, user) => {
                const stats = calculateWeeklyStats(user.id);
                return total + stats.expectedHours;
              }, 0)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Laut Dienstplan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Anwesenheitsrate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(() => {
                const totalScheduled = users.reduce((total, user) => {
                  const stats = calculateWeeklyStats(user.id);
                  return total + stats.daysScheduled;
                }, 0);
                const totalWorked = users.reduce((total, user) => {
                  const stats = calculateWeeklyStats(user.id);
                  return total + stats.daysWorked;
                }, 0);
                return totalScheduled > 0 ? Math.round((totalWorked / totalScheduled) * 100) : 0;
              })()}%
            </div>
            <p className="text-xs text-muted-foreground">
              Erfasste Arbeitstage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Working Hours Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Arbeitszeiten-Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Schichtzeiten:</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Frühschicht:</span>
                  <span className="font-mono">09:00 - 15:00 (6h)</span>
                </div>
                <div className="flex justify-between">
                  <span>Spätschicht:</span>
                  <span className="font-mono">15:00 - 21:00 (6h)</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Berechnungshinweise:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Arbeitszeiten werden automatisch basierend auf Ein-/Ausstempelzeiten berechnet</li>
                <li>• Maximale Arbeitszeit pro Tag: 12 Stunden</li>
                <li>• Freie Tage (OFF) werden nicht in die Stundenberechnung einbezogen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeTracking;