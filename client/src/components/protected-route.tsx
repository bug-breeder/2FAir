import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@heroui/react";

import { useAuth } from "../providers/auth-provider";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Store the current location when user tries to access protected route
    if (!isAuthenticated && !isLoading) {
      sessionStorage.setItem("redirectAfterLogin", location.pathname);
    }
  }, [isAuthenticated, isLoading, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
