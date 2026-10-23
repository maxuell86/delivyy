import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  adminTheme: ThemeMode;
  isDark: boolean;
  toggleAdminTheme: () => void;
  setAdminTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminTheme, setAdminThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('omni_admin_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark'; // Dark mode default for professional KDS/kitchen/delivery panels
  });

  useEffect(() => {
    try {
      localStorage.setItem('omni_admin_theme', adminTheme);
    } catch {}

    if (adminTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [adminTheme]);

  const toggleAdminTheme = () => {
    setAdminThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setAdminTheme = (theme: ThemeMode) => {
    setAdminThemeState(theme);
  };

  return (
    <ThemeContext.Provider
      value={{
        adminTheme,
        isDark: adminTheme === 'dark',
        toggleAdminTheme,
        setAdminTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
