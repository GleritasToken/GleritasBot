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
          console.log("This is a Telegram WebApp, getting WebApp instance");
          
          // Get the WebApp instance
          const app = getTelegramWebApp();
          console.log("WebApp instance:", app ? "Obtained successfully" : "Failed to obtain");
          setWebApp(app);
          
          if (app) {
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
              console.error("Could not validate Telegram account");
              toast({
                title: "Telegram User Error",
                description: "Could not validate your Telegram account.",
                variant: "destructive",
              });
            }
          } else {
            console.error("WebApp instance is null despite isTelegramApp being true");
            toast({
              title: "Telegram Error",
              description: "Failed to load Telegram mini app. Please try again.",
              variant: "destructive",
            });
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