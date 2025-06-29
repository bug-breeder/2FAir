import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";

import LandingPage from "./pages/landing.tsx";
import AboutPage from "./pages/about.tsx";
import PricingPage from "./pages/pricing.tsx";
import LoginPage from "./pages/login.tsx";
import HomePage from "./pages/home.tsx";
import ProtectedRoute from "./components/protected-route.tsx";

// Component to scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Landing Pages */}
        <Route element={<LandingPage />} path="/" />
        <Route element={<AboutPage />} path="/about" />
        <Route element={<PricingPage />} path="/pricing" />
        <Route element={<LoginPage />} path="/login" />

        {/* Protected App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
          path="/app"
        />
      </Routes>
    </>
  );
}

export default App;
