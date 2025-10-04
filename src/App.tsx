import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Attendance from './pages/Attendance';
import Schedule from './pages/Schedule';
import Points from './pages/Points';
import StaffManagement from './pages/StaffManagement';
import TaskTemplates from './pages/TaskTemplates';
import Reports from './pages/Reports';
import TimeTracking from './pages/TimeTracking';
import Settings from './pages/Settings';
import { SyncStatusIndicator } from './components/SyncStatusIndicator';
import { initializeMockData } from './utils/mockData';
import { useState } from 'react';

// Initialize mock data on app start
initializeMockData();

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'tasks':
        return <Tasks />;
      case 'schedule':
        return <Schedule />;
      case 'points':
        return <Points />;
      case 'attendance':
        return <Attendance />;
      case 'staff':
        return <StaffManagement />;
      case 'templates':
        return <TaskTemplates />;
      case 'reports':
        return <Reports />;
      case 'time-tracking':
        return <TimeTracking />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="fixed top-4 right-4 z-50">
        <SyncStatusIndicator />
      </div>
      <main className="lg:pl-0">
        <div className="lg:ml-0">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

const App = () => (
  <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <AppContent />
    </TooltipProvider>
  </AuthProvider>
);

export default App;