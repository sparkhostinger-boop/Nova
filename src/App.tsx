/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ServerList from "./pages/ServerList";
import CreateServer from "./pages/CreateServer";
import ServerView from "./pages/ServerView";
import SettingsPage from "./pages/SettingsPage";
import AdminCustomization from "./pages/AdminCustomization";
import ApiKeysPage from "./pages/ApiKeysPage";
import AdminServers from "./pages/AdminServers";
import PlayitTunnel from "./pages/PlayitTunnel";
import Nodes from "./pages/Nodes";
import UsersList from "./pages/UsersList";
import AdminBackups from "./pages/AdminBackups";
import AdminOptions from "./pages/AdminOptions";
import AdminAddons from "./pages/AdminAddons";
import Layout from "./components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { GlobalBackground } from "./components/GlobalBackground";
import { SystemUpdateListener } from "./components/SystemUpdateListener";
import { TutorialOverlay } from "./components/TutorialOverlay";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-transparent text-foreground">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
      />
    </div>
  );
  if (!user) return <Navigate to="/register" />;
  if (user.role !== "admin" && user.role !== "owner") return <Navigate to="/" />;
  return <Layout>{children}</Layout>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-transparent text-foreground">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full"
      />
    </div>
  );
  if (!user) return <Navigate to="/register" />;
  return <Layout>{children}</Layout>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={location.pathname.split("/")[1]} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="h-full w-full flex flex-col"
      >
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><ServerList /></ProtectedRoute>} />
          <Route path="/servers" element={<ProtectedRoute><ServerList /></ProtectedRoute>} />
          <Route path="/nodes" element={<AdminRoute><Nodes /></AdminRoute>} />
          <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/servers/create" element={<AdminRoute><CreateServer /></AdminRoute>} />
          <Route path="/servers/:id/*" element={<ProtectedRoute><ServerView /></ProtectedRoute>} />
          <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
          <Route path="/api-keys" element={<AdminRoute><ApiKeysPage /></AdminRoute>} />
          <Route path="/users" element={<AdminRoute><UsersList /></AdminRoute>} />
          <Route path="/admin/servers" element={<AdminRoute><AdminServers /></AdminRoute>} />
          <Route path="/admin/options" element={<AdminRoute><AdminOptions /></AdminRoute>} />
          <Route path="/admin/customization" element={<AdminRoute><AdminCustomization /></AdminRoute>} />
          <Route path="/options" element={<AdminRoute><AdminOptions /></AdminRoute>} />
          <Route path="/admin/addons" element={<AdminRoute><AdminAddons /></AdminRoute>} />
          <Route path="/addons" element={<AdminRoute><AdminAddons /></AdminRoute>} />
          <Route path="/admin/backups" element={<AdminRoute><AdminBackups /></AdminRoute>} />
          <Route path="/backups" element={<AdminRoute><AdminBackups /></AdminRoute>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const TutorialManager = () => {
  const { panelName, enableTutorial } = useSettings();
  const [showTutorial, setShowTutorial] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // If the feature is globally disabled, do not show tutorial
    if (enableTutorial === false) {
      setShowTutorial(false);
      return;
    }

    if (loading || !user || location.pathname === '/login') return;

    const isDev = process.env.NODE_ENV === 'development';
    const tutorialKey = isDev ? `tutorialShown_dev_${user.id}` : `tutorialShown_prod_${user.id}`;
    
    const tutorialShown = isDev 
      ? sessionStorage.getItem(tutorialKey) 
      : localStorage.getItem(tutorialKey);

    if (!tutorialShown) {
      setShowTutorial(true);
    }
  }, [user, loading, location.pathname, enableTutorial]);

  const handleTutorialComplete = (skipped = false) => {
    if (!user) return;
    const isDev = process.env.NODE_ENV === 'development';
    const tutorialKey = isDev ? `tutorialShown_dev_${user.id}` : `tutorialShown_prod_${user.id}`;
    
    const stateValue = skipped ? 'skipped' : 'completed';

    if (isDev) {
      sessionStorage.setItem(tutorialKey, stateValue);
    } else {
      localStorage.setItem(tutorialKey, stateValue);
    }
    
    setShowTutorial(false);
  };

  if (!showTutorial) return null;

  return <TutorialOverlay onComplete={(skipped) => handleTutorialComplete(skipped)} panelName={panelName} />;
};

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <SystemUpdateListener />
        <GlobalBackground />
        <Router>
          <AnimatedRoutes />
          <TutorialManager />
        </Router>
      </AuthProvider>
    </SettingsProvider>
  );
}
