import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Smartphone,
  Volume2,
  Vibrate,
  Save,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationSettings {
  pushEnabled: boolean;
  taskReminders: boolean;
  scheduleUpdates: boolean;
  attendanceAlerts: boolean;
  pointsUpdates: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>('villa_sun_notification_settings', {
    pushEnabled: true,
    taskReminders: true,
    scheduleUpdates: true,
    attendanceAlerts: true,
    pointsUpdates: false,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '07:00'
  });

  const [tempNotificationSettings, setTempNotificationSettings] = useState(notificationSettings);

  const handleSaveNotificationSettings = async () => {
    // Request notification permission if push notifications are enabled
    if (tempNotificationSettings.pushEnabled && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Benachrichtigungen wurden abgelehnt. Bitte aktivieren Sie sie in den Browser-Einstellungen.');
        return;
      }
    }

    setNotificationSettings(tempNotificationSettings);
    toast.success('Benachrichtigungseinstellungen gespeichert!');
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Villa Sun Test', {
        body: 'Dies ist eine Test-Benachrichtigung',
        icon: '/favicon.ico'
      });
      toast.success('Test-Benachrichtigung gesendet!');
    } else {
      toast.error('Benachrichtigungen sind nicht aktiviert');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="h-6 w-6" />
          <h1 className="text-2xl md:text-3xl font-bold">Einstellungen</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Benutzereinstellungen</CardTitle>
            <CardDescription>Persönliche Informationen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  {user?.name || ''}
                </div>
              </div>
              <div>
                <Label>Rolle</Label>
                <div className="mt-1">
                  <Badge variant="outline">{user?.role}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Push Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Push-Benachrichtigungen
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie Ihre Benachrichtigungseinstellungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Push Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <div>
                  <Label className="text-base font-medium">Push-Benachrichtigungen</Label>
                  <p className="text-sm text-gray-600">Benachrichtigungen auf diesem Gerät aktivieren</p>
                </div>
              </div>
              <Switch
                checked={tempNotificationSettings.pushEnabled}
                onCheckedChange={(checked) => 
                  setTempNotificationSettings(prev => ({ ...prev, pushEnabled: checked }))
                }
              />
            </div>

            {/* Notification Types */}
            {tempNotificationSettings.pushEnabled && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Aufgaben-Erinnerungen</Label>
                    <p className="text-sm text-gray-600">Benachrichtigungen für neue und fällige Aufgaben</p>
                  </div>
                  <Switch
                    checked={tempNotificationSettings.taskReminders}
                    onCheckedChange={(checked) => 
                      setTempNotificationSettings(prev => ({ ...prev, taskReminders: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dienstplan-Updates</Label>
                    <p className="text-sm text-gray-600">Benachrichtigungen bei Schichtänderungen</p>
                  </div>
                  <Switch
                    checked={tempNotificationSettings.scheduleUpdates}
                    onCheckedChange={(checked) => 
                      setTempNotificationSettings(prev => ({ ...prev, scheduleUpdates: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Punkte-Updates</Label>
                    <p className="text-sm text-gray-600">Benachrichtigungen bei Punkteänderungen</p>
                  </div>
                  <Switch
                    checked={tempNotificationSettings.pointsUpdates}
                    onCheckedChange={(checked) => 
                      setTempNotificationSettings(prev => ({ ...prev, pointsUpdates: checked }))
                    }
                  />
                </div>

                {/* Sound & Vibration */}
                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-medium text-gray-900">Benachrichtigungsart</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-gray-600" />
                      <Label>Ton</Label>
                    </div>
                    <Switch
                      checked={tempNotificationSettings.soundEnabled}
                      onCheckedChange={(checked) => 
                        setTempNotificationSettings(prev => ({ ...prev, soundEnabled: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Vibrate className="h-4 w-4 text-gray-600" />
                      <Label>Vibration</Label>
                    </div>
                    <Switch
                      checked={tempNotificationSettings.vibrationEnabled}
                      onCheckedChange={(checked) => 
                        setTempNotificationSettings(prev => ({ ...prev, vibrationEnabled: checked }))
                      }
                    />
                  </div>
                </div>

                {/* Quiet Hours */}
                <div className="border-t pt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Ruhezeiten</Label>
                      <p className="text-sm text-gray-600">Keine Benachrichtigungen während bestimmter Zeiten</p>
                    </div>
                    <Switch
                      checked={tempNotificationSettings.quietHours}
                      onCheckedChange={(checked) => 
                        setTempNotificationSettings(prev => ({ ...prev, quietHours: checked }))
                      }
                    />
                  </div>

                  {tempNotificationSettings.quietHours && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Von</Label>
                        <input
                          type="time"
                          value={tempNotificationSettings.quietStart}
                          onChange={(e) => setTempNotificationSettings(prev => ({ 
                            ...prev, 
                            quietStart: e.target.value 
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <Label>Bis</Label>
                        <input
                          type="time"
                          value={tempNotificationSettings.quietEnd}
                          onChange={(e) => setTempNotificationSettings(prev => ({ 
                            ...prev, 
                            quietEnd: e.target.value 
                          }))}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSaveNotificationSettings} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Einstellungen speichern
              </Button>
              {tempNotificationSettings.pushEnabled && (
                <Button onClick={testNotification} variant="outline">
                  <Bell className="h-4 w-4 mr-2" />
                  Test
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Settings
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl md:text-3xl font-bold">Admin Einstellungen</h1>
      </div>

      {/* Admin Push Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Admin Benachrichtigungen
          </CardTitle>
          <CardDescription>
            Benachrichtigungseinstellungen für Administratoren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Push Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <div>
                <Label className="text-base font-medium">Push-Benachrichtigungen</Label>
                <p className="text-sm text-gray-600">Admin-Benachrichtigungen aktivieren</p>
              </div>
            </div>
            <Switch
              checked={tempNotificationSettings.pushEnabled}
              onCheckedChange={(checked) => 
                setTempNotificationSettings(prev => ({ ...prev, pushEnabled: checked }))
              }
            />
          </div>

          {tempNotificationSettings.pushEnabled && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Anwesenheits-Benachrichtigungen</Label>
                  <p className="text-sm text-gray-600">Benachrichtigungen bei verspäteten Mitarbeitern</p>
                </div>
                <Switch
                  checked={tempNotificationSettings.attendanceAlerts}
                  onCheckedChange={(checked) => 
                    setTempNotificationSettings(prev => ({ ...prev, attendanceAlerts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Aufgaben-Updates</Label>
                  <p className="text-sm text-gray-600">Benachrichtigungen bei Aufgaben-Abschluss</p>
                </div>
                <Switch
                  checked={tempNotificationSettings.taskReminders}
                  onCheckedChange={(checked) => 
                    setTempNotificationSettings(prev => ({ ...prev, taskReminders: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Dienstplan-Updates</Label>
                  <p className="text-sm text-gray-600">Benachrichtigungen bei Schichtänderungen</p>
                </div>
                <Switch
                  checked={tempNotificationSettings.scheduleUpdates}
                  onCheckedChange={(checked) => 
                    setTempNotificationSettings(prev => ({ ...prev, scheduleUpdates: checked }))
                  }
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSaveNotificationSettings} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Einstellungen speichern
            </Button>
            {tempNotificationSettings.pushEnabled && (
              <Button onClick={testNotification} variant="outline">
                <Bell className="h-4 w-4 mr-2" />
                Test
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sicherheitseinstellungen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Session Timeout</Label>
              <p className="text-sm text-gray-600">Automatisches Ausloggen nach Inaktivität</p>
            </div>
            <Switch defaultChecked={true} />
          </div>

          <div>
            <Label>Session Dauer (Minuten)</Label>
            <input
              type="number"
              defaultValue="30"
              min="5"
              max="480"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Label>Version</Label>
              <p className="text-gray-600">Villa Sun Staff v2.0</p>
            </div>
            <div>
              <Label>Letztes Update</Label>
              <p className="text-gray-600">{new Date().toLocaleDateString('de-DE')}</p>
            </div>
            <div>
              <Label>Aktive Benutzer</Label>
              <p className="text-gray-600">Admin + Staff</p>
            </div>
            <div>
              <Label>Benachrichtigungen</Label>
              <Badge variant={tempNotificationSettings.pushEnabled ? "default" : "secondary"}>
                {tempNotificationSettings.pushEnabled ? 'Aktiviert' : 'Deaktiviert'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}