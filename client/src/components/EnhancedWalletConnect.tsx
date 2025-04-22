import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SiMeta } from "react-icons/si";
import { FaWallet } from "react-icons/fa";
import { isTelegramMiniApp, TelegramMiniAppWebApp } from "@/lib/telegram-app";
import { ethers } from "ethers";
import { isValidAddress, WALLET_DEEP_LINKS, WALLET_STORE_LINKS } from "@/lib/wallet-utils";

// BSC Token Contract
const TOKEN_ADDRESS = "0x7c427B65ebA206026A055B04c6086AC9af40B1B4";
const TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

interface WalletConnectionProps {
  onWalletConnected?: (address: string) => void;
  isConnecting?: boolean;
  showCard?: boolean;
}

export default function EnhancedWalletConnect({ 
  onWalletConnected, 
  isConnecting = false,
  showCard = true
}: WalletConnectionProps) {
  const [connecting, setConnecting] = useState<boolean>(isConnecting);
  const { toast } = useToast();

  const connectWallet = async (walletType: 'metamask' | 'trustwallet') => {
    setConnecting(true);
    
    try {
      // Detect device OS
      const isAndroid = /Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      // Choose the appropriate deep link based on device
      const deepLink = isAndroid 
        ? WALLET_DEEP_LINKS[walletType].android 
        : WALLET_DEEP_LINKS[walletType].ios;
      
      // Store links if wallet not installed
      const storeLink = isAndroid
        ? WALLET_STORE_LINKS[walletType].android
        : WALLET_STORE_LINKS[walletType].ios;
      
      // Check if we're in a Telegram Mini App - SIMPLIFIED APPROACH
      if (isTelegramMiniApp()) {
        console.log(`Opening ${walletType} via Telegram WebApp with deep link: ${deepLink}`);
        
        // DIRECT APPROACH: Just open the wallet link immediately
        if (TelegramMiniAppWebApp?.openLink) {
          TelegramMiniAppWebApp.openLink(deepLink);
        } else {
          // Fallback if Telegram's openLink is not available
          window.location.href = deepLink;
        }
        
        // Don't try to handle the connection here - wait for the user to come back with wallet
        setTimeout(() => {
          setConnecting(false);
          
          // When user returns, they'll need to manually click "Submit" on the wallet address
          toast({
            title: "Wallet Opening",
            description: "If your wallet opened, please connect your wallet and return to this app.",
          });
        }, 1500);
        
        return; // Exit early - don't try to auto-detect connection
      } else if (isAndroid || isIOS) {
        // For mobile devices not in Telegram, just open the wallet directly
        console.log(`Opening ${walletType} app with deep link for mobile browser: ${deepLink}`);
        window.location.href = deepLink;
        
        // Set timeout to provide feedback
        setTimeout(() => {
          setConnecting(false);
          toast({
            title: "Wallet Opening",
            description: "If your wallet opened, please connect your wallet and return to this app.",
          });
        }, 1500);
        
        return;
      } else if (!window.ethereum) {
        // Desktop browser without extension
        toast({
          title: "Wallet Not Found",
          description: `Please install ${walletType === 'metamask' ? 'MetaMask' : 'Trust Wallet'} extension or app first.`,
          variant: "destructive",
        });
        setConnecting(false);
        return;
      }
      
      // Desktop browser with ethereum provider - standard connection
      try {
        // @ts-ignore
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x38',
            chainName: 'Binance Smart Chain',
            nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
            rpcUrls: ['https://bsc-dataseed.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/']
          }]
        });
        
        // @ts-ignore
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const walletAddress = accounts[0];
        
        if (!isValidAddress(walletAddress)) {
          throw new Error("Invalid wallet address format");
        }
        
        // Save the wallet address to the user account
        const response = await apiRequest("POST", "/api/wallet", { 
          walletAddress,
          captchaToken: "demo-token" // In a real app, use a real captcha
        });
        
        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
          
          toast({
            title: "Wallet Connected",
            description: `Your wallet has been connected successfully!`,
          });
          
          if (onWalletConnected) {
            onWalletConnected(walletAddress);
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to connect wallet");
        }
      } catch (error: any) {
        console.error("Wallet connection error:", error);
        toast({
          title: "Connection Failed",
          description: error.message || "Failed to connect your wallet. Please try again.",
          variant: "destructive",
        });
      } finally {
        setConnecting(false);
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect your wallet. Please try again.",
        variant: "destructive",
      });
      setConnecting(false);
    }
  };

  if (!showCard) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <Button 
          variant="outline" 
          className="flex items-center justify-center gap-2 w-full" 
          onClick={() => connectWallet('metamask')}
          disabled={connecting}
        >
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SiMeta className="h-5 w-5 text-orange-500" />}
          Connect MetaMask
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center justify-center gap-2 w-full" 
          onClick={() => connectWallet('trustwallet')}
          disabled={connecting}
        >
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FaWallet className="h-5 w-5 text-blue-500" />}
          Connect Trust Wallet
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>Connect Wallet</CardTitle>
        <CardDescription>
          Connect your BSC wallet to receive GLRS Points when qualifying activities are completed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 w-full" 
            onClick={() => connectWallet('metamask')}
            disabled={connecting}
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SiMeta className="h-5 w-5 text-orange-500" />}
            Connect MetaMask
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 w-full" 
            onClick={() => connectWallet('trustwallet')}
            disabled={connecting}
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FaWallet className="h-5 w-5 text-blue-500" />}
            Connect Trust Wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}