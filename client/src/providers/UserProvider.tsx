import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { connectWallet as connectWalletUtil } from '@/lib/wallet-utils';
import { getDeviceFingerprint } from '@/lib/utils';

interface UserTask {
  id: number;
  userId: number;
  taskName: string;
  completed: boolean;
  tokenAmount: number;
  verificationData: string | null;
  completedAt: string;
}

interface User {
  id: number;
  username: string;
  walletAddress: string | null;
  referralCode: string;
  referredBy: string | null;
  totalTokens: number;
  referralTokens: number;
  referralCount: number;
  ipAddress: string | null;
  fingerprint: string | null;
  createdAt: string;
  tasks?: UserTask[];
}

interface RegisterParams {
  username: string;
  walletAddress?: string;
  referredBy?: string;
  ipAddress?: string;
  fingerprint?: string;
  captchaToken: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  registerUser: (params: RegisterParams) => Promise<User>;
  refreshUser: () => Promise<void>;
  connectWallet: () => Promise<string | null>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: false,
  registerUser: async () => ({ id: 0 } as User),
  refreshUser: async () => {},
  connectWallet: async () => null,
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Fetch current user data
  const { data: user, isLoading, refetch } = useQuery({
    queryKey: ['/api/user'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/user', { credentials: 'include' });
        if (res.status === 401) return null;
        if (!res.ok) throw new Error('Failed to fetch user data');
        return await res.json();
      } catch (error) {
        console.error('Error fetching user:', error);
        return null;
      }
    },
    // Don't show errors for 401 responses (not logged in)
    retry: false,
    refetchOnWindowFocus: false,
    enabled: initialLoadDone,
  });

  // Initial setup
  useEffect(() => {
    // Mark initial load as done after a short delay
    // This prevents immediate 401 errors when the app first loads
    const timer = setTimeout(() => {
      setInitialLoadDone(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Register a new user
  const registerUser = async (params: RegisterParams): Promise<User> => {
    try {
      // Add device fingerprint if not provided
      if (!params.fingerprint) {
        params.fingerprint = getDeviceFingerprint();
      }
      
      const response = await apiRequest('POST', '/api/register', params);
      const data = await response.json();
      
      if (data.user) {
        // Update user data in cache
        queryClient.setQueryData(['/api/user'], data.user);
        
        toast({
          title: "Registration successful",
          description: "Welcome to the Gleritas Token Airdrop!",
        });
        
        return data.user;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "There was an error during registration",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    await refetch();
  };

  // Connect wallet
  const connectWallet = async (): Promise<string | null> => {
    try {
      const walletAddress = await connectWalletUtil();
      
      if (walletAddress && user) {
        // If user is logged in, update their wallet address
        await apiRequest('POST', '/api/wallet', {
          walletAddress,
          captchaToken: 'direct-wallet-connection', // Special token for direct connections
        });
        
        // Refresh user data
        await refreshUser();
        
        toast({
          title: "Wallet connected",
          description: "Your wallet has been successfully connected.",
        });
      }
      
      return walletAddress;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Wallet connection failed",
        description: error.message || "Could not connect to wallet",
        variant: "destructive",
      });
      return null;
    }
  };

  const value = {
    user: user || null,
    isLoading,
    registerUser,
    refreshUser,
    connectWallet,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
