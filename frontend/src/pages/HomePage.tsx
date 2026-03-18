import { Navigate } from "react-router-dom";
import { isAdministrator, useAuth } from "../lib/auth";

export function HomePage() {
  const { user } = useAuth();

  if (isAdministrator(user)) {
    return <Navigate to="/planning" replace />;
  }

  return <Navigate to="/production" replace />;
}
