import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { useUser } from '@/providers/UserProvider';
import { useTheme } from '@/providers/ThemeProvider';

const Header: React.FC = () => {
  const { user, connectWallet } = useUser();
  const { theme, setTheme } = useTheme();
  const [location, navigate] = useLocation();
  const [connecting, setConnecting] = useState(false);

  const handleConnectWallet = async () => {
    setConnecting(true);
    try {
      await connectWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <header className="bg-primary-600 dark:bg-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="rounded-full bg-white p-2 flex items-center justify-center">
            <Logo />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Gleritas</h1>
            <p className="text-primary-100 text-xs">Token Airdrop</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 mr-2" />
            ) : (
              <Moon className="h-4 w-4 mr-2" />
            )}
            <span className="hidden sm:inline">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </Button>
          <Button 
            variant="secondary"
            size="sm"
            className="bg-white text-primary-600 hover:bg-primary-50"
            onClick={handleConnectWallet}
            disabled={connecting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 mr-2"
            >
              <path d="M18 7c0-1.1-.9-2-2-2H6L2 9v8c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-2" />
              <path d="M14 4l-6 6" />
              <path d="M14 10V4h-6" />
            </svg>
            <span>
              {connecting 
                ? 'Connecting...' 
                : (user?.walletAddress 
                  ? user.walletAddress.slice(0, 6) + '...' + user.walletAddress.slice(-4) 
                  : 'Connect Wallet')
              }
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
