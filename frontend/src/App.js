import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/index.css";
import "@/App.css";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import { I18nProvider } from "@/context/I18nContext";
import { DisasterProvider } from "@/context/DisasterContext";
import AppShell from "@/components/AppShell";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import LandingPage from "@/pages/Landing";
import AdminDashboardPage from "@/pages/AdminDashboard";
import VolunteerDashboardPage from "@/pages/VolunteerDashboard";
import UserDashboardPage from "@/pages/UserDashboard";
import NeedsPage from "@/pages/Needs";
import NewNeedPage from "@/pages/NewNeed";
import NeedDetail from "@/pages/NeedDetail";
import VolunteersPage from "@/pages/Volunteers";
import ResourcesPage from "@/pages/Resources";
import MapPage from "@/pages/MapView";
import AnalyticsPage from "@/pages/Analytics";
import CitizenPage from "@/pages/Citizen";
import MissionsPage from "@/pages/Missions";
import VolunteerDetailPage from "@/pages/VolunteersDetail";
import ProfileSettingsPage from "@/pages/ProfileSettings";
import { getDashboardPathForRole } from "@/lib/roleRoutes";

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 font-mono">LOADING…</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPathForRole(user.role)} replace />;
  }

  return <AppShell>{children}</AppShell>;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={getDashboardPathForRole(user?.role)} replace />;
};

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <WebSocketProvider>
          <DisasterProvider>
            <BrowserRouter>
              <a href="#main-content" className="skip-link">Skip to Operational Content</a>
              <Toaster position="top-right" theme="light" />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/citizen" element={<CitizenPage />} />
                <Route path="/dashboard" element={<PrivateRoute><DashboardRedirect /></PrivateRoute>} />
                <Route path="/dashboard/admin" element={<PrivateRoute allowedRoles={["admin"]}><AdminDashboardPage /></PrivateRoute>} />
                <Route path="/dashboard/volunteer" element={<PrivateRoute allowedRoles={["volunteer", "admin"]}><VolunteerDashboardPage /></PrivateRoute>} />
                <Route path="/dashboard/user" element={<PrivateRoute allowedRoles={["user", "admin"]}><UserDashboardPage /></PrivateRoute>} />
                <Route path="/needs" element={<PrivateRoute allowedRoles={["user", "volunteer", "admin"]}><NeedsPage /></PrivateRoute>} />
                <Route path="/needs/new" element={<PrivateRoute allowedRoles={["user", "volunteer", "admin"]}><NewNeedPage /></PrivateRoute>} />
                <Route path="/needs/:id" element={<PrivateRoute allowedRoles={["user", "volunteer", "admin"]}><NeedDetail /></PrivateRoute>} />
                <Route path="/volunteers" element={<PrivateRoute allowedRoles={["volunteer", "admin"]}><VolunteersPage /></PrivateRoute>} />
                <Route path="/volunteers/:id" element={<PrivateRoute allowedRoles={["admin", "volunteer"]}><VolunteerDetailPage /></PrivateRoute>} />
                <Route path="/resources" element={<PrivateRoute allowedRoles={["admin", "volunteer"]}><ResourcesPage /></PrivateRoute>} />
                <Route path="/map" element={<PrivateRoute allowedRoles={["admin", "volunteer"]}><MapPage /></PrivateRoute>} />
                <Route path="/analytics" element={<PrivateRoute allowedRoles={["admin"]}><AnalyticsPage /></PrivateRoute>} />
                <Route path="/missions" element={<PrivateRoute allowedRoles={["admin", "volunteer"]}><MissionsPage /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute allowedRoles={["admin", "volunteer", "user"]}><ProfileSettingsPage /></PrivateRoute>} />
              </Routes>
            </BrowserRouter>
          </DisasterProvider>
        </WebSocketProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
