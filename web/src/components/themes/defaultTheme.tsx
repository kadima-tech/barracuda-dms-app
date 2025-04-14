import React from 'react';
import { ThemeProvider } from 'styled-components';
import { theme } from './theme';

export type ThemeType = typeof theme;

type Props = {
  children?: React.ReactNode;
};

const Theme: React.FC<Props> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

export default Theme;
