import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { 
  Clock, 
  MapPin, 
  Wifi, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Timer,
  TrendingUp,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn?: Date | string;
  checkOut?: Date | string;
  workingHours: number;
  status: 'present' | 'late' | 'absent';
  location?: string;
  wifiNetwork?: string;
  autoCheckedIn?: boolean;
}

// Helper function to safely convert to Date
const safeDate = (dateInput: Date | string | undefined): Date => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  return new Date(dateInput);
};

// Villa Sun WiFi networks for auto check-in
const VILLA_WIFI_NETWORKS = [
  'Villa_Sun_Staff',
  'Villa_Sun_Guest',
  'VillaSun_Admin',
  'Villa-Sun-5G'
];

export default function AttendancePage() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [currentWifi, setCurrentWifi] = useState<string>('');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [workingTime, setWorkingTime] = useState(0);

  useEffect(() => {
    loadAttendanceRecords();
    checkWifiConnection();
    const interval = setInterval(updateWorkingTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentWifi && VILLA_WIFI_NETWORKS.includes(currentWifi) && !isCheckedIn && !todayRecord) {
      handleAutoCheckIn();
    }
  }, [currentWifi, isCheckedIn, todayRecord]);

  const loadAttendanceRecords = () => {
    const saved = localStorage.getItem('villa_sun_attendance');
    if (saved) {
      try {
        const records = JSON.parse(saved);
        setAttendanceRecords(records);
        
        // Check if user is already checked in today
        const today = new Date().toDateString();
        const todayRec = records.find((record: AttendanceRecord) => 
          record.userId === user?.id && safeDate(record.date).toDateString() === today
        );
        
        if (todayRec) {
          setTodayRecord(todayRec);
          setIsCheckedIn(!!todayRec.checkIn && !todayRec.checkOut);
        }
      } catch (error) {
        console.error('Error loading attendance records:', error);
      }
    }
  };

  const saveAttendanceRecords = (records: AttendanceRecord[]) => {
    localStorage.setItem('villa_sun_attendance', JSON.stringify(records));
    setAttendanceRecords(records);
  };

  const checkWifiConnection = () => {
    // Simulate WiFi detection - in a real app, this would use navigator.connection or similar
    const simulatedNetworks = VILLA_WIFI_NETWORKS;
    const randomNetwork = simulatedNetworks[Math.floor(Math.random() * simulatedNetworks.length)];
    
    // Simulate being connected to Villa Sun WiFi 70% of the time
    if (Math.random() > 0.3) {
      setCurrentWifi(randomNetwork);
    } else {
      setCurrentWifi('External_Network');
    }
  };

  const handleAutoCheckIn = () => {
    if (!user) return;

    const now = new Date();
    const workStart = new Date();
    workStart.setHours(8, 0, 0, 0); // 8:00 AM

    const status = now > workStart ? 'late' : 'present';

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId: user.id,
      date: now.toISOString(),
      checkIn: now,
      workingHours: 0,
      status,
      location: 'Villa Sun',
      wifiNetwork: currentWifi,
      autoCheckedIn: true
    };

    const updatedRecords = [...attendanceRecords, newRecord];
    saveAttendanceRecords(updatedRecords);
    setTodayRecord(newRecord);
    setIsCheckedIn(true);

    toast.success('Automatisch eingecheckt via WiFi!', {
      description: `Verbunden mit ${currentWifi}`
    });
  };

  const handleManualCheckIn = () => {
    if (!user) return;

    const now = new Date();
    const workStart = new Date();
    workStart.setHours(8, 0, 0, 0); // 8:00 AM

    const status = now > workStart ? 'late' : 'present';

    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      userId: user.id,
      date: now.toISOString(),
      checkIn: now,
      workingHours: 0,
      status,
      location: 'Villa Sun',
      autoCheckedIn: false
    };

    const updatedRecords = [...attendanceRecords, newRecord];
    saveAttendanceRecords(updatedRecords);
    setTodayRecord(newRecord);
    setIsCheckedIn(true);

    toast.success('Erfolgreich eingecheckt!');
  };

  const handleCheckOut = () => {
    if (!todayRecord || !user) return;

    const now = new Date();
    const checkInTime = safeDate(todayRecord.checkIn);
    const workingHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    const updatedRecord = {
      ...todayRecord,
      checkOut: now,
      workingHours: Math.round(workingHours * 100) / 100
    };

    const updatedRecords = attendanceRecords.map(record =>
      record.id === todayRecord.id ? updatedRecord : record
    );

    saveAttendanceRecords(updatedRecords);
    setTodayRecord(updatedRecord);
    setIsCheckedIn(false);

    toast.success('Erfolgreich ausgecheckt!', {
      description: `Arbeitszeit: ${updatedRecord.workingHours.toFixed(1)} Stunden`
    });
  };

  const calculateWorkingTime = (checkIn: Date | string | undefined, checkOut?: Date | string | undefined): number => {
    if (!checkIn) return 0;
    
    try {
      const checkInDate = safeDate(checkIn);
      const checkOutDate = checkOut ? safeDate(checkOut) : new Date();
      
      const diffMs = checkOutDate.getTime() - checkInDate.getTime();
      return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
    } catch (error) {
      console.error('Error calculating working time:', error);
      return 0;
    }
  };

  const updateWorkingTime = () => {
    if (todayRecord && todayRecord.checkIn && !todayRecord.checkOut) {
      const currentWorkingTime = calculateWorkingTime(todayRecord.checkIn);
      setWorkingTime(currentWorkingTime);
    }
  };

  const formatTime = (date: Date | string | undefined): string => {
    if (!date) return '--:--';
    try {
      return safeDate(date).toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      return '--:--';
    }
  };

  const formatDuration = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'absent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'late': return <Clock className="h-4 w-4" />;
      case 'absent': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  // Calculate statistics
  const userRecords = attendanceRecords.filter(record => record.userId === user?.id);
  const thisWeekRecords = userRecords.filter(record => {
    try {
      const recordDate = safeDate(record.date);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return recordDate >= weekStart;
    } catch (error) {
      return false;
    }
  });

  const thisWeekHours = thisWeekRecords.reduce((sum, record) => sum + (record.workingHours || 0), 0);
  const averageCheckIn = userRecords.length > 0 ? 
    userRecords.reduce((sum, record) => {
      try {
        const checkInDate = safeDate(record.checkIn);
        return sum + (checkInDate.getHours() * 60 + checkInDate.getMinutes());
      } catch (error) {
        return sum;
      }
    }, 0) / userRecords.length : 0;

  const avgCheckInTime = Math.floor(averageCheckIn / 60) + ':' + 
    String(Math.round(averageCheckIn % 60)).padStart(2, '0');

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Anwesenheit</h1>
          <p className="text-gray-600">Arbeitszeit erfassen und verwalten</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Wifi className="h-3 w-3" />
          {currentWifi}
        </Badge>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={`${isCheckedIn ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Aktueller Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <Badge className={isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {isCheckedIn ? 'Eingecheckt' : 'Ausgecheckt'}
              </Badge>
            </div>

            {todayRecord && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Check-in:</span>
                  <span className="font-medium">{formatTime(todayRecord.checkIn)}</span>
                </div>

                {todayRecord.checkOut && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Check-out:</span>
                    <span className="font-medium">{formatTime(todayRecord.checkOut)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Arbeitszeit:</span>
                  <span className="font-medium">
                    {formatDuration(isCheckedIn ? workingTime : todayRecord.workingHours)}
                  </span>
                </div>

                {todayRecord.autoCheckedIn && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Wifi className="h-3 w-3" />
                    Automatisch via WiFi eingecheckt
                  </div>
                )}
              </>
            )}

            <div className="pt-2">
              {!isCheckedIn && !todayRecord && (
                <Button onClick={handleManualCheckIn} className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Einchecken
                </Button>
              )}

              {isCheckedIn && (
                <Button onClick={handleCheckOut} variant="outline" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Auschecken
                </Button>
              )}

              {todayRecord && todayRecord.checkOut && (
                <div className="text-center text-sm text-gray-600">
                  Heute bereits ausgecheckt
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* WiFi Auto Check-in */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              WiFi Auto Check-in
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Aktuelles Netzwerk:</span>
              <Badge variant={VILLA_WIFI_NETWORKS.includes(currentWifi) ? 'default' : 'secondary'}>
                {currentWifi}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Auto Check-in:</span>
              <Badge className={VILLA_WIFI_NETWORKS.includes(currentWifi) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {VILLA_WIFI_NETWORKS.includes(currentWifi) ? 'Aktiviert' : 'Deaktiviert'}
              </Badge>
            </div>

            <div className="text-xs text-gray-500">
              <div className="font-medium mb-1">Erkannte Netzwerke:</div>
              {VILLA_WIFI_NETWORKS.map(network => (
                <div key={network} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${network === currentWifi ? 'bg-green-500' : 'bg-gray-300'}`} />
                  {network}
                </div>
              ))}
            </div>

            <Button 
              onClick={checkWifiConnection} 
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              Netzwerk aktualisieren
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatDuration(thisWeekHours)}
                </div>
                <div className="text-sm text-gray-600">Diese Woche</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">{avgCheckInTime}</div>
                <div className="text-sm text-gray-600">Ø Check-in Zeit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{thisWeekRecords.length}</div>
                <div className="text-sm text-gray-600">Arbeitstage</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Letzte Anwesenheit
          </CardTitle>
          <CardDescription>
            Ihre letzten Arbeitszeiten und Check-ins
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Noch keine Anwesenheitsdaten vorhanden
            </div>
          ) : (
            <div className="space-y-3">
              {userRecords
                .sort((a, b) => safeDate(b.date).getTime() - safeDate(a.date).getTime())
                .slice(0, 7)
                .map(record => (
                  <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(record.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(record.status)}
                          {record.status === 'present' ? 'Anwesend' : 
                           record.status === 'late' ? 'Verspätet' : 'Abwesend'}
                        </div>
                      </Badge>
                      <div>
                        <div className="font-medium">
                          {safeDate(record.date).toLocaleDateString('de-DE', { 
                            weekday: 'short', 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatTime(record.checkIn)} - {formatTime(record.checkOut)}
                          {record.autoCheckedIn && (
                            <span className="ml-2 text-blue-600">
                              <Wifi className="h-3 w-3 inline" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatDuration(record.workingHours)}</div>
                      {record.location && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {record.location}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}