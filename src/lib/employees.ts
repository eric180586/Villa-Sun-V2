import { supabase } from '@/lib/supabase';
import type { Employee } from '@/types/employee';

export async function listEmployeesActive(): Promise<Employee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('active', true)
    .order('role', { ascending: false })       // Admins oben
    .order('display_name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createEmployee(input: {
  email: string;
  display_name: string;
  role: 'admin' | 'staff';
  language?: string | null;
  active?: boolean;
}) {
  const { data, error } = await supabase
    .from('employees')
    .insert({ ...input, active: input.active ?? true })
    .select()
    .single();

  if (error) throw error;
  return data as Employee;
}

export async function updateEmployee(id: string, patch: Partial<Employee>) {
  const { data, error } = await supabase
    .from('employees')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Employee;
}

export async function deleteEmployee(id: string) {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw error;
}
