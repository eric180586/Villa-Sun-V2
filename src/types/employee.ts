export type Employee = {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'staff';
  language: string | null;
  active: boolean;
  created_at: string;
};
