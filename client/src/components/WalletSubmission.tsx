import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, AlertCircle, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateWalletAddress, connectWallet } from '@/lib/wallet-utils';
import { useUser } from '@/providers/UserProvider';
import { apiRequest } from '@/lib/queryClient';
import Logo from '@/components/Logo';
import { useIsMobile } from '@/hooks/use-mobile';

const WalletSubmission: React.FC = () => {
  const { user, refreshUser } = useUser();
  const [walletAddress, setWalletAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showMobileConnect, setShowMobileConnect] = useState(false);
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate the wallet address
    if (!validateWalletAddress(walletAddress)) {
      setError('Please enter a valid BSC wallet address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest('POST', '/api/wallet', {
        walletAddress,
      });
      
      if (response.ok) {
        const updatedUser = await response.json();
        
        toast({
          title: 'Wallet Connected',
          description: 'Your wallet address has been saved successfully!',
        });
        
        // Refresh user data
        refreshUser();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to connect wallet');
        
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: errorData.message || 'Failed to connect wallet',
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('An error occurred while connecting your wallet');
      
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'Failed to connect wallet. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoConnect = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const address = await connectWallet();
      if (address) {
        setWalletAddress(address);
        
        // Auto-submit the form with the detected address
        const response = await apiRequest('POST', '/api/wallet', {
          walletAddress: address,
        });
        
        if (response.ok) {
          toast({
            title: 'Wallet Connected',
            description: 'Your wallet address has been saved successfully!',
          });
          
          // Refresh user data
          refreshUser();
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to connect wallet');
          
          toast({
            variant: 'destructive',
            title: 'Connection Failed',
            description: errorData.message || 'Failed to connect wallet',
          });
        }
      } else {
        if (isMobile) {
          // Show mobile wallet connect option
          setShowMobileConnect(true);
        } else {
          setError('No wallet detected. Please install MetaMask, Trust Wallet, or Binance Chain Wallet.');
          
          toast({
            variant: 'destructive',
            title: 'No Wallet Detected',
            description: 'Please install a BSC-compatible wallet extension.',
          });
        }
      }
    } catch (error) {
      console.error('Error auto-connecting wallet:', error);
      setError('An error occurred while connecting your wallet');
      
      toast({
        variant: 'destructive',
        title: 'Connection Error',
        description: 'Failed to connect wallet. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWalletSelected = async (address: string) => {
    if (address) {
      setWalletAddress(address);
      setShowMobileConnect(false);
      
      // Submit the form with the selected wallet
      try {
        setIsSubmitting(true);
        
        const response = await apiRequest('POST', '/api/wallet', {
          walletAddress: address,
        });
        
        if (response.ok) {
          toast({
            title: 'Wallet Connected',
            description: 'Your wallet address has been saved successfully!',
          });
          
          // Refresh user data
          refreshUser();
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to connect wallet');
          
          toast({
            variant: 'destructive',
            title: 'Connection Failed',
            description: errorData.message || 'Failed to connect wallet',
          });
        }
      } catch (error) {
        console.error('Error connecting selected wallet:', error);
        setError('An error occurred while connecting your wallet');
        
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: 'Failed to connect wallet. Please try again.',
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // If mobile connect dialog is showing
  if (showMobileConnect) {
    return (
      <div className="mt-4">
        <MobileWalletConnect 
          onConnect={handleWalletSelected}
          onCancel={() => setShowMobileConnect(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center mb-4">
        <Logo size="large" />
      </div>
      
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-medium text-center">Connect your BSC Wallet</h3>
        <p className="text-center text-sm text-gray-400">
          Connect your Binance Smart Chain wallet to receive your GLRS tokens when the airdrop distribution begins
        </p>
      </div>
      
      <Button 
        onClick={handleAutoConnect}
        className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="h-5 w-5 mr-2" />
            Connect Wallet Automatically
          </>
        )}
      </Button>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-2 bg-[#1c3252] text-gray-400">or enter manually</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="walletAddress">BSC Wallet Address</Label>
          <Input
            id="walletAddress"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="bg-[#243b5c] border-[#2a4365] text-white"
            disabled={isSubmitting}
          />
          {error && (
            <div className="flex items-center text-red-400 text-sm mt-1">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span>{error}</span>
            </div>
          )}
          <p className="text-xs text-gray-400">
            Enter your Binance Smart Chain (BSC) wallet address to receive your GLRS tokens
          </p>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-[#2a4365] hover:bg-[#35547f] text-white font-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Submit Address
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default WalletSubmission;