import type { Employee } from '@/types/employee';

const LS_KEY = 'vs_current_employee'; // nur Session-Marker

export function setCurrentEmployee(e: Employee) {
  localStorage.setItem(LS_KEY, JSON.stringify({
    id: e.id, email: e.email, display_name: e.display_name, role: e.role, language: e.language
  }));
}

export function getCurrentEmployee(): null | Pick<Employee,'id'|'email'|'display_name'|'role'|'language'> {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearCurrentEmployee() {
  localStorage.removeItem(LS_KEY);
}

