/**
 * Supabase client configuration.
 *
 * The actual Supabase client is created using the `createClient` helper from
 * `@supabase/supabase-js`.  To avoid hard‑coding secrets in the codebase, the
 * connection details are read from Vite environment variables.  When running
 * the application locally you should provide the following variables in a
 * `.env` file at the project root:
 *
 * ```
 * VITE_SUPABASE_URL=<your project URL>
 * VITE_SUPABASE_ANON_KEY=<your anon/public API key>
 * ```
 *
 * If either of these variables is missing the returned client will still be
 * defined but database operations will result in errors.  You can fall back
 * to localStorage or mock data in that case.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Read configuration from the environment.  These are injected at build time
// by Vite.  See https://vitejs.dev/guide/env-and-mode.html for details.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Create a real Supabase client when credentials are available.  If not, use
// an undefined client so consumers can detect the lack of configuration.
export const supabase: SupabaseClient | undefined =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : undefined;

// Database types for TypeScript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  language: string;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  check_in?: string;
  check_out?: string;
  location?: string;
  wifi_ssid?: string;
  notes?: string;
  status: 'present' | 'late' | 'absent';
  working_hours?: number;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_by: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
  points: number;
  duration: number;
  type: string;
  is_template: boolean;
  created_at: string;
  completed_at?: string;
  approved_at?: string;
}

export interface PointEntry {
  id: string;
  user_id: string;
  rule_id: string;
  points: number;
  reason: string;
  custom_reason?: string;
  assigned_by: string;
  assigned_at: string;
  multiplier: number;
}

export interface Schedule {
  id: string;
  user_id: string;
  date: string;
  shift: 'early' | 'late' | 'off';
  is_approved: boolean;
  created_at: string;
}

export interface DayOffRequest {
  id: string;
  user_id: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  request_deadline: string;
}

export interface MorningChecklist {
  id: string;
  user_id: string;
  date: string;
  items: Record<string, any>[];
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  notes?: string;
  created_at: string;
}