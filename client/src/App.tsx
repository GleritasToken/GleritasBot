import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/auth-page";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { UserProvider } from "@/providers/UserProvider";
import { TelegramProvider } from "@/providers/TelegramProvider";
import { ProtectedRoute } from "./lib/protected-route";
import { useEffect } from "react";
import { telegramWebAppReady } from "@/lib/telegram-app";

function TelegramAppInitializer() {
  useEffect(() => {
    // Let Telegram know the app is ready
    telegramWebAppReady();
  }, []);
  
  return null;
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <Route path="/landing" component={Landing} />
      <Route path="/auth" component={AuthPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TelegramProvider>
          <UserProvider>
            <TooltipProvider>
              <TelegramAppInitializer />
              <Toaster />
              <Router />
            </TooltipProvider>
          </UserProvider>
        </TelegramProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
