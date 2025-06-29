import { Route, Routes } from "react-router-dom";

import LandingPage from "./pages/landing.tsx";
import AboutPage from "./pages/about.tsx";
import PricingPage from "./pages/pricing.tsx";
import LoginPage from "./pages/login.tsx";
import HomePage from "./pages/home.tsx";
import ProtectedRoute from "./components/protected-route.tsx";

function App() {
  return (
    <>
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
