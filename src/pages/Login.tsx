import { useEffect, useState } from 'react';
import type { Employee } from '@/types/employee';
import { listEmployeesActive } from '@/lib/employees';
import { setCurrentEmployee } from '@/lib/session';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await listEmployeesActive();
        if (!alive) return;
        setEmployees(list);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    const channel = supabase
      .channel('employees-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'employees' },
        async () => {
          try {
            const list = await listEmployeesActive();
            setEmployees(list);
          } catch {}
        }
      )
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const quickLogin = (e: Employee) => {
    setCurrentEmployee(e);
    window.location.href = '/'; // adapt to your router if needed
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Anmelden</h1>

      <div className="mt-6">
        <h2 className="text-lg font-medium mb-2">Schnell-Login</h2>

        {loading && <p>Lade Benutzer…</p>}
        {error && <p className="text-red-600">Fehler: {error}</p>}

        {!loading && !error && employees.length === 0 && (
          <p>Keine aktiven Benutzer vorhanden.</p>
        )}

        {!loading && !error && employees.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {employees.map((e) => (
              <button
                key={e.id}
                onClick={() => quickLogin(e)}
                className="border rounded px-3 py-2 text-left hover:bg-gray-50"
                title={`${e.email} • Rolle: ${e.role}`}
              >
                <div className="font-medium">
                  {e.role === 'admin' ? '👑 ' : '👤 '}{e.display_name}
                </div>
                <div className="text-sm text-gray-600">{e.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
