import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { validateWalletAddress } from '@/lib/wallet-utils';
import { useUser } from '@/providers/UserProvider';
import { apiRequest } from '@/lib/queryClient';
import GleritasLogo from '@/components/GleritasLogo';

const WalletSubmission: React.FC = () => {
  const { refreshUser } = useUser();
  const [walletAddress, setWalletAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center mb-4">
        <GleritasLogo width={120} height={100} showText={true} />
      </div>
      
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-medium text-center">Connect your BSC Wallet</h3>
        <p className="text-center text-sm text-gray-400">
          Connect your Binance Smart Chain wallet to receive your GLRS tokens when the airdrop distribution begins
        </p>
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