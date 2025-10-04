import { User, Task, AttendanceRecord } from '../types';

export const roomOptions = [
  '101', '102', '103', '104', '105', '106', '107', '108', '109', '110',
  '201', '202', '203', '204', '205', '206', '207', '208', '209', '210',
  '301', '302', '303', '304', '305', '306', '307', '308', '309', '310'
];

// Planet names for room cleaning and small cleaning (8 planets without Mercury)
export const planetNames = [
  'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'
];

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@villasun.com',
    role: 'admin',
    pin: '1234',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Maria Schmidt',
    email: 'maria@villasun.com',
    role: 'staff',
    pin: '5678',
    isActive: true,
    createdAt: new Date('2024-01-15')
  },
  {
    id: '3',
    name: 'John Doe',
    email: 'john@villasun.com',
    role: 'teamleader',
    pin: '9999',
    isActive: true,
    createdAt: new Date('2024-02-01')
  }
];

// Clear old tasks - start fresh
const mockTasks: Task[] = [];

const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    userId: '2',
    date: new Date().toISOString().split('T')[0],
    checkIn: '08:00',
    checkOut: null,
    status: 'present',
    location: 'Villa Sun WiFi'
  }
];

export const initializeMockData = () => {
  // Initialize users if not exists
  const existingUsers = localStorage.getItem('villa_sun_users');
  if (!existingUsers) {
    localStorage.setItem('villa_sun_users', JSON.stringify(mockUsers));
  }

  // Clear and initialize tasks (remove all old tasks)
  localStorage.setItem('villa_sun_tasks', JSON.stringify(mockTasks));

  // Initialize attendance if not exists
  const existingAttendance = localStorage.getItem('villa_sun_attendance');
  if (!existingAttendance) {
    localStorage.setItem('villa_sun_attendance', JSON.stringify(mockAttendance));
  }

  // Clear task templates to start fresh
  localStorage.setItem('villa_sun_task_templates', JSON.stringify([]));
};