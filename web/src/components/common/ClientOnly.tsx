'use client';

import React, { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnly component ensures its children are only rendered on the client side.
 * This is useful for components that use browser APIs or libraries that aren't SSR compatible.
 *
 * @param children - Components to render only on the client
 * @param fallback - Optional component to render during SSR and initial hydration
 */
const ClientOnly: React.FC<ClientOnlyProps> = ({
  children,
  fallback = null,
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return <>{isClient ? children : fallback}</>;
};

export default ClientOnly;
