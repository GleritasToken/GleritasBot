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
        // Check if this is a Telegram WebApp
        const isTelegramApp = isTelegramWebApp();
        setIsTelegram(isTelegramApp);
        
        if (isTelegramApp) {
          // Get the WebApp instance
          const app = getTelegramWebApp();
          setWebApp(app);
          
          // Let Telegram know the app is ready
          telegramWebAppReady();
          
          // Get user data from Telegram
          const user = await validateTelegramUser();
          if (user) {
            setTelegramUser(user);
          } else {
            toast({
              title: "Telegram User Error",
              description: "Could not validate your Telegram account.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error initializing Telegram:', error);
        toast({
          title: "Error",
          description: "Failed to initialize Telegram WebApp.",
          variant: "destructive",
        });
      } finally {
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