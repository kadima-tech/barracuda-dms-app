import React from "react";
import { ThemeProvider } from "./ThemeContext";
import BookingDashboard from "./BookingDashboard";

const ThemedBookingDashboard: React.FC = () => (
  <ThemeProvider>
    <BookingDashboard />
  </ThemeProvider>
);

export default ThemedBookingDashboard;
