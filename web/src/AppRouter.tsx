import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { paths } from "./config/paths";
import Dashboard from "./pages/Dashboard";
import DeviceManagement from "./pages/DeviceManagement";
import Alerts from "./pages/Alerts";
import UserManagement from "./pages/UserManagement";
import Landing from "./pages/Landing.tsx";

import PersonViewer from "./pages/clients/Dela/PersonViewer";
import MusicDashboard from "./pages/spotify/MusicDashboard";
import SpotifyAuth from "./pages/spotify/SpotifyAuth";
import BookingDashboard from "./pages/exchange/BookingDashboard";

export const AppRouter = () => {
  return (
    <div data-testid="@router">
      <React.Fragment>
        <Routes>
          {/* Default route - redirects to landing page */}
          <Route
            path="/"
            element={<Navigate to={paths.global.landingPage} replace />}
          />

          <Route path={paths.global.dashboard} element={<Dashboard />} />
          <Route path={paths.global.landingPage} element={<Landing />} />
          <Route
            path={paths.global.deviceManagement}
            element={<DeviceManagement />}
          />
          {/* <Route path={paths.global.userManagement} element={<Dashboard />} /> */}
          <Route path={paths.global.alert} element={<Alerts />} />
          <Route
            path={paths.global.userManagement}
            element={<UserManagement />}
          />
          <Route
            path={paths.clients.dela.personViewer}
            element={<PersonViewer deviceId="device2" />}
          />
          <Route path="/spotify" element={<SpotifyAuth />} />
          <Route
            path={paths.spotify.musicDashboard}
            element={<MusicDashboard />}
          />
          <Route
            path={paths.roomBooking.bookingDashboard}
            element={<BookingDashboard />}
          />
        </Routes>
      </React.Fragment>
    </div>
  );
};
