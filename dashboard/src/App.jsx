import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppDataProvider } from "./hooks/useAppData.js";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { Sidebar } from "./components/Sidebar.jsx";
import { TopHeader } from "./components/TopHeader.jsx";
import { Overview } from "./pages/Overview.jsx";
import { Incidents } from "./pages/Incidents.jsx";
import { Tokens } from "./pages/Tokens.jsx";
import { Decoys } from "./pages/Decoys.jsx";
import { IncidentPage } from "./pages/IncidentPage.jsx";
import { Login } from "./pages/Login.jsx";
import { isAuthenticated } from "./utils/auth.js";

function LayoutShell() {
  return (
    <div className="flex h-screen bg-[#0e1014] text-[#E6EDF7] font-sans antialiased overflow-hidden">
      {/* Sleek Vertical Left Rail Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header with Atmospheric Glow, Breadcrumbs, Big Futuristic Title, Subnav, Search & Action */}
        <TopHeader />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto focus:outline-none">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Overview />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/feed" element={<Incidents />} />
              <Route path="/tokens" element={<Tokens />} />
              <Route path="/decoys" element={<Decoys />} />
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
        <Route
          path="*"
          element={
            isAuthenticated() ? (
              <AppDataProvider>
                <LayoutShell />
              </AppDataProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
