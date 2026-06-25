import React from "react";
import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import AppRoutes from "./Routes";
import StarBackground from "./components/StarBackground";
import BottomNav from "./components/ui/BottomNav";
import FloatingChat from "./components/FloatingChat";
import ConfirmDialog from "./components/layout/ConfirmDialog";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
        {/* Background star field */}
        <StarBackground />

        {/* App content layered above background */}
        <div className="relative z-10 pb-16 md:pb-0">
          <Routes>
            <Route path="/" element={<Landing />} />
            {/* All other routes (must include /user-login, /user-signup, /user-registration) */}
            <Route path="/*" element={<AppRoutes />} />
          </Routes>
        </div>
        <FloatingChat />
        {/* Bottom navigation for small screens */}
        <BottomNav />
        {/* Global confirm dialog - used by feature modules */}
        <ConfirmDialog />
      </div>
    </ThemeProvider>
  );
}

export default App;
