import React from "react";
import { Button } from "@/components/ui/button";
import { SiMeta } from "react-icons/si";
import { FaWallet } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { isTelegramMiniApp, TelegramMiniAppWebApp } from "@/lib/telegram-app";

/**
 * Very simple and direct component to open wallet apps from Telegram
 * No callbacks, no state management - just direct app opening
 */
export default function TelegramWalletConnect() {
  const [loading, setLoading] = React.useState<string | null>(null);

  const openWallet = (walletType: 'metamask' | 'trustwallet') => {
    // Set loading state for the clicked button
    setLoading(walletType);
    
    // Detect device OS
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    // Choose the appropriate deep link format
    const link = isAndroid 
      ? walletType === 'metamask'
        ? "intent://io.metamask#Intent;package=io.metamask;end;"
        : "intent://com.wallet.crypto.trustapp#Intent;package=com.wallet.crypto.trustapp;end;"
      : walletType === 'metamask'
        ? "metamask://"
        : "trust://";
    
    console.log(`Opening ${walletType} with direct link: ${link}`);
    
    // Open the wallet via Telegram or directly
    if (isTelegramMiniApp() && TelegramMiniAppWebApp?.openLink) {
      TelegramMiniAppWebApp.openLink(link);
    } else {
      window.location.href = link;
    }
    
    // Reset loading after a delay
    setTimeout(() => {
      setLoading(null);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
      <Button 
        className="bg-amber-500 hover:bg-amber-600 text-black px-5 py-6 text-lg font-bold"
        onClick={() => openWallet('metamask')}
        disabled={loading !== null}
      >
        {loading === 'metamask' ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <SiMeta className="h-6 w-6 mr-2" />
        )}
        Open MetaMask
      </Button>
      
      <Button 
        className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-6 text-lg font-bold"
        onClick={() => openWallet('trustwallet')}
        disabled={loading !== null}
      >
        {loading === 'trustwallet' ? (
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
        ) : (
          <FaWallet className="h-6 w-6 mr-2" />
        )}
        Open Trust Wallet
      </Button>
      
      <p className="text-center text-sm mt-2 text-gray-300">
        This will open your wallet app directly. When finished connecting in the wallet, return to this app.
      </p>
    </div>
  );
}