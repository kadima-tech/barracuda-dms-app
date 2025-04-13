'use client';

import React from 'react';
import { ThemedBookingDashboard } from '../../components/booking-dashboard';
import ClientOnly from '../../components/common/ClientOnly';

const BookingDashboard = () => {
  return (
    <ClientOnly fallback={<div>Loading booking dashboard...</div>}>
      <ThemedBookingDashboard />
    </ClientOnly>
  );
};

export default BookingDashboard;
