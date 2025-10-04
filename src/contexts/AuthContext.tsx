import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
  language: string;
  created_at: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  language: string;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => void;
  setLanguage: (lang: string) => void;
  refreshUsers: () => Promise<void>;
  isSupabaseConnected: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [language, setLanguage] = useState('de');
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  useEffect(() => {
    initializeAuth();
    loadUsers();
  }, []);

  const initializeAuth = () => {
    // Check if user was previously logged in
    const savedUser = localStorage.getItem('villa_sun_current_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setLanguage(userData.language || 'de');
      } catch (error) {
        console.error('Error loading saved user:', error);
        localStorage.removeItem('villa_sun_current_user');
      }
    }
  };

  const setDefaultUsers = () => {
    const defaultUsers: User[] = [
      {
        id: '1',
        email: 'admin@villasun.com',
        username: 'admin',
        name: 'Administrator',
        role: 'admin',
        language: 'de',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        email: 'maria@villasun.com',
        username: 'maria',
        name: 'Maria Schmidt',
        role: 'staff',
        language: 'de',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        email: 'john@villasun.com',
        username: 'john',
        name: 'John Miller',
        role: 'staff',
        language: 'de',
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        email: 'anna@villasun.com',
        username: 'anna',
        name: 'Anna Weber',
        role: 'staff',
        language: 'de',
        created_at: new Date().toISOString()
      }
    ];
    setUsers(defaultUsers);
    localStorage.setItem('villa_sun_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  };

  const loadUsers = async () => {
    try {
      // For now, we'll use localStorage fallback since Supabase isn't configured yet
      console.log('⚠️ Supabase not configured, using localStorage');
      setIsSupabaseConnected(false);
      
      // Fallback to localStorage
      const savedUsers = localStorage.getItem('villa_sun_users');
      if (savedUsers) {
        try {
          const userData = JSON.parse(savedUsers);
          setUsers(userData);
        } catch (parseError) {
          console.error('Error parsing saved users:', parseError);
          setDefaultUsers();
        }
      } else {
        setDefaultUsers();
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setDefaultUsers();
    }
  };

  const refreshUsers = async () => {
    await loadUsers();
  };

  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      // Ensure users are loaded
      let currentUsers = users;
      if (currentUsers.length === 0) {
        currentUsers = setDefaultUsers();
      }

      // Find user by username or email
      const foundUser = currentUsers.find(u => 
        u.email.toLowerCase() === usernameOrEmail.toLowerCase() ||
        (u.username && u.username.toLowerCase() === usernameOrEmail.toLowerCase())
      );
      
      if (foundUser) {
        setUser(foundUser);
        setLanguage(foundUser.language);
        localStorage.setItem('villa_sun_current_user', JSON.stringify(foundUser));
        
        if (isSupabaseConnected) {
          toast.success(`Willkommen, ${foundUser.name}! (Supabase verbunden)`);
        } else {
          toast.success(`Willkommen, ${foundUser.name}! (Offline-Modus)`);
        }
        return true;
      } else {
        toast.error('Benutzer nicht gefunden. Verfügbare Benutzernamen: admin, maria, john, anna');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Anmeldefehler');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('villa_sun_current_user');
    toast.success('Erfolgreich abgemeldet');
  };

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    if (user) {
      const updatedUser = { ...user, language: lang };
      setUser(updatedUser);
      localStorage.setItem('villa_sun_current_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        language,
        login,
        logout,
        setLanguage: handleSetLanguage,
        refreshUsers,
        isSupabaseConnected
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};