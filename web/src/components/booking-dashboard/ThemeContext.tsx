'use client';

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
import { ThemeMode, ThemeContextType } from './types';
import {
  ThemeToggleContainer,
  ToggleLabel,
  ToggleInput,
  ToggleSlider,
} from './StyledComponents';

// Create the theme context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
});

// Custom hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider wrapper
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Default to light theme until client-side code runs
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  // Only execute client-side code after mounting
  useEffect(() => {
    setMounted(true);
    // Get saved theme from localStorage only on client
    const savedTheme =
      typeof window !== 'undefined'
        ? (localStorage.getItem('theme') as ThemeMode)
        : null;

    if (savedTheme) {
      setTheme(savedTheme);
    } else if (typeof window !== 'undefined') {
      // Check system preference
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    // Only access localStorage on the client
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  // To prevent flash of incorrect theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme toggle component
export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <ThemeToggleContainer>
      <span role="img" aria-label="Light mode">
        ☀️
      </span>
      <ToggleLabel>
        <ToggleInput
          type="checkbox"
          checked={theme === 'dark'}
          onChange={toggleTheme}
        />
        <ToggleSlider />
      </ToggleLabel>
      <span role="img" aria-label="Dark mode">
        🌙
      </span>
    </ThemeToggleContainer>
  );
};

export default ThemeContext;
