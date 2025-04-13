'use client';

import React from 'react';
import dynamic from 'next/dynamic';
// Import the Vite compatibility layer
import '../../utils/vite-compat';

// Import the main App component with dynamic import and disable SSR
const App = dynamic(() => import('../../App'), { ssr: false });

export function ClientApp() {
  return <App />;
}
