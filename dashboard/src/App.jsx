import React, { useState } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AppDataProvider } from "./hooks/useAppData.js";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { Navbar } from "./components/Navbar.jsx";
import { Overview } from "./pages/Overview.jsx";
import { Feed } from "./pages/Feed.jsx";
import { Tokens } from "./pages/Tokens.jsx";
import { IncidentPage } from "./pages/IncidentPage.jsx";
import { Login } from "./pages/Login.jsx";
import { isAuthenticated } from "./utils/auth.js";

function LayoutShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Route-based titles
  let title = "Overview";
  let subtitle = "Threat intelligence telemetry & decoy trap network";

  if (location.pathname.startsWith("/feed")) {
    title = "Live Security Feed";
    subtitle = "Real-time attack telemetry and decoy hit stream";
  } else if (location.pathname.startsWith("/tokens")) {
    title = "Honeytoken Decoys";
    subtitle = "Deploy and manage fake credentials across your perimeter";
  } else if (location.pathname.startsWith("/incidents")) {
    title = "Forensic Incident Analysis";
    subtitle = "Attacker timeline, network reconnaissance, and AI threat profile";
  }

  return (
    <div className="flex h-screen bg-[#0B1220] text-[#E6EDF7] font-sans antialiased overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 h-full">
        <Navbar
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 overflow-y-auto focus:outline-none">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/tokens" element={<Tokens />} />
              <Route path="/incidents" element={<IncidentPage />} />
              <Route path="/incidents/:eventId" element={<IncidentPage />} />
              <Route path="*" element={<Overview />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={
          isAuthenticated()
            ? <AppDataProvider><LayoutShell /></AppDataProvider>
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
