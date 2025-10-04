import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { 
  Plus, 
  Minus, 
  Award, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShoppingCart,
  Trash2,
  Save,
  User,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface PointRule {
  id: string;
  name: string;
  points: number;
  category: 'positive' | 'negative';
  description: string;
  isRepeatable: boolean;
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

interface CartItem {
  ruleId: string;
  quantity: number;
  customReason?: string;
}

interface UserViolation {
  userId: string;
  ruleId: string;
  count: number;
  lastOccurrence: string;
}

const defaultPointRules: PointRule[] = [
  // Positive Points
  { id: 'punctual', name: 'Pünktlicher Arbeitsbeginn', points: 5, category: 'positive', description: 'Rechtzeitig zur Arbeit erschienen', isRepeatable: true },
  { id: 'task-timely-clean', name: 'Aufgabe fristgerecht und ordentlich erledigt', points: 3, category: 'positive', description: 'Aufgabe termingerecht und sauber abgeschlossen', isRepeatable: true },
  { id: 'task-clean', name: 'Aufgabe ordentlich erledigt', points: 2, category: 'positive', description: 'Aufgabe sauber abgeschlossen', isRepeatable: true },
  
  // Negative Points
  { id: 'late', name: 'Zuspätkommen', points: -5, category: 'negative', description: 'Verspätung am Arbeitsplatz', isRepeatable: true },
  { id: 'marked-not-done', name: 'Als erledigt markiert, aber nicht erledigt', points: -5, category: 'negative', description: 'Falsche Statusangabe bei Aufgaben', isRepeatable: true },
  { id: 'no-guest-greeting', name: 'Keine Begrüßung Gast', points: -2, category: 'negative', description: 'Gast nicht begrüßt', isRepeatable: true },
  { id: 'no-colleague-greeting', name: 'Keine Begrüßung Kollege', points: -2, category: 'negative', description: 'Kollegen nicht begrüßt', isRepeatable: true },
  { id: 'wrong-implementation', name: 'Falsche Umsetzung trotz Info', points: -3, category: 'negative', description: 'Anweisungen nicht befolgt', isRepeatable: true },
  { id: 'no-guest-feedback', name: 'Keine Rückmeldung Gast', points: -2, category: 'negative', description: 'Gast-Anfragen nicht beantwortet', isRepeatable: true },
  { id: 'stairway-noise', name: 'Lärm im Treppenhaus', points: -1, category: 'negative', description: 'Störende Geräusche verursacht', isRepeatable: true },
  { id: 'door-slamming', name: 'Türen zuschlagen', points: -1, category: 'negative', description: 'Türen laut geschlossen', isRepeatable: true },
  { id: 'ac-open-doors', name: 'Aircondition laufen trotz offener Türen', points: -1, category: 'negative', description: 'Energieverschwendung', isRepeatable: true },
  { id: 'cleaning-system-ignored', name: 'Reinigungssystem nicht eingehalten', points: -1, category: 'negative', description: 'Reinigungsstandards nicht befolgt', isRepeatable: true },
  { id: 'lights-on', name: 'Licht anlassen', points: -1, category: 'negative', description: 'Unnötige Beleuchtung', isRepeatable: true },
  { id: 'unclean-work', name: 'Unsauberes Arbeiten', points: -1, category: 'negative', description: 'Arbeitsqualität unzureichend', isRepeatable: true },
  { id: 'ignore-obvious', name: 'Sehen (müssen), aber ignorieren', points: -3, category: 'negative', description: 'Offensichtliche Probleme ignoriert', isRepeatable: true }
];

export const AdminPointsManager: React.FC = () => {
  const { user, users } = useAuth();
  const [pointRules] = useState<PointRule[]>(defaultPointRules);
  const [pointEntries, setPointEntries] = useState<PointEntry[]>([]);
  const [userViolations, setUserViolations] = useState<UserViolation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customPoints, setCustomPoints] = useState<number>(0);
  const [customReason, setCustomReason] = useState<string>('');
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);

  useEffect(() => {
    loadPointEntries();
    loadUserViolations();
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

  const loadUserViolations = () => {
    const saved = localStorage.getItem('villa_sun_user_violations');
    if (saved) {
      try {
        setUserViolations(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading user violations:', error);
      }
    }
  };

  const savePointEntries = (entries: PointEntry[]) => {
    localStorage.setItem('villa_sun_point_entries', JSON.stringify(entries));
    setPointEntries(entries);
  };

  const saveUserViolations = (violations: UserViolation[]) => {
    localStorage.setItem('villa_sun_user_violations', JSON.stringify(violations));
    setUserViolations(violations);
  };

  const addToCart = (ruleId: string) => {
    const existingItem = cart.find(item => item.ruleId === ruleId);
    if (existingItem) {
      setCart(cart.map(item => 
        item.ruleId === ruleId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ruleId, quantity: 1 }]);
    }
  };

  const updateCartQuantity = (ruleId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.ruleId !== ruleId));
    } else {
      setCart(cart.map(item => 
        item.ruleId === ruleId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const removeFromCart = (ruleId: string) => {
    setCart(cart.filter(item => item.ruleId !== ruleId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const checkViolationMultiplier = (userId: string, ruleId: string): number => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentEntries = pointEntries.filter(entry => 
      entry.userId === userId && 
      entry.ruleId === ruleId && 
      new Date(entry.assignedAt) >= sevenDaysAgo
    );

    return recentEntries.length >= 2 ? 2 : 1; // Double after 3rd occurrence (2 previous + current = 3)
  };

  const updateUserViolations = (userId: string, ruleId: string) => {
    const now = new Date().toISOString();
    const existing = userViolations.find(v => v.userId === userId && v.ruleId === ruleId);
    
    if (existing) {
      const updated = userViolations.map(v => 
        v.userId === userId && v.ruleId === ruleId
          ? { ...v, count: v.count + 1, lastOccurrence: now }
          : v
      );
      saveUserViolations(updated);
    } else {
      const newViolation: UserViolation = {
        userId,
        ruleId,
        count: 1,
        lastOccurrence: now
      };
      saveUserViolations([...userViolations, newViolation]);
    }
  };

  const assignPoints = () => {
    if (!selectedUser) {
      toast.error('Bitte wählen Sie einen Mitarbeiter aus');
      return;
    }

    if (cart.length === 0) {
      toast.error('Warenkorb ist leer');
      return;
    }

    const newEntries: PointEntry[] = [];

    cart.forEach(cartItem => {
      const rule = pointRules.find(r => r.id === cartItem.ruleId);
      if (!rule) return;

      for (let i = 0; i < cartItem.quantity; i++) {
        const multiplier = rule.category === 'negative' ? checkViolationMultiplier(selectedUser, rule.id) : 1;
        const finalPoints = rule.points * multiplier;

        const entry: PointEntry = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          userId: selectedUser,
          ruleId: rule.id,
          points: finalPoints,
          reason: rule.name,
          customReason: cartItem.customReason,
          assignedBy: user?.id || '',
          assignedAt: new Date().toISOString(),
          multiplier
        };

        newEntries.push(entry);

        if (rule.category === 'negative') {
          updateUserViolations(selectedUser, rule.id);
        }
      }
    });

    savePointEntries([...pointEntries, ...newEntries]);
    clearCart();
    setSelectedUser('');
    toast.success(`${newEntries.length} Punkteeinträge erfolgreich zugewiesen`);
  };

  const assignCustomPoints = () => {
    if (!selectedUser) {
      toast.error('Bitte wählen Sie einen Mitarbeiter aus');
      return;
    }

    if (!customReason.trim()) {
      toast.error('Bitte geben Sie einen Grund ein');
      return;
    }

    if (customPoints === 0) {
      toast.error('Punkte dürfen nicht 0 sein');
      return;
    }

    const entry: PointEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: selectedUser,
      ruleId: 'custom',
      points: customPoints,
      reason: 'Individuelle Punktevergabe',
      customReason: customReason,
      assignedBy: user?.id || '',
      assignedAt: new Date().toISOString(),
      multiplier: 1
    };

    savePointEntries([...pointEntries, entry]);
    setCustomPoints(0);
    setCustomReason('');
    setIsCustomDialogOpen(false);
    toast.success('Individuelle Punkte erfolgreich zugewiesen');
  };

  const getUserPoints = (userId: string): number => {
    return pointEntries
      .filter(entry => entry.userId === userId)
      .reduce((total, entry) => total + entry.points, 0);
  };

  const getCartTotal = (): number => {
    return cart.reduce((total, cartItem) => {
      const rule = pointRules.find(r => r.id === cartItem.ruleId);
      if (!rule) return total;
      
      const multiplier = selectedUser && rule.category === 'negative' 
        ? checkViolationMultiplier(selectedUser, rule.id) 
        : 1;
      
      return total + (rule.points * multiplier * cartItem.quantity);
    }, 0);
  };

  const positiveRules = pointRules.filter(rule => rule.category === 'positive').sort((a, b) => a.name.localeCompare(b.name));
  const negativeRules = pointRules.filter(rule => rule.category === 'negative').sort((a, b) => a.name.localeCompare(b.name));
  const staffUsers = users.filter(u => u.role === 'staff');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Admin Points Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Selection & Cart */}
            <div className="space-y-4">
              <div>
                <Label>Mitarbeiter auswählen</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mitarbeiter wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({getUserPoints(user.id)} Punkte)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Shopping Cart */}
              <Card className="border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Warenkorb ({cart.length})
                    </span>
                    {cart.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearCart}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {cart.length === 0 ? (
                    <p className="text-sm text-gray-500">Warenkorb ist leer</p>
                  ) : (
                    <>
                      {cart.map(cartItem => {
                        const rule = pointRules.find(r => r.id === cartItem.ruleId);
                        if (!rule) return null;
                        
                        const multiplier = selectedUser && rule.category === 'negative' 
                          ? checkViolationMultiplier(selectedUser, rule.id) 
                          : 1;
                        
                        return (
                          <div key={cartItem.ruleId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{rule.name}</div>
                              <div className="text-xs text-gray-600">
                                {rule.points * multiplier} Punkte
                                {multiplier > 1 && (
                                  <Badge variant="destructive" className="ml-1 text-xs">
                                    x{multiplier}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartQuantity(cartItem.ruleId, cartItem.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm">{cartItem.quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCartQuantity(cartItem.ruleId, cartItem.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between items-center font-medium">
                          <span>Gesamt:</span>
                          <span className={getCartTotal() >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {getCartTotal()} Punkte
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={assignPoints}
                          disabled={!selectedUser}
                          className="flex-1"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Zuweisen
                        </Button>
                        
                        <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" disabled={!selectedUser}>
                              <Plus className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Individuelle Punkte vergeben</DialogTitle>
                              <DialogDescription>
                                Freie Punktevergabe mit eigenem Grund
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Punkte</Label>
                                <Input
                                  type="number"
                                  value={customPoints}
                                  onChange={(e) => setCustomPoints(parseInt(e.target.value) || 0)}
                                  placeholder="Punkte eingeben (+ oder -)"
                                />
                              </div>
                              <div>
                                <Label>Grund</Label>
                                <Textarea
                                  value={customReason}
                                  onChange={(e) => setCustomReason(e.target.value)}
                                  placeholder="Grund für Punktevergabe..."
                                  rows={3}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsCustomDialogOpen(false)}>
                                Abbrechen
                              </Button>
                              <Button onClick={assignCustomPoints}>
                                Punkte zuweisen
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Positive Points */}
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Positive Punkte
              </h3>
              <div className="space-y-2">
                {positiveRules.map(rule => (
                  <Card key={rule.id} className="border-green-200 hover:bg-green-50 transition-colors">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{rule.name}</div>
                          <div className="text-xs text-gray-600">{rule.description}</div>
                          <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-800">
                            +{rule.points} Punkte
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToCart(rule.id)}
                          disabled={!selectedUser}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Negative Points */}
            <div>
              <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Negative Punkte
              </h3>
              <div className="space-y-2">
                {negativeRules.map(rule => {
                  const multiplier = selectedUser ? checkViolationMultiplier(selectedUser, rule.id) : 1;
                  
                  return (
                    <Card key={rule.id} className="border-red-200 hover:bg-red-50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{rule.name}</div>
                            <div className="text-xs text-gray-600">{rule.description}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                {rule.points * multiplier} Punkte
                              </Badge>
                              {multiplier > 1 && (
                                <Badge variant="destructive" className="text-xs">
                                  Verdoppelt (x{multiplier})
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToCart(rule.id)}
                            disabled={!selectedUser}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Letzte Punktevergaben
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pointEntries
              .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
              .slice(0, 10)
              .map(entry => {
                const entryUser = users.find(u => u.id === entry.userId);
                const assignedBy = users.find(u => u.id === entry.assignedBy);
                
                return (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{entryUser?.name}</span>
                        <Badge className={entry.points >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {entry.points >= 0 ? '+' : ''}{entry.points} Punkte
                        </Badge>
                        {entry.multiplier > 1 && (
                          <Badge variant="destructive" className="text-xs">
                            x{entry.multiplier}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {entry.reason}
                        {entry.customReason && ` - ${entry.customReason}`}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.assignedAt).toLocaleString('de-DE')} von {assignedBy?.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            
            {pointEntries.length === 0 && (
              <p className="text-center text-gray-500 py-8">Noch keine Punktevergaben</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPointsManager;