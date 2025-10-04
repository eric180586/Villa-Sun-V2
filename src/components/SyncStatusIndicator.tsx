import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { Wifi, WifiOff, Database, HardDrive } from 'lucide-react';

export const SyncStatusIndicator: React.FC = () => {
  const { isSupabaseConnected } = useAuth();

  if (isSupabaseConnected) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <Database className="h-3 w-3 mr-1" />
        Supabase verbunden
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
      <HardDrive className="h-3 w-3 mr-1" />
      Offline-Modus
    </Badge>
  );
};