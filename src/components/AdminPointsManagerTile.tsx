import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { Award, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface PointRule {
  id: string;
  name: string;
  points: number;
  type: 'positive' | 'negative';
  description: string;
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

// Helper function to safely convert to Date
const safeDate = (dateInput: Date | string | undefined): Date => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  return new Date(dateInput);
};

const defaultPointRules: PointRule[] = [
  { id: '1', name: 'Excellent Work', points: 10, type: 'positive', description: 'Outstanding performance on assigned tasks' },
  { id: '2', name: 'Team Player', points: 5, type: 'positive', description: 'Helping colleagues and showing teamwork' },
  { id: '3', name: 'Initiative', points: 8, type: 'positive', description: 'Taking initiative and going beyond expectations' },
  { id: '4', name: 'Punctuality', points: 3, type: 'positive', description: 'Consistently arriving on time' },
  { id: '5', name: 'Late Arrival', points: -5, type: 'negative', description: 'Arriving late without prior notice' },
  { id: '6', name: 'Task Incomplete', points: -3, type: 'negative', description: 'Not completing assigned tasks properly' },
  { id: '7', name: 'Policy Violation', points: -10, type: 'negative', description: 'Violating company policies or procedures' },
  { id: '8', name: 'Customer Complaint', points: -8, type: 'negative', description: 'Receiving justified customer complaints' }
];

export const AdminPointsManagerTile: React.FC = () => {
  const { user, users } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [pointRules, setPointRules] = useState<PointRule[]>(defaultPointRules);
  const [pointEntries, setPointEntries] = useState<PointEntry[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedRule, setSelectedRule] = useState<string>('');
  const [multiplier, setMultiplier] = useState<number>(1);
  const [customReason, setCustomReason] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load point rules
    const savedRules = localStorage.getItem('villa_sun_point_rules');
    if (savedRules) {
      try {
        setPointRules(JSON.parse(savedRules));
      } catch (error) {
        console.error('Error loading point rules:', error);
        setPointRules(defaultPointRules);
      }
    }

    // Load point entries
    const savedEntries = localStorage.getItem('villa_sun_point_entries');
    if (savedEntries) {
      try {
        setPointEntries(JSON.parse(savedEntries));
      } catch (error) {
        console.error('Error loading point entries:', error);
      }
    }
  };

  const handleAssignPoints = () => {
    if (!selectedUser || !selectedRule || !user) {
      toast.error('Bitte wählen Sie einen Mitarbeiter und eine Regel aus');
      return;
    }

    const rule = pointRules.find(r => r.id === selectedRule);
    if (!rule) {
      toast.error('Regel nicht gefunden');
      return;
    }

    const finalPoints = rule.points * multiplier;
    const selectedUserData = users.find(u => u.id === selectedUser);

    const newEntry: PointEntry = {
      id: Date.now().toString(),
      userId: selectedUser,
      ruleId: rule.id,
      points: finalPoints,
      reason: rule.name,
      customReason: customReason.trim() || undefined,
      assignedBy: user.id,
      assignedAt: new Date().toISOString(),
      multiplier
    };

    const updatedEntries = [...pointEntries, newEntry];
    setPointEntries(updatedEntries);
    localStorage.setItem('villa_sun_point_entries', JSON.stringify(updatedEntries));

    // Reset form
    setSelectedUser('');
    setSelectedRule('');
    setMultiplier(1);
    setCustomReason('');
    setShowDialog(false);

    const pointsText = finalPoints > 0 ? `+${finalPoints}` : `${finalPoints}`;
    toast.success(`${pointsText} Punkte an ${selectedUserData?.name} vergeben: ${rule.name}`);
  };

  // Calculate today's total points assigned
  const today = new Date().toDateString();
  const todayEntries = pointEntries.filter(entry => {
    try {
      const entryDate = safeDate(entry.assignedAt);
      return entryDate.toDateString() === today;
    } catch (error) {
      console.error('Error filtering today entries:', error);
      return false;
    }
  });
  
  const todayPositivePoints = todayEntries
    .filter(entry => entry.points > 0)
    .reduce((sum, entry) => sum + entry.points, 0);
  
  const todayNegativePoints = Math.abs(todayEntries
    .filter(entry => entry.points < 0)
    .reduce((sum, entry) => sum + entry.points, 0));

  const staffUsers = users.filter(u => u.role === 'staff');

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  +{todayPositivePoints}/-{todayNegativePoints}
                </div>
                <div className="text-sm text-gray-600">Punkte heute</div>
                <div className="text-xs text-gray-500">Verwalten</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Punkte vergeben
          </DialogTitle>
          <DialogDescription>
            Vergeben Sie Punkte an Mitarbeiter basierend auf vordefinierte Regeln
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Mitarbeiter auswählen</Label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Mitarbeiter wählen..." />
              </SelectTrigger>
              <SelectContent>
                {staffUsers.map(staff => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Punkt-Regel</Label>
            <Select value={selectedRule} onValueChange={setSelectedRule}>
              <SelectTrigger>
                <SelectValue placeholder="Regel wählen..." />
              </SelectTrigger>
              <SelectContent>
                {pointRules.map(rule => (
                  <SelectItem key={rule.id} value={rule.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{rule.name}</span>
                      <span className={`ml-2 font-medium ${
                        rule.points > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {rule.points > 0 ? '+' : ''}{rule.points}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRule && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                {pointRules.find(r => r.id === selectedRule)?.description}
              </div>
            </div>
          )}

          <div>
            <Label>Multiplikator</Label>
            <Input
              type="number"
              min="0.5"
              max="3"
              step="0.5"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1)}
              placeholder="1.0"
            />
            <div className="text-xs text-gray-500 mt-1">
              Endpunkte: {selectedRule ? 
                `${(pointRules.find(r => r.id === selectedRule)?.points || 0) * multiplier > 0 ? '+' : ''}${(pointRules.find(r => r.id === selectedRule)?.points || 0) * multiplier}` 
                : '0'}
            </div>
          </div>

          <div>
            <Label>Zusätzliche Notiz (optional)</Label>
            <Textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Zusätzliche Begründung..."
              rows={2}
            />
          </div>

          <Button 
            onClick={handleAssignPoints} 
            className="w-full"
            disabled={!selectedUser || !selectedRule}
          >
            <Plus className="h-4 w-4 mr-2" />
            Punkte vergeben
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};