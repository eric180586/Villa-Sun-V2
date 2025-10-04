export interface User {
  id: string;
  name: string;
  role: 'admin' | 'staff' | 'teamleader';
  pin: string;
  createdAt: string;
  points?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: 'cleaning' | 'maintenance' | 'service' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo?: string;
  room?: string;
  points: number;
  createdAt: string;
  completedAt?: string;
  completionPhoto?: string;
  estimatedTime?: number;
  template?: boolean;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  checkIn?: Date;
  checkOut?: Date;
  checkInMethod?: 'wifi' | 'qr' | 'manual';
  shift?: 'early' | 'late';
  isLate?: boolean;
  minutesLate?: number;
  points?: number;
  method?: string;
  location?: string;
}

export interface Schedule {
  id: string;
  userId: string;
  date: string;
  shift: 'early' | 'late' | 'off';
  isApproved: boolean;
  createdAt: string;
  approvedBy?: string;
  notes?: string;
}

export interface DayOffRequest {
  id: string;
  userId: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  requestDeadline: string;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface CheckOutRequest {
  id: string;
  userId: string;
  attendanceId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}