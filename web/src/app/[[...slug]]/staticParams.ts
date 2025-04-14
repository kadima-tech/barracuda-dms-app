export function generateStaticParams() {
  // Collect all routes from the paths configuration
  const allRoutes = [
    { slug: [''] }, // Root route
    { slug: ['dashboard'] },
    { slug: ['landing'] },
    { slug: ['device-management'] },
    { slug: ['user-management'] },
    { slug: ['alert'] },
    { slug: ['contact'] },
    { slug: ['clients', 'dela', 'person-viewer'] },
    { slug: ['spotify'] },
    { slug: ['spotify', 'music-dashboard'] },
    { slug: ['room-booking', 'booking-dashboard'] },
  ];

  return allRoutes;
}
