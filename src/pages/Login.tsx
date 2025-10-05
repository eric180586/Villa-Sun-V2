import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';         // bestehender Client
import type { Employee } from '@/types/employee';
import { setCurrentEmployee } from '@/lib/session';

export default function Login() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('active', true)
        .order('role', { ascending: false })   // Admin oben
        .order('display_name', { ascending: true });
      if (!active) return;
      if (error) setError(error.message);
      else setEmployees(data ?? []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const quickLogin = (e: Employee) => {
    setCurrentEmployee(e);
    // … hier navigieren wie vorher (Dashboard o.ä.)
    // z.B. navigate('/dashboard');
  };

  return (
    <div>
      {/* ...bestehendes Formular UI unverändert... */}

      {/* Schnell-Login-Liste aus DB (UI-Layout unverändert halten) */}
      {loading ? (
        <p>Lade Benutzer…</p>
      ) : error ? (
        <p style={{ color:'red' }}>Fehler: {error}</p>
      ) : (
        <>
          {employees.map((e) => (
            <button key={e.id} onClick={() => quickLogin(e)} className="...">
              {e.role === 'admin' ? '👑 ' : '👤 '}{e.display_name} ({e.email})
            </button>
          ))}
        </>
      )}
    </div>
  );
}
