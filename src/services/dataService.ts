import { supabase } from '../lib/supabase';
import type { 
  User, 
  AttendanceRecord, 
  Task, 
  PointEntry, 
  Schedule, 
  DayOffRequest, 
  MorningChecklist 
} from '../lib/supabase';

class DataService {
  private isSupabaseAvailable = false;

  constructor() {
    this.checkSupabaseConnection();
  }

  private async checkSupabaseConnection() {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      this.isSupabaseAvailable = !error;
    } catch (error) {
      this.isSupabaseAvailable = false;
    }
  }

  // Generic methods for localStorage fallback
  private getFromLocalStorage<T>(key: string, defaultValue: T): T {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  private saveToLocalStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .order('name');
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    return this.getFromLocalStorage('villa_sun_users', []);
  }

  // Attendance Records
  async getAttendanceRecords(): Promise<AttendanceRecord[]> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('*')
          .order('date', { ascending: false });
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    return this.getFromLocalStorage('villa_sun_attendance', []);
  }

  async saveAttendanceRecord(record: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .upsert(record)
          .select()
          .single();
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    // localStorage fallback
    const records = this.getFromLocalStorage<AttendanceRecord[]>('villa_sun_attendance', []);
    const newRecord = {
      ...record,
      id: record.id || Date.now().toString(),
      created_at: record.created_at || new Date().toISOString()
    } as AttendanceRecord;
    
    const updatedRecords = records.filter(r => r.id !== newRecord.id);
    updatedRecords.unshift(newRecord);
    this.saveToLocalStorage('villa_sun_attendance', updatedRecords);
    
    return newRecord;
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    return this.getFromLocalStorage('villa_sun_tasks', []);
  }

  async saveTask(task: Partial<Task>): Promise<Task> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .upsert(task)
          .select()
          .single();
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    // localStorage fallback
    const tasks = this.getFromLocalStorage<Task[]>('villa_sun_tasks', []);
    const newTask = {
      ...task,
      id: task.id || Date.now().toString(),
      created_at: task.created_at || new Date().toISOString()
    } as Task;
    
    const updatedTasks = tasks.filter(t => t.id !== newTask.id);
    updatedTasks.unshift(newTask);
    this.saveToLocalStorage('villa_sun_tasks', updatedTasks);
    
    return newTask;
  }

  async deleteTask(id: string): Promise<void> {
    if (this.isSupabaseAvailable) {
      try {
        const { error } = await supabase
          .from('tasks')
          .delete()
          .eq('id', id);
        
        if (!error) {
          return;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    // localStorage fallback
    const tasks = this.getFromLocalStorage<Task[]>('villa_sun_tasks', []);
    const updatedTasks = tasks.filter(t => t.id !== id);
    this.saveToLocalStorage('villa_sun_tasks', updatedTasks);
  }

  // Point Entries
  async getPointEntries(): Promise<PointEntry[]> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('point_entries')
          .select('*')
          .order('assigned_at', { ascending: false });
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    return this.getFromLocalStorage('villa_sun_point_entries', []);
  }

  async savePointEntry(entry: Partial<PointEntry>): Promise<PointEntry> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('point_entries')
          .insert(entry)
          .select()
          .single();
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    // localStorage fallback
    const entries = this.getFromLocalStorage<PointEntry[]>('villa_sun_point_entries', []);
    const newEntry = {
      ...entry,
      id: entry.id || Date.now().toString(),
      assigned_at: entry.assigned_at || new Date().toISOString()
    } as PointEntry;
    
    entries.unshift(newEntry);
    this.saveToLocalStorage('villa_sun_point_entries', entries);
    
    return newEntry;
  }

  // Schedules
  async getSchedules(): Promise<Schedule[]> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .order('date', { ascending: false });
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    return this.getFromLocalStorage('villa_sun_schedules', []);
  }

  async saveSchedule(schedule: Partial<Schedule>): Promise<Schedule> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('schedules')
          .upsert(schedule)
          .select()
          .single();
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    // localStorage fallback
    const schedules = this.getFromLocalStorage<Schedule[]>('villa_sun_schedules', []);
    const newSchedule = {
      ...schedule,
      id: schedule.id || Date.now().toString(),
      created_at: schedule.created_at || new Date().toISOString()
    } as Schedule;
    
    const updatedSchedules = schedules.filter(s => !(s.user_id === newSchedule.user_id && s.date === newSchedule.date));
    updatedSchedules.unshift(newSchedule);
    this.saveToLocalStorage('villa_sun_schedules', updatedSchedules);
    
    return newSchedule;
  }

  // Day Off Requests
  async getDayOffRequests(): Promise<DayOffRequest[]> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('day_off_requests')
          .select('*')
          .order('requested_at', { ascending: false });
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    return this.getFromLocalStorage('villa_sun_dayoff_requests', []);
  }

  async saveDayOffRequest(request: Partial<DayOffRequest>): Promise<DayOffRequest> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('day_off_requests')
          .upsert(request)
          .select()
          .single();
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    // localStorage fallback
    const requests = this.getFromLocalStorage<DayOffRequest[]>('villa_sun_dayoff_requests', []);
    const newRequest = {
      ...request,
      id: request.id || Date.now().toString(),
      requested_at: request.requested_at || new Date().toISOString()
    } as DayOffRequest;
    
    const updatedRequests = requests.filter(r => r.id !== newRequest.id);
    updatedRequests.unshift(newRequest);
    this.saveToLocalStorage('villa_sun_dayoff_requests', updatedRequests);
    
    return newRequest;
  }

  async deleteDayOffRequest(id: string): Promise<void> {
    if (this.isSupabaseAvailable) {
      try {
        const { error } = await supabase
          .from('day_off_requests')
          .delete()
          .eq('id', id);
        
        if (!error) {
          return;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    // localStorage fallback
    const requests = this.getFromLocalStorage<DayOffRequest[]>('villa_sun_dayoff_requests', []);
    const updatedRequests = requests.filter(r => r.id !== id);
    this.saveToLocalStorage('villa_sun_dayoff_requests', updatedRequests);
  }

  // Morning Checklist
  async getMorningChecklists(): Promise<MorningChecklist[]> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('morning_checklist')
          .select('*')
          .order('date', { ascending: false });
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    return this.getFromLocalStorage('villa_sun_morning_checklist', []);
  }

  async saveMorningChecklist(checklist: Partial<MorningChecklist>): Promise<MorningChecklist> {
    if (this.isSupabaseAvailable) {
      try {
        const { data, error } = await supabase
          .from('morning_checklist')
          .upsert(checklist)
          .select()
          .single();
        
        if (!error && data) {
          return data;
        }
      } catch (error) {
        console.error('Supabase error, falling back to localStorage:', error);
      }
    }
    
    // localStorage fallback
    const checklists = this.getFromLocalStorage<MorningChecklist[]>('villa_sun_morning_checklist', []);
    const newChecklist = {
      ...checklist,
      id: checklist.id || Date.now().toString(),
      created_at: checklist.created_at || new Date().toISOString()
    } as MorningChecklist;
    
    const updatedChecklists = checklists.filter(c => !(c.user_id === newChecklist.user_id && c.date === newChecklist.date));
    updatedChecklists.unshift(newChecklist);
    this.saveToLocalStorage('villa_sun_morning_checklist', updatedChecklists);
    
    return newChecklist;
  }
}

export const dataService = new DataService();