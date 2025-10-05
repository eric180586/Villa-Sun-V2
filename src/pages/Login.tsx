// z.B. src/pages/Login.tsx (oder entsprechende Datei)
import { useEffect, useState } from 'react';
import type { Employee } from '@/types/employee';
import { listEmployeesActive } from '@/lib/employees';
import { setCurrentEmployee } from '@/lib/session';
// ggf. deinen Router importieren
// import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  // const navigate = useNavigate();

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
        setError(e.message ?? String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const quickLogin = (e: Employee) => {
    setCurrentEmployee(e);
    // navigate('/'); // dahin, wo du nach Login landen willst
    window.location.href = '/'; // falls du kein Router-Hook nutzt
  };

  return (
    <div>
      {/* Dein bestehendes UI bleibt – nur die Datenquelle für die Buttons ändert sich */}
      {loading && <p>Lade Benutzer…</p>}
      {error && <p style={{color:'red'}}>Fehler: {error}</p>}

      {/* Buttons: statt statisch/LocalStorage jetzt aus employees */}
      {!loading && !error && employees.map((e) => (
        <button key={e.id} onClick={() => quickLogin(e)} className="your-existing-button-classes">
          {e.role === 'admin' ? '👑 ' : '👤 '}{e.display_name}
        </button>
      ))}

      {/* Belasse dein normales E-Mail/Passwort-Form – es wird schlicht nicht benötigt */}
    </div>
  );
  import { supabase } from '@/lib/supabase';

useEffect(() => {
  const channel = supabase
    .channel('employees-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, async () => {
      setEmployees(await listEmployeesActive());
    })
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, []);

}
