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

// This function is used only for development when testing the Telegram WebApp
function setupTelegramMock() {
  if (typeof window !== 'undefined' && !window.Telegram) {
    console.log("Creating mock Telegram WebApp for development testing");
    
    // Create a minimal mock of the Telegram WebApp
    window.Telegram = {
      WebApp: {
        initData: "mock_init_data",
        initDataUnsafe: { 
          user: { 
            id: 12345, 
            username: "test_user",
            first_name: "Test",
            language_code: "en" // Required for the mock to work correctly
          } 
        },
        ready: () => console.log("Telegram WebApp mock ready called"),
        expand: () => console.log("Telegram WebApp mock expand called"),
        close: () => console.log("Telegram WebApp mock close called"),
        BackButton: {
          show: () => console.log("Mock back button show"),
          hide: () => console.log("Mock back button hide"),
          onClick: (cb: () => void) => console.log("Mock back button onClick"),
          offClick: () => console.log("Mock back button offClick")
        }
      }
    };
  }
}

// We're not initializing Telegram here anymore since it's handled in TelegramProvider
function TelegramAppInitializer() {
  useEffect(() => {
    // Only in development and when requested, we could enable a mock
    if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('telegram_mock') === 'true') {
      setupTelegramMock();
    }
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
