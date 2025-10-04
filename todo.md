# Villa Sun Staff App - MVP Implementation Plan

## Core Files to Create/Modify

### 1. Authentication & User Management
- `src/types/index.ts` - Type definitions for users, tasks, attendance, etc.
- `src/contexts/AuthContext.tsx` - Authentication context and user management
- `src/pages/Login.tsx` - Login page with PIN authentication

### 2. Main Dashboard & Navigation
- `src/pages/Dashboard.tsx` - Main dashboard with tile-based interface
- `src/components/Navigation.tsx` - Navigation component
- `src/components/LanguageSelector.tsx` - Language switcher (Khmer/English)

### 3. Core Features
- `src/pages/Attendance.tsx` - Check-in/Check-out with WLAN detection and QR fallback
- `src/pages/Schedule.tsx` - Shift planning and time-off requests
- `src/pages/Tasks.tsx` - Task management (Today/This Week/This Month)
- `src/pages/Points.tsx` - Points and penalties system overview

### 4. Specialized Components
- `src/components/TaskCard.tsx` - Individual task display component
- `src/components/CheckInButton.tsx` - Smart check-in component
- `src/components/PointsDisplay.tsx` - Points visualization
- `src/hooks/useLocalStorage.tsx` - Local storage management hook

## MVP Features Priority
1. ✅ Basic authentication with roles (Admin/TL/Staff)
2. ✅ Dashboard with tile interface
3. ✅ Task management (create, assign, complete)
4. ✅ Basic attendance system
5. ✅ Points system foundation
6. ✅ Multi-language support (English/Khmer basics)
7. ✅ Responsive design for mobile/tablet

## Simplified for MVP
- Use localStorage instead of real backend
- Basic QR code simulation
- Simplified WLAN detection (mock)
- Essential German/English labels (Khmer can be added later)
- Core task types: General, Room Cleaning, Small Cleaning

## File Structure
```
src/
├── components/
│   ├── ui/ (shadcn components)
│   ├── Navigation.tsx
│   ├── LanguageSelector.tsx
│   ├── TaskCard.tsx
│   ├── CheckInButton.tsx
│   └── PointsDisplay.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useLocalStorage.tsx
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Attendance.tsx
│   ├── Schedule.tsx
│   ├── Tasks.tsx
│   └── Points.tsx
├── types/
│   └── index.ts
└── utils/
    └── mockData.ts
```