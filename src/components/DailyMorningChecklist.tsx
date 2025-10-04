import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
// Import the Supabase client.  This may be undefined when credentials are
// missing.  In that case the component will fall back to using
// localStorage for persistence and will not provide realtime
// synchronisation across devices.
import { supabase } from '../lib/supabase';
import { 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  AlertTriangle,
  CheckSquare,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

interface DailyChecklistRecord {
  id: string;
  userId: string;
  date: string;
  items: ChecklistItem[];
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'approved' | 'reopened';
  adminNote?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

const defaultItems: Omit<ChecklistItem, 'completed' | 'completedAt' | 'completedBy'>[] = [
  { id: '1', text: 'Check all lights are working' },
  { id: '2', text: 'Check all doors and windows are secure' },
  { id: '3', text: 'Check temperature settings' },
  { id: '4', text: 'Check water pressure in all bathrooms' },
  { id: '5', text: 'Check cleanliness of common areas' },
  { id: '6', text: 'Check kitchen equipment functionality' },
  { id: '7', text: 'Check Wi-Fi connectivity' },
  { id: '8', text: 'Check safety equipment (fire extinguishers, smoke detectors)' },
  { id: '9', text: 'Check laundry facilities' },
  { id: '10', text: 'Check outdoor areas and garden' },
  { id: '11', text: 'Check pool area (if applicable)' },
  { id: '12', text: 'Check parking area' },
  { id: '13', text: 'Check inventory of supplies' },
  { id: '14', text: 'Review guest feedback from previous day' },
  { id: '15', text: 'Mop where necessary' }
];

export const DailyMorningChecklist: React.FC = () => {
  const { user, users } = useAuth();
  const [records, setRecords] = useState<DailyChecklistRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<DailyChecklistRecord | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DailyChecklistRecord | null>(null);

  const isAdmin = user?.role === 'admin';
  const today = new Date().toDateString();

  useEffect(() => {
    // On mount, load records from Supabase or localStorage
    loadRecords();
  }, []);

  // Subscribe to realtime changes on the daily_checklist table.  Whenever a
  // row is inserted, updated or deleted the records list is reloaded.  This
  // subscription is only established when a Supabase client is available.
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('public:daily_checklist')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_checklist' },
        () => {
          loadRecords();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRecords = () => {
    // If Supabase is configured, load records from the daily_checklist table.
    if (supabase && user) {
      (async () => {
        try {
          // Fetch all records for this user.  Admin will see all records
          const { data, error } = await supabase
            .from('daily_checklist')
            .select('*');
          if (!error && data) {
            const mapped = data.map((r: any) => {
              return {
                id: r.id,
                userId: r.user_id,
                date: r.date,
                items: (r.items || []) as ChecklistItem[],
                status: r.status as DailyChecklistRecord['status'],
                adminNote: r.admin_note || undefined,
                approvedBy: r.approved_by || undefined,
                approvedAt: r.approved_at || undefined,
                createdAt: r.created_at,
                completedAt: r.completed_at || undefined
              } as DailyChecklistRecord;
            });
            setRecords(mapped);
            const todaysRecord = mapped.find((record) =>
              record.userId === user.id && record.date === today
            );
            setTodayRecord(todaysRecord || null);
            return;
          }
        } catch (error) {
          console.error('Supabase error while loading checklist records:', error);
        }
      })();
    } else {
      // Fallback to localStorage when Supabase is not configured
      const saved = localStorage.getItem('villa_sun_daily_checklist');
      if (saved) {
        try {
          const parsedRecords = JSON.parse(saved);
          setRecords(parsedRecords);
          
          // Find today's record for current user
          const todaysRecord = parsedRecords.find((record: DailyChecklistRecord) => 
            record.userId === user?.id && record.date === today
          );
          setTodayRecord(todaysRecord || null);
        } catch (error) {
          console.error('Error loading checklist records:', error);
        }
      }
    }
  };

  const saveRecords = (updatedRecords: DailyChecklistRecord[]) => {
    // When Supabase is available, upsert each record into the table.
    if (supabase) {
      (async () => {
        try {
          // Map to snake_case fields for Supabase
          const payload = updatedRecords.map((r) => ({
            id: r.id,
            user_id: r.userId,
            date: r.date,
            items: r.items,
            status: r.status,
            admin_note: r.adminNote || null,
            approved_by: r.approvedBy || null,
            approved_at: r.approvedAt || null,
            created_at: r.createdAt,
            completed_at: r.completedAt || null
          }));
          await supabase.from('daily_checklist').upsert(payload);
        } catch (error) {
          console.error('Supabase error while saving checklist records:', error);
        }
      })();
      setRecords(updatedRecords);
    } else {
      // Fallback to localStorage
      localStorage.setItem('villa_sun_daily_checklist', JSON.stringify(updatedRecords));
      setRecords(updatedRecords);
    }
  };

  const createTodayRecord = () => {
    if (!user) return;

    const newRecord: DailyChecklistRecord = {
      id: Date.now().toString(),
      userId: user.id,
      date: today,
      items: defaultItems.map(item => ({
        ...item,
        completed: false
      })),
      status: 'in_progress',
      createdAt: new Date().toISOString()
    };

    const updatedRecords = [...records, newRecord];
    // Persist the new record
    saveRecords(updatedRecords);
    setTodayRecord(newRecord);
  };

  const updateChecklistItem = (itemId: string, completed: boolean) => {
    if (!todayRecord || todayRecord.status === 'approved') return;

    const updatedItems = todayRecord.items.map(item => 
      item.id === itemId 
        ? { 
            ...item, 
            completed,
            completedAt: completed ? new Date().toISOString() : undefined,
            completedBy: completed ? user?.id : undefined
          }
        : item
    );

    const updatedRecord = {
      ...todayRecord,
      items: updatedItems
    };

    const updatedRecords = records.map(record => 
      record.id === todayRecord.id ? updatedRecord : record
    );

    saveRecords(updatedRecords);
    setTodayRecord(updatedRecord);
  };

  const completeChecklist = () => {
    if (!todayRecord) return;

    const allCompleted = todayRecord.items.every(item => item.completed);
    if (!allCompleted) {
      toast.error('Bitte vervollständigen Sie alle Punkte der Checkliste');
      return;
    }

    const updatedRecord = {
      ...todayRecord,
      status: 'completed' as const,
      completedAt: new Date().toISOString()
    };

    const updatedRecords = records.map(record => 
      record.id === todayRecord.id ? updatedRecord : record
    );

    saveRecords(updatedRecords);
    setTodayRecord(updatedRecord);
    toast.success('Morgendliche Checkliste abgeschlossen - wartet auf Admin-Freigabe');
  };

  const handleAdminAction = (action: 'approve' | 'reopen') => {
    if (!selectedRecord || !isAdmin) return;

    const updatedRecord = {
      ...selectedRecord,
      status: action === 'approve' ? 'approved' as const : 'reopened' as const,
      adminNote: action === 'reopen' ? adminNote : undefined,
      approvedBy: action === 'approve' ? user?.id : undefined,
      approvedAt: action === 'approve' ? new Date().toISOString() : undefined
    };

    const updatedRecords = records.map(record => 
      record.id === selectedRecord.id ? updatedRecord : record
    );

    saveRecords(updatedRecords);
    
    if (selectedRecord.id === todayRecord?.id) {
      setTodayRecord(updatedRecord);
    }

    setShowAdminDialog(false);
    setAdminNote('');
    setSelectedRecord(null);
    
    toast.success(action === 'approve' ? 'Checkliste freigegeben' : 'Checkliste zur Überarbeitung freigegeben');
  };

  const getStatusBadge = (status: DailyChecklistRecord['status']) => {
    switch (status) {
      case 'in_progress':
        return <Badge variant="outline">In Bearbeitung</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Abgeschlossen</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Freigegeben</Badge>;
      case 'reopened':
        return <Badge className="bg-orange-100 text-orange-800">Zur Überarbeitung</Badge>;
      default:
        return <Badge variant="outline">Unbekannt</Badge>;
    }
  };

  const completedCount = todayRecord?.items.filter(item => item.completed).length || 0;
  const totalCount = todayRecord?.items.length || defaultItems.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  if (isAdmin) {
    // Admin view - show all records
    const todayRecords = records.filter(record => record.date === today);
    const pendingRecords = records.filter(record => record.status === 'completed');

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Daily Morning Checklist - Admin Übersicht
            </CardTitle>
            <CardDescription>
              Übersicht und Freigabe der morgendlichen Checklisten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{todayRecords.length}</div>
                <div className="text-sm text-gray-600">Heute erstellt</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{pendingRecords.length}</div>
                <div className="text-sm text-gray-600">Warten auf Freigabe</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {records.filter(r => r.status === 'approved' && r.date === today).length}
                </div>
                <div className="text-sm text-gray-600">Heute freigegeben</div>
              </div>
            </div>

            <div className="space-y-4">
              {records
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 10)
                .map((record) => {
                  const recordUser = users.find(u => u.id === record.userId);
                  const completedItems = record.items.filter(item => item.completed).length;
                  const progressPercent = Math.round((completedItems / record.items.length) * 100);

                  return (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{recordUser?.name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(record.date).toLocaleDateString('de-DE')}
                            <span>•</span>
                            <span>{completedItems}/{record.items.length} Punkte</span>
                            <span>•</span>
                            <span>{progressPercent}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {getStatusBadge(record.status)}
                        
                        {(record.status === 'completed' || record.status === 'reopened') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRecord(record);
                              setShowAdminDialog(true);
                            }}
                          >
                            Prüfen
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Admin Action Dialog */}
        <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Checkliste prüfen</DialogTitle>
              <DialogDescription>
                Prüfen Sie die Checkliste und entscheiden Sie über die Freigabe
              </DialogDescription>
            </DialogHeader>
            
            {selectedRecord && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {users.find(u => u.id === selectedRecord.userId)?.name}
                  </span>
                  <span className="text-gray-500">•</span>
                  <span className="text-sm text-gray-600">
                    {new Date(selectedRecord.date).toLocaleDateString('de-DE')}
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {selectedRecord.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 border rounded">
                      <Checkbox checked={item.completed} disabled />
                      <span className={item.completed ? 'text-gray-900' : 'text-gray-500'}>
                        {item.text}
                      </span>
                      {item.completed && item.completedAt && (
                        <span className="text-xs text-gray-500 ml-auto">
                          {new Date(item.completedAt).toLocaleTimeString('de-DE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notiz (bei Zurückweisung erforderlich)
                  </label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Grund für Zurückweisung oder Anmerkungen..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => handleAdminAction('reopen')}
                disabled={!adminNote.trim()}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Zur Überarbeitung
              </Button>
              <Button
                onClick={() => handleAdminAction('approve')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Freigeben
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Staff view
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Daily Morning Checklist
          </CardTitle>
          <CardDescription>
            Tägliche Überprüfung der wichtigsten Punkte am Morgen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!todayRecord ? (
            <div className="text-center py-8">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Keine Checkliste für heute
              </h3>
              <p className="text-gray-500 mb-4">
                Starten Sie Ihre morgendliche Checkliste für heute
              </p>
              <Button onClick={createTodayRecord}>
                Checkliste starten
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{completedCount}/{totalCount}</div>
                  <div className="text-sm text-gray-600">Punkte abgeschlossen</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
                  <div className="text-sm text-gray-600">Fortschritt</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              {/* Status and Actions */}
              <div className="flex items-center justify-between">
                {getStatusBadge(todayRecord.status)}
                
                {todayRecord.status === 'in_progress' && (
                  <Button 
                    onClick={completeChecklist}
                    disabled={completedCount < totalCount}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Abschließen
                  </Button>
                )}
                
                {todayRecord.status === 'completed' && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Wartet auf Admin-Freigabe</span>
                  </div>
                )}
                
                {todayRecord.status === 'approved' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Freigegeben</span>
                  </div>
                )}
              </div>

              {/* Admin Note for Reopened Items */}
              {todayRecord.status === 'reopened' && todayRecord.adminNote && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                    <span className="font-medium text-orange-800">Admin-Notiz</span>
                  </div>
                  <p className="text-sm text-orange-700">{todayRecord.adminNote}</p>
                </div>
              )}

              {/* Checklist Items */}
              <div className="space-y-3">
                {todayRecord.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={(checked) => updateChecklistItem(item.id, checked as boolean)}
                      disabled={todayRecord.status === 'approved'}
                    />
                    <span className={`flex-1 ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {item.text}
                    </span>
                    {item.completed && item.completedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(item.completedAt).toLocaleTimeString('de-DE', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyMorningChecklist;