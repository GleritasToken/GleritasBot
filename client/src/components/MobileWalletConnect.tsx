import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { X, Wallet, ExternalLink } from 'lucide-react';
import { SiCoinbase, SiBinance } from 'react-icons/si';
import { Wallet as WalletIcon } from 'lucide-react';

interface MobileWalletConnectProps {
  onConnect: (address: string) => void;
  onCancel: () => void;
}

export default function MobileWalletConnect({ onConnect, onCancel }: MobileWalletConnectProps) {
  // Detect installed wallets
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // Handle wallet connection
  const connectWallet = async (walletType: string) => {
    try {
      // Different connection methods for different wallets
      let walletAddress = null;
      
      if (walletType === 'metamask' && window.ethereum?.isMetaMask) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        walletAddress = accounts[0];
      } else if (walletType === 'trustwallet' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        walletAddress = accounts[0];
      } else if (walletType === 'binance' && window.BinanceChain) {
        const accounts = await window.BinanceChain.request({ method: 'eth_requestAccounts' });
        walletAddress = accounts[0];
      } else {
        // Handle other wallets or unsupported cases
        // Open external wallet app
        let deepLink = '';
        
        switch (walletType) {
          case 'metamask':
            deepLink = 'https://metamask.app.link/dapp/' + window.location.host;
            break;
          case 'trustwallet':
            deepLink = 'https://link.trustwallet.com/open_url?url=' + window.location.href;
            break;
          case 'binance':
            deepLink = 'https://link.binance.wallet/dapp/' + window.location.host;
            break;
          case 'coinbase':
            deepLink = 'https://go.cb-w.com/dapp?cb_url=' + encodeURIComponent(window.location.href);
            break;
          default:
            alert('Wallet not installed or not supported');
            return;
        }
        
        // Open the deep link
        window.open(deepLink, '_blank');
        return;
      }
      
      if (walletAddress) {
        onConnect(walletAddress);
      } else {
        alert('Could not connect to wallet. Please try again.');
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      alert('Error connecting to wallet. Please try again.');
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
          Connect Your Wallet
        </CardTitle>
        <CardDescription className="text-gray-400">
          Select a wallet to connect to the BSC network
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <p className="text-sm text-gray-300 mb-4">
          Connect your BSC wallet to receive your GLRS tokens when the airdrop distribution begins.
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={() => connectWallet('metamask')}
            variant="outline"
            className="flex flex-col items-center justify-center h-24 border-[#2a4365] hover:border-blue-500 bg-[#243b5c] hover:bg-[#243b5c]"
          >
            <WalletIcon className="h-8 w-8 mb-2 text-orange-500" />
            <span className="text-sm font-medium">MetaMask</span>
          </Button>
          
          <Button 
            onClick={() => connectWallet('trustwallet')}
            variant="outline"
            className="flex flex-col items-center justify-center h-24 border-[#2a4365] hover:border-blue-500 bg-[#243b5c] hover:bg-[#243b5c]"
          >
            <WalletIcon className="h-8 w-8 mb-2 text-blue-500" />
            <span className="text-sm font-medium">Trust Wallet</span>
          </Button>
          
          <Button 
            onClick={() => connectWallet('binance')}
            variant="outline"
            className="flex flex-col items-center justify-center h-24 border-[#2a4365] hover:border-blue-500 bg-[#243b5c] hover:bg-[#243b5c]"
          >
            <SiBinance className="h-8 w-8 mb-2 text-yellow-500" />
            <span className="text-sm font-medium">Binance Wallet</span>
          </Button>
          
          <Button 
            onClick={() => connectWallet('coinbase')}
            variant="outline"
            className="flex flex-col items-center justify-center h-24 border-[#2a4365] hover:border-blue-500 bg-[#243b5c] hover:bg-[#243b5c]"
          >
            <SiCoinbase className="h-8 w-8 mb-2 text-blue-600" />
            <span className="text-sm font-medium">Coinbase Wallet</span>
          </Button>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center">
            <ExternalLink className="h-3 w-3 mr-1" />
            Opens in crypto wallet app on mobile devices
          </p>
        </div>
      </CardContent>
    </Card>
  );
}