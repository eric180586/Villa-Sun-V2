import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Award, TrendingUp, TrendingDown, Calendar, User } from 'lucide-react';

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

// Helper function to safely convert to Date
const safeDate = (dateInput: Date | string | undefined): Date => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  return new Date(dateInput);
};

export default function PointsPage() {
  const { user, users } = useAuth();
  const [pointEntries, setPointEntries] = useState<PointEntry[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadPointEntries();
  }, []);

  const loadPointEntries = () => {
    const saved = localStorage.getItem('villa_sun_point_entries');
    if (saved) {
      try {
        setPointEntries(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading point entries:', error);
      }
    }
  };

  const getFilteredEntries = () => {
    const now = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    return pointEntries.filter(entry => {
      try {
        const entryDate = safeDate(entry.assignedAt);
        return entryDate >= startDate;
      } catch (error) {
        console.error('Error filtering entries:', error);
        return false;
      }
    });
  };

  const getUserPoints = (userId: string) => {
    const userEntries = getFilteredEntries().filter(entry => entry.userId === userId);
    const totalPoints = userEntries.reduce((sum, entry) => sum + entry.points, 0);
    const positivePoints = userEntries.filter(entry => entry.points > 0).reduce((sum, entry) => sum + entry.points, 0);
    const negativePoints = Math.abs(userEntries.filter(entry => entry.points < 0).reduce((sum, entry) => sum + entry.points, 0));
    
    return { totalPoints, positivePoints, negativePoints, entries: userEntries };
  };

  const getPointsColor = (points: number) => {
    if (points > 50) return 'text-green-800';
    if (points > 20) return 'text-green-600';
    if (points > 0) return 'text-blue-600';
    if (points === 0) return 'text-gray-600';
    if (points > -20) return 'text-orange-600';
    return 'text-red-600';
  };

  const staffUsers = users.filter(u => u.role === 'staff');
  const filteredEntries = getFilteredEntries();

  // If user is staff, show only their points
  if (user?.role === 'staff') {
    const userPointsData = getUserPoints(user.id);
    
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Meine Punkte</h1>
          <p className="text-gray-600">Übersicht über Ihre Leistungspunkte</p>
        </div>

        {/* Period Selection */}
        <div className="flex gap-2">
          <Button
            variant={selectedPeriod === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('today')}
          >
            Heute
          </Button>
          <Button
            variant={selectedPeriod === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('week')}
          >
            Diese Woche
          </Button>
          <Button
            variant={selectedPeriod === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod('month')}
          >
            Dieser Monat
          </Button>
        </div>

        {/* Points Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className={`text-2xl font-bold ${getPointsColor(userPointsData.totalPoints)}`}>
                    {userPointsData.totalPoints > 0 ? `+${userPointsData.totalPoints}` : userPointsData.totalPoints}
                  </div>
                  <div className="text-sm text-gray-600">Gesamt</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">+{userPointsData.positivePoints}</div>
                  <div className="text-sm text-gray-600">Bonus</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">-{userPointsData.negativePoints}</div>
                  <div className="text-sm text-gray-600">Abzüge</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Einträge</CardTitle>
            <CardDescription>
              Ihre Punktehistorie für den ausgewählten Zeitraum
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userPointsData.entries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Keine Punkte für den ausgewählten Zeitraum gefunden.
              </p>
            ) : (
              <div className="space-y-3">
                {userPointsData.entries
                  .sort((a, b) => {
                    try {
                      const dateA = safeDate(a.assignedAt);
                      const dateB = safeDate(b.assignedAt);
                      return dateB.getTime() - dateA.getTime();
                    } catch (error) {
                      console.error('Error sorting entries:', error);
                      return 0;
                    }
                  })
                  .map(entry => {
                    const assignedBy = users.find(u => u.id === entry.assignedBy);
                    return (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{entry.reason}</div>
                          {entry.customReason && (
                            <div className="text-sm text-gray-600">{entry.customReason}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">
                            {safeDate(entry.assignedAt).toLocaleDateString('de-DE')} • Von {assignedBy?.name}
                          </div>
                        </div>
                        <Badge className={entry.points > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {entry.points > 0 ? `+${entry.points}` : entry.points}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin view - show all staff points
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Punkte-Übersicht</h1>
        <p className="text-gray-600">Leistungspunkte aller Mitarbeiter</p>
      </div>

      {/* Period Selection */}
      <div className="flex gap-2">
        <Button
          variant={selectedPeriod === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('today')}
        >
          Heute
        </Button>
        <Button
          variant={selectedPeriod === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('week')}
        >
          Diese Woche
        </Button>
        <Button
          variant={selectedPeriod === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedPeriod('month')}
        >
          Dieser Monat
        </Button>
      </div>

      {/* Staff Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffUsers.map(staff => {
          const pointsData = getUserPoints(staff.id);
          
          return (
            <Card key={staff.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <CardTitle className="text-lg">{staff.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Gesamt:</span>
                    <span className={`font-bold ${getPointsColor(pointsData.totalPoints)}`}>
                      {pointsData.totalPoints > 0 ? `+${pointsData.totalPoints}` : pointsData.totalPoints}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Bonus:</span>
                    <span className="font-medium text-green-600">+{pointsData.positivePoints}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Abzüge:</span>
                    <span className="font-medium text-red-600">-{pointsData.negativePoints}</span>
                  </div>
                  <div className="text-xs text-gray-500 pt-2 border-t">
                    {pointsData.entries.length} Einträge
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Letzte Aktivitäten</CardTitle>
          <CardDescription>
            Neueste Punktevergaben für den ausgewählten Zeitraum
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Keine Aktivitäten für den ausgewählten Zeitraum gefunden.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredEntries
                .sort((a, b) => {
                  try {
                    const dateA = safeDate(a.assignedAt);
                    const dateB = safeDate(b.assignedAt);
                    return dateB.getTime() - dateA.getTime();
                  } catch (error) {
                    console.error('Error sorting entries:', error);
                    return 0;
                  }
                })
                .slice(0, 10)
                .map(entry => {
                  const staff = users.find(u => u.id === entry.userId);
                  const assignedBy = users.find(u => u.id === entry.assignedBy);
                  
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{entry.reason}</div>
                        {entry.customReason && (
                          <div className="text-sm text-gray-600">{entry.customReason}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {staff?.name} • {safeDate(entry.assignedAt).toLocaleDateString('de-DE')} • Von {assignedBy?.name}
                        </div>
                      </div>
                      <Badge className={entry.points > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {entry.points > 0 ? `+${entry.points}` : entry.points}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}