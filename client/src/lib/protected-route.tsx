import { useQuery } from "@tanstack/react-query";
import { Redirect, Route } from "wouter";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const [redirecting, setRedirecting] = useState(false);
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 5000 // Poll every 5 seconds to ensure we have the latest auth state
  });

  useEffect(() => {
    // Debug user state
    console.log("ProtectedRoute auth state:", { user, isLoading, error });
    
    // If we've confirmed there's no user, trigger redirection
    if (!isLoading && !user && !redirecting) {
      console.log("No user detected, redirecting to auth page");
      setRedirecting(true);
    }
  }, [user, isLoading, error, redirecting]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-2 text-primary">Checking authorization...</p>
        </div>
      </Route>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user || redirecting) {
    console.log("Redirecting to /auth page");
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // User is authenticated, render the component
  console.log("User authenticated, rendering protected component");
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}