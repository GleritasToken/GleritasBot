import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/auth-page";
// Theme provider removed - using fixed dark theme
import { UserProvider } from "@/providers/UserProvider";
import { TelegramProvider, useTelegram } from "@/providers/TelegramProvider";
import { ProtectedRoute } from "./lib/protected-route";
import { useEffect, useState } from "react";
import { telegramWebAppReady } from "@/lib/telegram-app";
import { useToast } from "@/hooks/use-toast";

// This function is used only for development when testing the Telegram WebApp
function setupTelegramMock() {
  if (typeof window !== 'undefined' && !window.Telegram) {
    console.log("Creating mock Telegram WebApp for development testing");
    
    // Create a minimal mock of the Telegram WebApp
    window.Telegram = {
      WebApp: {
        initData: "mock_init_data",
        initDataUnsafe: { 
          query_id: "mock_query_id",
          user: { 
            id: 12345, 
            username: "test_user",
            first_name: "Test",
            language_code: "en" // Required for the mock to work correctly
          },
          auth_date: Math.floor(Date.now() / 1000),
          hash: "mock_hash"
        },
        ready: () => console.log("Telegram WebApp mock ready called"),
        expand: () => console.log("Telegram WebApp mock expand called"),
        close: () => console.log("Telegram WebApp mock close called"),
        BackButton: {
          isVisible: false,
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

// Component for auto-login from Telegram
function TelegramAutoLogin() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { isTelegram, telegramUser } = useTelegram();
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check URL for user ID parameter
  useEffect(() => {
    const handleAutoLogin = async () => {
      if (isProcessing) return;
      
      try {
        setIsProcessing(true);
        
        // Get user ID from URL
        const params = new URLSearchParams(window.location.search);
        const userIdParam = params.get('user');
        
        if (!userIdParam) {
          console.log("No user ID parameter found in URL");
          return;
        }
        
        console.log("Found user ID in URL:", userIdParam);
        
        // Try to login with the user ID
        const response = await fetch('/api/telegram/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: userIdParam }),
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            console.log("Auto-login successful:", data.user.username);
            
            // Update user data in the cache
            queryClient.setQueryData(['/api/user'], data.user);
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
            
            toast({
              title: "Welcome!",
              description: `Logged in as ${data.user.username}`,
            });
            
            // Redirect to dashboard
            setLocation('/');
          } else {
            console.error("Auto-login failed:", data.message);
          }
        } else {
          console.error("Auto-login request failed:", response.status);
        }
      } catch (error) {
        console.error("Error during auto-login:", error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    // Run auto-login if we're in Telegram or have a user parameter
    const params = new URLSearchParams(window.location.search);
    if ((isTelegram || params.has('user')) && !isProcessing) {
      handleAutoLogin();
    }
  }, [isTelegram, telegramUser, isProcessing, queryClient, toast, setLocation]);
  
  return null;
}

function Router() {
  return (
    <>
      <TelegramAutoLogin />
      <Switch>
        <ProtectedRoute path="/" component={Dashboard} />
        <Route path="/landing" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TelegramProvider>
        <UserProvider>
          <TooltipProvider>
            <TelegramAppInitializer />
            <Toaster />
            <Router />
          </TooltipProvider>
        </UserProvider>
      </TelegramProvider>
    </QueryClientProvider>
  );
}

export default App;
