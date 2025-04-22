import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { X, ExternalLink, AlertCircle, Wallet } from 'lucide-react';
import { SiMeta } from 'react-icons/si';
import { FaWallet } from 'react-icons/fa';

interface MobileWalletConnectProps {
  onConnect: (address: string) => void;
  onCancel: () => void;
}

export default function MobileWalletConnect({ onConnect, onCancel }: MobileWalletConnectProps) {
  // Detect installed wallets
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [installedWallets, setInstalledWallets] = useState<{[key: string]: boolean}>({
    metamask: false,
    trustwallet: false
  });
  
  // Check for installed wallets
  useEffect(() => {
    const checkWallets = async () => {
      const installed = {
        metamask: !!window.ethereum?.isMetaMask,
        trustwallet: !!(window.ethereum?.isTrust || window.trustwallet)
      };
      
      setInstalledWallets(installed);
    };
    
    checkWallets();
  }, []);
  
  // Enhanced wallet connection
  const connectWallet = async (walletType: string) => {
    setConnecting(walletType);
    setError(null);
    
    try {
      // Different connection methods for different wallets
      let walletAddress = null;
      let deepLink = '';
      
      switch (walletType) {
        case 'metamask':
          if (window.ethereum?.isMetaMask) {
            try {
              const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
              walletAddress = accounts[0];
            } catch (err) {
              console.error('MetaMask connection error:', err);
              setError('Could not connect to MetaMask. Please try again.');
            }
          } else {
            // Format for MetaMask deep link - use the app.link format without https://
            deepLink = `https://metamask.app.link/dapp/${window.location.host.replace('https://', '')}${window.location.pathname}`;
            // Open in a new tab first (to avoid navigation issues)
            window.open(deepLink, '_blank');
            
            // Try direct app protocol for mobile
            setTimeout(() => {
              const directProtocol = `ethereum:${window.location.href}`;
              window.location.href = directProtocol;
            }, 100);
            
            return;
          }
          break;
          
        case 'trustwallet':
          if (window.ethereum?.isTrust || window.trustwallet) {
            try {
              const provider = window.trustwallet?.ethereum || window.ethereum;
              if (provider) {
                const accounts = await provider.request({ method: 'eth_requestAccounts' });
                walletAddress = accounts[0];
              }
            } catch (err) {
              console.error('Trust Wallet connection error:', err);
              setError('Could not connect to Trust Wallet. Please try again.');
            }
          } else {
            // Updated universal link format for Trust Wallet
            deepLink = `https://link.trustwallet.com/open_url?coin_id=56&url=${encodeURIComponent(window.location.href)}`;
            
            // Open in a new tab first (to avoid navigation issues)
            window.open(deepLink, '_blank');
            
            // Try direct app protocol for mobile
            setTimeout(() => {
              // More specific protocol with URL for better compatibility
              const directProtocol = `trust://open_url?coin_id=56&url=${encodeURIComponent(window.location.href)}`;
              window.location.href = directProtocol;
            }, 100);
            
            return;
          }
          break;
          
        // Removed Binance and Coinbase wallet options as per requirements
      }
      
      if (walletAddress) {
        onConnect(walletAddress);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Could not connect to wallet. Please try again.');
    } finally {
      setConnecting(null);
    }
  };

  return (
    <Card className="w-full max-w-md bg-[#1c3252] border-[#2a4365]">
      <CardHeader className="bg-[#172a41] border-b border-[#2a4365] relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-gray-400 hover:text-white hover:bg-transparent"
          onClick={onCancel}
        >
          <X className="h-5 w-5" />
        </Button>
        <CardTitle className="text-lg flex items-center">
          <Wallet className="h-5 w-5 mr-2 text-amber-400" />
          Connect Your BSC Wallet
        </CardTitle>
        <CardDescription className="text-gray-400">
          Select a wallet to connect to the Binance Smart Chain
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <p className="text-sm text-gray-300 mb-4">
          Connect your BSC wallet to receive your GLRS tokens when the airdrop distribution begins.
        </p>
        
        {error && (
          <div className="bg-red-900/30 p-3 rounded-md text-sm border border-red-700 text-red-200 flex items-start mb-4">
            <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => connectWallet('metamask')}
            variant="outline"
            disabled={connecting !== null}
            className="flex flex-col items-center justify-center h-24 border-[#2a4365] hover:border-orange-500 bg-[#243b5c] hover:bg-[#243b5c] relative overflow-hidden"
          >
            {connecting === 'metamask' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#243b5c]">
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <SiMeta className="h-8 w-8 mb-2 text-orange-500" />
                <span className="text-sm font-medium">MetaMask</span>
                {installedWallets.metamask && (
                  <span className="absolute top-2 right-2 bg-green-500 rounded-full w-2 h-2"></span>
                )}
              </>
            )}
          </Button>
          
          <Button 
            onClick={() => connectWallet('trustwallet')}
            variant="outline"
            disabled={connecting !== null}
            className="flex flex-col items-center justify-center h-24 border-[#2a4365] hover:border-blue-500 bg-[#243b5c] hover:bg-[#243b5c] relative overflow-hidden"
          >
            {connecting === 'trustwallet' ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[#243b5c]">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <>
                <FaWallet className="h-8 w-8 mb-2 text-blue-500" />
                <span className="text-sm font-medium">Trust Wallet</span>
                {installedWallets.trustwallet && (
                  <span className="absolute top-2 right-2 bg-green-500 rounded-full w-2 h-2"></span>
                )}
              </>
            )}
          </Button>
        </div>
        
        {isMobile && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center bg-[#172a41] p-2 rounded-md">
              <ExternalLink className="h-3 w-3 mr-1 flex-shrink-0" />
              <span>Will automatically open installed crypto wallet apps on your device</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Add type declarations for various wallet providers
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      selectedAddress?: string;
      isMetaMask?: boolean;
      isTrust?: boolean;
      isCoinbaseWallet?: boolean;
    };
    web3?: {
      currentProvider: any;
      eth?: {
        accounts: string[];
        getAccounts(callback: (error: Error, accounts: string[]) => void): void;
        request?(args: { method: string; params?: any[] }): Promise<any>;
      };
    };
    BinanceChain?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on?: (event: string, callback: (accounts: string[]) => void) => void;
    };
    trustwallet?: {
      ethereum: {
        request: (args: { method: string; params?: any[] }) => Promise<any>;
        selectedAddress?: string;
      }
    };
  }
}