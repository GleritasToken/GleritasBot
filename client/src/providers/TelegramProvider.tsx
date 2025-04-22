import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import {
  isTelegramWebApp,
  getTelegramWebApp,
  validateTelegramUser,
  telegramWebAppReady
} from '@/lib/telegram-app';
import { useToast } from '@/hooks/use-toast';

interface TelegramUser {
  id: number;
  username: string;
  telegramId: number;
  walletAddress: string | null;
  referralCode: string;
  totalTokens: number;
  referralTokens: number;
  referralCount: number;
  tasks?: { 
    id: number;
    userId: number;
    taskName: string;
    completed: boolean;
    tokenAmount: number;
    verificationData: string | null;
    completedAt: string;
  }[];
}

interface TelegramContextType {
  isTelegram: boolean;
  isLoading: boolean;
  telegramUser: TelegramUser | null;
  webApp: any | null;
}

const TelegramContext = createContext<TelegramContextType | null>(null);

export const TelegramProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTelegram, setIsTelegram] = useState<boolean>(false);
  const [webApp, setWebApp] = useState<any | null>(null);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const initTelegram = async () => {
      try {
        console.log("Starting Telegram initialization...");
        
        // Check if this is a Telegram WebApp
        const isTelegramApp = isTelegramWebApp();
        console.log("Is this a Telegram WebApp?", isTelegramApp);
        setIsTelegram(isTelegramApp);
        
        if (isTelegramApp) {
          console.log("This is a Telegram WebApp environment");
          
          // Get the WebApp instance
          const app = getTelegramWebApp();
          console.log("WebApp instance:", app ? "Obtained successfully" : "Failed to obtain");
          
          // Even if we don't have the WebApp instance, we might still be in a Telegram WebApp
          // In some environments, the Telegram object might be injected after our code runs
          setWebApp(app);
          
          // Attempt to get window.Telegram or handle the case where it's not available yet
          // Some Telegram clients might inject this object after our code runs
          if (typeof window !== 'undefined' && !window.Telegram) {
            console.log("window.Telegram not available yet, setting up observer");
            
            // Set up a timer to check for Telegram object every 500ms
            const intervalId = setInterval(() => {
              if (window.Telegram?.WebApp) {
                console.log("Telegram WebApp object detected via polling");
                clearInterval(intervalId);
                setWebApp(window.Telegram.WebApp);
                handleTelegramWebApp(window.Telegram.WebApp);
              }
            }, 500);
            
            // Clear interval after 10 seconds to prevent endless polling
            setTimeout(() => clearInterval(intervalId), 10000);
          } else if (app) {
            await handleTelegramWebApp(app);
          } else {
            // For testing: Try to proceed without the Telegram WebApp object
            console.log("Proceeding without Telegram WebApp object");
            
            // We're in Telegram environment but can't get the WebApp object
            // This might be due to iframe restrictions or other issues
            // Let's try to extract user data from URL parameters as a fallback
            const urlParams = new URLSearchParams(window.location.search);
            const userParam = urlParams.get('user');
            
            if (userParam) {
              console.log("Found user parameter in URL:", userParam);
              try {
                // Try to get user data from server
                const response = await fetch(`/api/telegram/user/${userParam}`);
                if (response.ok) {
                  const userData = await response.json();
                  if (userData.success && userData.user) {
                    console.log("Retrieved user data from parameter:", userData.user.username);
                    setTelegramUser(userData.user);
                  }
                }
              } catch (error) {
                console.error("Error getting user data from parameter:", error);
              }
            }
          }
        } else {
          console.log("Not running in Telegram WebApp environment");
        }
      } catch (error) {
        console.error('Error initializing Telegram:', error);
        toast({
          title: "Error",
          description: "Failed to initialize Telegram WebApp.",
          variant: "destructive",
        });
      } finally {
        console.log("Telegram initialization complete, setting isLoading to false");
        setIsLoading(false);
      }
    };

    // Helper function to handle Telegram WebApp object
    const handleTelegramWebApp = async (app: any) => {
      try {
        console.log("WebApp available properties:", Object.keys(app));
        console.log("WebApp initData available:", !!app.initData);
        console.log("WebApp initDataUnsafe available:", !!app.initDataUnsafe);
        
        // Let Telegram know the app is ready
        console.log("Calling telegramWebAppReady()");
        telegramWebAppReady();
        
        // Get user data from Telegram
        console.log("Validating Telegram user...");
        const user = await validateTelegramUser();
        console.log("Validation result:", user ? "User obtained" : "No user data");
        
        if (user) {
          console.log("Setting Telegram user:", user.username);
          setTelegramUser(user);
        } else {
          console.log("Could not validate Telegram account, looking for URL parameters");
          
          // Try to get user data from URL parameters as fallback
          const urlParams = new URLSearchParams(window.location.search);
          const userParam = urlParams.get('user');
          
          if (userParam) {
            try {
              const response = await fetch(`/api/telegram/user/${userParam}`);
              if (response.ok) {
                const userData = await response.json();
                if (userData.success && userData.user) {
                  setTelegramUser(userData.user);
                }
              }
            } catch (error) {
              console.error("Error getting user data from parameter:", error);
            }
          } else {
            console.warn("No user information available");
          }
        }
      } catch (error) {
        console.error("Error handling Telegram WebApp:", error);
      }
    };

    initTelegram();
  }, [toast]);

  return (
    <TelegramContext.Provider
      value={{
        isTelegram,
        isLoading,
        telegramUser,
        webApp
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
};