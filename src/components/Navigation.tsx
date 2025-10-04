import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '../contexts/AuthContext';
import { 
  Menu,
  Home, 
  CheckSquare, 
  Calendar, 
  Clock, 
  Award, 
  Users, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut,
  X
} from 'lucide-react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsOpen(false); // Close menu after navigation
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, show: true },
    { id: 'tasks', label: 'Aufgaben', icon: CheckSquare, show: true },
    { id: 'schedule', label: 'Dienstplan', icon: Calendar, show: true },
    { id: 'attendance', label: 'Zeiterfassung', icon: Clock, show: user?.role === 'staff' },
    { id: 'points', label: 'Punkte', icon: Award, show: user?.role === 'staff' },
    { id: 'staff', label: 'Mitarbeiter', icon: Users, show: user?.role === 'admin' },
    { id: 'templates', label: 'Vorlagen', icon: FileText, show: user?.role === 'admin' },
    { id: 'reports', label: 'Berichte', icon: BarChart3, show: user?.role === 'admin' },
    { id: 'time-tracking', label: 'Arbeitszeit', icon: Clock, show: user?.role === 'admin' },
    { id: 'settings', label: 'Einstellungen', icon: Settings, show: true },
  ].filter(item => item.show);

  const MenuContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Villa Sun</h2>
            <p className="text-sm text-gray-600">{user?.name}</p>
          </div>
          <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
            {user?.role === 'admin' ? 'Admin' : 'Staff'}
          </Badge>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 ${
                isActive 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleNavigate(item.id)}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Abmelden
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Header with Hamburger Menu */}
      <div className="bg-white shadow-sm border-b lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <MenuContent />
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Villa Sun</h1>
            </div>
          </div>
          <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
            {user?.role === 'admin' ? 'Admin' : 'Staff'}
          </Badge>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:shadow-sm">
        <MenuContent />
      </div>

      {/* Desktop Content Offset */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0" />
    </>
  );
}