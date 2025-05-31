import { Route, Routes } from "react-router-dom";

import HomePage from "./pages/home.tsx";
import LoginPage from "./pages/login.tsx";
import ProtectedRoute from "./components/protected-route.tsx";

function App() {
  return (
    <>
      <Routes>
        <Route element={<LoginPage />} path="/login" />
        <Route
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
          path="/"
        />
      </Routes>
    </>
  );
}

export default App;
