import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { VaultGate } from "./components/vault-gate";
import HomePage from "./pages/home";
import SettingsPage from "./pages/settings";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <VaultGate>
      <ScrollToTop />
      <Routes>
        <Route element={<HomePage />} path="/" />
        <Route element={<SettingsPage />} path="/settings" />
        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </VaultGate>
  );
}

export default App;
