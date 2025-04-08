import React, { createContext, useState, useContext, ReactNode } from 'react';
import { ThemeMode, ThemeContextType } from './types';
import {
  ThemeToggleContainer,
  ToggleLabel,
  ToggleInput,
  ToggleSlider,
} from './StyledComponents.ts';

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
  // Check for saved preference or use system preference
  const getSavedTheme = (): ThemeMode => {
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme) return savedTheme;

    // Check system preference
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    return prefersDark ? 'dark' : 'light';
  };

  const [theme, setTheme] = useState<ThemeMode>(getSavedTheme());

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

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
