import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SiMeta } from "react-icons/si";
import { FaWallet } from "react-icons/fa";
import { isTelegramMiniApp, TelegramMiniAppWebApp } from "@/lib/telegram-app";

// Deep links for direct wallet opening
const WALLET_LINKS = {
  metamask: {
    android: "intent://io.metamask#Intent;package=io.metamask;end;",
    ios: "metamask://"
  },
  trustwallet: {
    android: "intent://com.wallet.crypto.trustapp#Intent;package=com.wallet.crypto.trustapp;end;",
    ios: "trust://"
  }
};

// App store links for wallet installation
const STORE_LINKS = {
  metamask: {
    android: "https://play.google.com/store/apps/details?id=io.metamask",
    ios: "https://apps.apple.com/app/metamask/id1438144202"
  },
  trustwallet: {
    android: "https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp",
    ios: "https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409"
  }
};

interface WalletConnectionProps {
  onWalletConnected?: (address: string) => void;
  isConnecting?: boolean;
  showCard?: boolean;
}

export default function SimpleWalletConnect({ 
  onWalletConnected, 
  isConnecting = false,
  showCard = true
}: WalletConnectionProps) {
  const [connecting, setConnecting] = useState<boolean>(isConnecting);
  const { toast } = useToast();

  const openWallet = (walletType: 'metamask' | 'trustwallet') => {
    setConnecting(true);
    
    // Detect device OS
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    // Get the appropriate deep link based on device type
    const deepLink = isAndroid 
      ? WALLET_LINKS[walletType].android 
      : WALLET_LINKS[walletType].ios;
    
    console.log(`Opening ${walletType} with deep link: ${deepLink}`);
    
    // For Telegram Mini App
    if (isTelegramMiniApp() && TelegramMiniAppWebApp?.openLink) {
      // Use Telegram's API to open links
      TelegramMiniAppWebApp.openLink(deepLink);
    } else {
      // Direct approach for regular browsers
      window.location.href = deepLink;
    }
    
    // Reset button after delay and show message
    setTimeout(() => {
      setConnecting(false);
      toast({
        title: `${walletType === 'metamask' ? 'MetaMask' : 'Trust Wallet'} Opening`,
        description: "Check if your wallet app opened. Then return to this app after connecting.",
      });
    }, 1500);
  };

  if (!showCard) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <Button 
          variant="outline" 
          className="flex items-center justify-center gap-2 w-full" 
          onClick={() => openWallet('metamask')}
          disabled={connecting}
        >
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SiMeta className="h-5 w-5 text-orange-500" />}
          Open MetaMask
        </Button>
        <Button 
          variant="outline" 
          className="flex items-center justify-center gap-2 w-full" 
          onClick={() => openWallet('trustwallet')}
          disabled={connecting}
        >
          {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FaWallet className="h-5 w-5 text-blue-500" />}
          Open Trust Wallet
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
            onClick={() => openWallet('metamask')}
            disabled={connecting}
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <SiMeta className="h-5 w-5 text-orange-500" />}
            Open MetaMask
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center justify-center gap-2 w-full" 
            onClick={() => openWallet('trustwallet')}
            disabled={connecting}
          >
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FaWallet className="h-5 w-5 text-blue-500" />}
            Open Trust Wallet
          </Button>
        </div>
        <div className="mt-4 text-xs text-center opacity-60">
          Note: Your wallet app should open automatically. After connecting in the wallet, return to this app.
        </div>
      </CardContent>
    </Card>
  );
}