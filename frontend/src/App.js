import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@/index.css";
import "@/App.css";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";
import { DisasterProvider } from "@/context/DisasterContext";
import AppShell from "@/components/AppShell";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import LandingPage from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import NeedsPage from "@/pages/Needs";
import NewNeedPage from "@/pages/NewNeed";
import NeedDetail from "@/pages/NeedDetail";
import VolunteersPage from "@/pages/Volunteers";
import ResourcesPage from "@/pages/Resources";
import MapPage from "@/pages/MapView";
import AnalyticsPage from "@/pages/Analytics";
import CitizenPage from "@/pages/Citizen";
import MissionsPage from "@/pages/Missions";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 font-mono">LOADING…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
};

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <DisasterProvider>
          <BrowserRouter>
            <Toaster position="top-right" theme="light" />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/citizen" element={<CitizenPage />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/needs" element={<PrivateRoute><NeedsPage /></PrivateRoute>} />
              <Route path="/needs/new" element={<PrivateRoute><NewNeedPage /></PrivateRoute>} />
              <Route path="/needs/:id" element={<PrivateRoute><NeedDetail /></PrivateRoute>} />
              <Route path="/volunteers" element={<PrivateRoute><VolunteersPage /></PrivateRoute>} />
              <Route path="/resources" element={<PrivateRoute><ResourcesPage /></PrivateRoute>} />
              <Route path="/map" element={<PrivateRoute><MapPage /></PrivateRoute>} />
              <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />
              <Route path="/missions" element={<PrivateRoute><MissionsPage /></PrivateRoute>} />
            </Routes>
          </BrowserRouter>
        </DisasterProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
