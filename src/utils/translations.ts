export const translations = {
  // Navigation & General
  dashboard: {
    en: 'Dashboard',
    de: 'Dashboard',
    km: 'ផ្ទាំងគ្រប់គ្រង'
  },
  tasks: {
    en: 'Tasks',
    de: 'Aufgaben',
    km: 'កិច្ចការ'
  },
  attendance: {
    en: 'Attendance',
    de: 'Anwesenheit',
    km: 'វត្តមាន'
  },
  schedule: {
    en: 'Schedule',
    de: 'Dienstplan',
    km: 'កាលវិភាគ'
  },
  points: {
    en: 'Points',
    de: 'Punkte',
    km: 'ពិន្ទុ'
  },
  
  // Login
  login: {
    en: 'Login',
    de: 'Anmelden',
    km: 'ចូលប្រព័ន្ធ'
  },
  name: {
    en: 'Name',
    de: 'Name',
    km: 'ឈ្មោះ'
  },
  pin: {
    en: 'PIN',
    de: 'PIN',
    km: 'លេខសម្ងាត់'
  },
  
  // Tasks
  today: {
    en: 'Today',
    de: 'Heute',
    km: 'ថ្ងៃនេះ'
  },
  thisWeek: {
    en: 'This Week',
    de: 'Diese Woche',
    km: 'សប្តាហ៍នេះ'
  },
  thisMonth: {
    en: 'This Month',
    de: 'Dieser Monat',
    km: 'ខែនេះ'
  },
  roomCleaning: {
    en: 'Room Cleaning',
    de: 'Zimmerreinigung',
    km: 'សម្អាតបន្ទប់'
  },
  smallCleaning: {
    en: 'Small Cleaning',
    de: 'Kleine Reinigung',
    km: 'សម្អាតតូច'
  },
  
  // Attendance
  checkIn: {
    en: 'Check In',
    de: 'Einchecken',
    km: 'ចូលការងារ'
  },
  checkOut: {
    en: 'Check Out',
    de: 'Auschecken',
    km: 'ចេញការងារ'
  },
  
  // Status
  open: {
    en: 'Open',
    de: 'Offen',
    km: 'បើក'
  },
  inProgress: {
    en: 'In Progress',
    de: 'In Bearbeitung',
    km: 'កំពុងដំណើរការ'
  },
  completed: {
    en: 'Completed',
    de: 'Abgeschlossen',
    km: 'បានបញ្ចប់'
  },
  
  // Villa Sun Specific
  villaSun: {
    en: 'Villa Sun',
    de: 'Villa Sun',
    km: 'វីឡា ស៊ុន'
  },
  staffApp: {
    en: 'Staff App',
    de: 'Mitarbeiter App',
    km: 'កម្មវិធីបុគ្គលិក'
  },
  welcome: {
    en: 'Welcome',
    de: 'Willkommen',
    km: 'សូមស្វាគមន៍'
  }
};

export const useTranslation = (language: 'en' | 'de' | 'km' = 'de') => {
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: typeof translations | { en: string; de: string; km: string } | string = translations;
    
    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in value) {
        value = (value as Record<string, typeof value>)[k];
      } else {
        return key;
      }
    }
    
    if (typeof value === 'object' && value !== null && language in value) {
      return (value as { en: string; de: string; km: string })[language];
    }
    
    if (typeof value === 'object' && value !== null && 'en' in value) {
      return (value as { en: string; de: string; km: string }).en;
    }
    
    return key;
  };
  
  return { t };
};