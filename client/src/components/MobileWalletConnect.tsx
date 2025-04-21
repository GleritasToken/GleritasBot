import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateWalletAddress } from '@/lib/wallet-utils';
import { useToast } from '@/hooks/use-toast';

interface MobileWalletConnectProps {
  onConnect: (address: string) => void;
  onCancel: () => void;
}

export default function MobileWalletConnect({ onConnect, onCancel }: MobileWalletConnectProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();

  const handleManualConnect = () => {
    setIsValidating(true);
    
    // Validate the wallet address
    if (!validateWalletAddress(walletAddress)) {
      toast({
        title: "Invalid wallet address",
        description: "Please enter a valid BSC wallet address starting with 0x",
        variant: "destructive"
      });
      setIsValidating(false);
      return;
    }
    
    // Simulate connecting - in a real app we'd verify ownership here
    setTimeout(() => {
      onConnect(walletAddress);
      toast({
        title: "Wallet connected",
        description: "Your wallet has been connected successfully"
      });
      setIsValidating(false);
    }, 1000);
  };

  const openWalletApp = (walletName: string) => {
    let deepLink = '';
    
    // Current URL to return to
    const currentUrl = encodeURIComponent(window.location.href);
    
    // Different deeplinks based on wallet type
    switch (walletName) {
      case 'metamask':
        deepLink = `https://metamask.app.link/dapp/${window.location.host}`;
        break;
      case 'trustwallet':
        deepLink = `https://link.trustwallet.com/open_url?url=${currentUrl}`;
        break;
      case 'binance':
        // Binance wallet doesn't have a standard deep link format, so we'll use a fallback
        deepLink = `https://www.binance.com/en/download`;
        break;
      default:
        deepLink = '';
    }
    
    if (deepLink) {
      window.location.href = deepLink;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect Wallet</CardTitle>
        <CardDescription>Connect your BSC wallet to continue</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Open with wallet app</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 space-y-2"
              onClick={() => openWalletApp('metamask')}
            >
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M6 8l2-5h8l2 5"/>
                  <path d="M18 8H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2Z"/>
                  <path d="M9 14h6"/>
                </svg>
              </div>
              <span className="text-xs">MetaMask</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 space-y-2"
              onClick={() => openWalletApp('trustwallet')}
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <span className="text-xs">Trust Wallet</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-24 space-y-2"
              onClick={() => openWalletApp('binance')}
            >
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M12 2l9 4.9V17L12 22l-9-4.9V7L12 2z"/>
                  <path d="M12 16.5v-11"/>
                  <path d="m7 9 5 3 5-3"/>
                </svg>
              </div>
              <span className="text-xs">Binance</span>
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 pt-4 border-t">
          <h3 className="text-sm font-medium">Or enter wallet address manually</h3>
          <div className="grid gap-2">
            <Label htmlFor="walletAddress">BSC Wallet Address</Label>
            <Input 
              id="walletAddress" 
              placeholder="0x..."
              value={walletAddress}
              onChange={e => setWalletAddress(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Enter your BSC wallet address starting with 0x</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button 
          onClick={handleManualConnect} 
          disabled={isValidating || !walletAddress}
        >
          {isValidating ? "Connecting..." : "Connect"}
        </Button>
      </CardFooter>
    </Card>
  );
}