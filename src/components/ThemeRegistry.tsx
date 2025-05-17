'use client';
import * as React from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import NextAppDirEmotionCacheProvider from './EmotionCache'; // We'll create this next

// TODO: Define your custom theme here if needed
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#223354', // 深藍主色
      contrastText: '#fff',
    },
    secondary: {
      main: '#64748B', // 灰藍副色
      contrastText: '#fff',
    },
    background: {
      default: '#18181b', // 畫布深色
      paper: '#23232a',   // 面板深色
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
    },
  },
  shape: {
    borderRadius: 12, // 更現代的圓角
  },
  typography: {
    fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontWeightBold: 700,
    fontWeightMedium: 500,
    fontWeightRegular: 400,
  },
});

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <NextAppDirEmotionCacheProvider options={{ key: 'mui' }}>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        {children}
      </ThemeProvider>
    </NextAppDirEmotionCacheProvider>
  );
} 