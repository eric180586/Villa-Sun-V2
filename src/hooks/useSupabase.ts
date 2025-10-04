import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Check if Supabase is available and configured
export const useSupabase = () => {
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSupabaseAvailability();
  }, []);

  const checkSupabaseAvailability = async () => {
    try {
      // Check if Supabase environment variables are available
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        // Try to make a simple request to test connectivity
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        
        if (response.ok || response.status === 404) {
          setIsSupabaseAvailable(true);
          toast.success('Supabase verbunden - Multi-Gerät-Synchronisation aktiviert');
        } else {
          throw new Error('Supabase not accessible');
        }
      } else {
        throw new Error('Supabase not configured');
      }
    } catch (error) {
      console.log('Supabase not available, using localStorage:', error);
      setIsSupabaseAvailable(false);
      toast.info('Offline-Modus - Daten werden lokal gespeichert');
    } finally {
      setIsLoading(false);
    }
  };

  return { isSupabaseAvailable, isLoading };
};