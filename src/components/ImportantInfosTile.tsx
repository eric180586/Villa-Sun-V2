import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Info, Plus, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface ImportantInfo {
  id: string;
  message: string;
  points: number;
  createdBy: string;
  createdAt: string;
  acknowledgedBy: string[];
}

interface ImportantInfosTileProps {
  isAdmin?: boolean;
}

const ImportantInfosTile: React.FC<ImportantInfosTileProps> = ({ isAdmin = false }) => {
  const { user, users } = useAuth();
  const [infos, setInfos] = useState<ImportantInfo[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedPoints, setSelectedPoints] = useState(5);

  React.useEffect(() => {
    loadInfos();
  }, []);

  const loadInfos = () => {
    try {
      const saved = localStorage.getItem('villa_sun_important_infos');
      if (saved) {
        setInfos(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading important infos:', error);
    }
  };

  const saveInfos = (updatedInfos: ImportantInfo[]) => {
    setInfos(updatedInfos);
    localStorage.setItem('villa_sun_important_infos', JSON.stringify(updatedInfos));
  };

  const createInfo = () => {
    if (!newMessage.trim() || !user) return;

    const newInfo: ImportantInfo = {
      id: Date.now().toString(),
      message: newMessage.trim(),
      points: selectedPoints,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      acknowledgedBy: []
    };

    const updatedInfos = [...infos, newInfo];
    saveInfos(updatedInfos);
    
    setNewMessage('');
    setSelectedPoints(5);
    setShowCreateDialog(false);
    toast.success('Wichtige Information erstellt');
  };

  const acknowledgeInfo = (infoId: string) => {
    if (!user) return;

    const updatedInfos = infos.map(info => 
      info.id === infoId 
        ? { ...info, acknowledgedBy: [...info.acknowledgedBy, user.id] }
        : info
    );

    saveInfos(updatedInfos);
    toast.success(`${selectedPoints} Punkte erhalten für Bestätigung`);
  };

  const deleteInfo = (infoId: string) => {
    const updatedInfos = infos.filter(info => info.id !== infoId);
    saveInfos(updatedInfos);
    toast.success('Information gelöscht');
  };

  // Filter infos for staff - only show unacknowledged ones
  const displayInfos = isAdmin 
    ? infos 
    : infos.filter(info => !info.acknowledgedBy.includes(user?.id || ''));

  if (!isAdmin && displayInfos.length === 0) {
    return null; // Hide tile if no infos to acknowledge
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          {isAdmin ? 'Important Infos verwalten' : 'Wichtige Informationen'}
        </CardTitle>
        <CardDescription>
          {isAdmin 
            ? 'Erstellen Sie wichtige Mitteilungen für das Team'
            : 'Bestätigen Sie diese Informationen und erhalten Sie Punkte'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isAdmin && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Neue wichtige Information
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Wichtige Information erstellen</DialogTitle>
                  <DialogDescription>
                    Erstellen Sie eine Mitteilung, die vom Team bestätigt werden muss
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Nachricht</Label>
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Wichtige Information für das Team..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>Punkte für Bestätigung</Label>
                    <Select value={selectedPoints.toString()} onValueChange={(value) => setSelectedPoints(Number(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Punkt</SelectItem>
                        <SelectItem value="2">2 Punkte</SelectItem>
                        <SelectItem value="3">3 Punkte</SelectItem>
                        <SelectItem value="5">5 Punkte</SelectItem>
                        <SelectItem value="10">10 Punkte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={createInfo} className="w-full" disabled={!newMessage.trim()}>
                    Information erstellen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <div className="space-y-3">
            {displayInfos.map((info) => {
              const creator = users.find(u => u.id === info.createdBy);
              const acknowledgedCount = info.acknowledgedBy.length;
              const totalStaff = users.filter(u => u.role === 'staff').length;
              const isAcknowledged = info.acknowledgedBy.includes(user?.id || '');

              return (
                <div key={info.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium mb-1">{info.message}</div>
                      <div className="text-xs text-muted-foreground">
                        Von {creator?.name} • {new Date(info.createdAt).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {info.points} Punkte
                    </Badge>
                  </div>

                  {isAdmin ? (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {acknowledgedCount}/{totalStaff} Mitarbeiter bestätigt
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteInfo(info.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => acknowledgeInfo(info.id)}
                      className="w-full"
                      disabled={isAcknowledged}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isAcknowledged ? 'Bestätigt' : `Bestätigen (+${info.points} Punkte)`}
                    </Button>
                  )}
                </div>
              );
            })}

            {displayInfos.length === 0 && isAdmin && (
              <div className="text-center py-4 text-muted-foreground">
                Noch keine wichtigen Informationen erstellt
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportantInfosTile;