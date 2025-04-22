import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { SiMetamask, SiTrustwallet } from "react-icons/si";
import { isTelegramMiniApp, TelegramMiniAppWebApp } from "@/lib/telegram-app";
import { ethers } from "ethers";
import { isValidAddress } from "@/lib/wallet-utils";

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
      // Check if we're in a Telegram Mini App
      if (isTelegramMiniApp()) {
        const miniAppUrl = window.location.origin;
        const encodedUrl = encodeURIComponent(miniAppUrl);
        
        const DEEP_LINKS = {
          metamask: `https://metamask.app.link/dapp/${encodedUrl}?chainId=56`,
          trustwallet: `https://link.trustwallet.com/open_url?coin=20000714&url=${encodedUrl}`
        };
        
        const FALLBACK_URLS = {
          metamask: "https://metamask.io/download.html",
          trustwallet: "https://trustwallet.com/download"
        };
        
        TelegramMiniAppWebApp?.openLink(DEEP_LINKS[walletType]);
        
        // Give the wallet time to connect
        setTimeout(async () => {
          // @ts-ignore
          if (!window.ethereum?.isConnected?.()) {
            TelegramMiniAppWebApp?.showConfirm(
              `${walletType === 'metamask' ? 'MetaMask' : 'Trust Wallet'} not detected! Install it first?`,
              (confirmed) => {
                if (confirmed) TelegramMiniAppWebApp?.openLink(FALLBACK_URLS[walletType]);
                setConnecting(false);
              }
            );
          } else {
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
              if (!accounts || accounts.length === 0) {
                throw new Error("No accounts found");
              }
              
              // @ts-ignore
              const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: ["Connect to GLRS Airdrop MiniApp", accounts[0]]
              });
              
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
          }
        }, 2000);
      } else {
        // Regular web browser connection logic
        // @ts-ignore
        if (!window.ethereum) {
          toast({
            title: "Wallet Not Found",
            description: `Please install ${walletType === 'metamask' ? 'MetaMask' : 'Trust Wallet'} extension or app first.`,
            variant: "destructive",
          });
          setConnecting(false);
          return;
        }
        
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
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SiMetamask className="h-5 w-5 text-orange-500" />}
          Connect MetaMask
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center justify-center gap-2 w-full" 
          onClick={() => connectWallet('trustwallet')}
          disabled={connecting}
        >
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SiTrustwallet className="h-5 w-5 text-blue-500" />}
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
          Connect your BSC wallet to receive GLRS tokens
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
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SiMetamask className="h-5 w-5 text-orange-500" />}
            Connect MetaMask
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 w-full" 
            onClick={() => connectWallet('trustwallet')}
            disabled={connecting}
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SiTrustwallet className="h-5 w-5 text-blue-500" />}
            Connect Trust Wallet
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}