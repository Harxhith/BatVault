
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { BatLogo } from "./BatLogo";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading && !currentUser) {
      navigate("/login");
    }
  }, [currentUser, loading, navigate]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-batman">
        <div className="animate-pulse text-batman-accent">
          <BatLogo className="h-16 w-16 mx-auto animate-glow" />
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }
  
  return currentUser ? <>{children}</> : null;
};
