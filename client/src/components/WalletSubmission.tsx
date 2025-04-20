import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, CheckCircle, Wallet, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useUser } from '@/providers/UserProvider';
import { useQueryClient } from '@tanstack/react-query';
import { validateWalletAddress, connectWallet } from '@/lib/wallet-utils';

// Create schema for wallet submission
const walletSubmissionSchema = z.object({
  walletAddress: z.string()
    .min(42, "Wallet address must be 42 characters.")
    .max(42, "Wallet address must be 42 characters.")
    .refine(val => val.startsWith('0x'), {
      message: "BSC address must start with 0x",
    })
    .refine(validateWalletAddress, {
      message: "Invalid BSC wallet address. Only Binance Smart Chain addresses are accepted.",
    }),
  captchaValue: z.string()
    .min(1, "Please complete the CAPTCHA")
});

const WalletSubmission: React.FC = () => {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("ABC123"); // In a real app, this would be generated server-side

  // State for wallet connection status
  const [connecting, setConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof walletSubmissionSchema>>({
    resolver: zodResolver(walletSubmissionSchema),
    defaultValues: {
      walletAddress: user?.walletAddress || '',
      captchaValue: '',
    },
  });

  // If user already has a wallet address, show it
  React.useEffect(() => {
    if (user?.walletAddress) {
      form.setValue('walletAddress', user.walletAddress);
    }
  }, [user, form]);
  
  // Handle wallet connection
  const handleConnectWallet = async () => {
    setConnecting(true);
    setConnectionError(null);
    
    try {
      const address = await connectWallet();
      if (address) {
        form.setValue('walletAddress', address);
        toast({
          title: "Wallet Connected",
          description: "BSC wallet connected successfully!",
        });
      } else {
        setConnectionError("Could not connect to your wallet. Please try again.");
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      setConnectionError(error.message || "Failed to connect to BSC wallet.");
    } finally {
      setConnecting(false);
    }
  };

  // Regenerate CAPTCHA
  const refreshCaptcha = () => {
    // In a real app, this would call an API to get a new CAPTCHA
    const randomCaptcha = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCaptchaCode(randomCaptcha);
    form.setValue('captchaValue', '');
  };

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof walletSubmissionSchema>) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please register first to submit your wallet",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      // Verify CAPTCHA (simplistic approach for prototype)
      if (values.captchaValue !== captchaCode) {
        toast({
          title: "Invalid CAPTCHA",
          description: "Please enter the correct CAPTCHA code",
          variant: "destructive",
        });
        refreshCaptcha();
        setSubmitting(false);
        return;
      }

      // Submit wallet address to API
      const response = await apiRequest('POST', '/api/wallet', {
        walletAddress: values.walletAddress,
        captchaToken: values.captchaValue,
      });

      const data = await response.json();

      toast({
        title: "Success!",
        description: "Your wallet address has been submitted successfully.",
      });

      // Refresh user data
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      // Reset form
      form.reset({
        walletAddress: values.walletAddress,
        captchaValue: '',
      });
      refreshCaptcha();
    } catch (error) {
      console.error("Wallet submission error:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your wallet address. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Check if user has already completed the wallet task
  const isWalletTaskCompleted = React.useMemo(() => {
    if (!user?.tasks) return false;
    return user.tasks.some(task => task.taskName === 'wallet_submit' && task.completed);
  }, [user]);

  return (
    <Card className="bg-[#1c3252] border border-[#2a4365]">
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-4 text-white">Submit Your BEP-20 Wallet Address</h3>
        <p className="text-sm text-blue-200 mb-4">
          Enter your BEP-20 compatible wallet address (e.g., MetaMask, Trust Wallet) to receive your GLRS tokens.
        </p>
        
        {isWalletTaskCompleted && (
          <Alert className="mb-4 bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-300 border-success-200 dark:border-success-900/30">
            <CheckCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Wallet submission complete! Your tokens will be sent to {user?.walletAddress}.
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="walletAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Wallet Address</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl>
                      <Input
                        placeholder="0x..."
                        {...field}
                        disabled={isWalletTaskCompleted || submitting || connecting}
                        className="bg-[#243b5c] border-[#2a4365] text-white"
                      />
                    </FormControl>
                    <Button
                      type="button"
                      onClick={handleConnectWallet}
                      disabled={isWalletTaskCompleted || submitting || connecting}
                      className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      {connecting ? 'Connecting...' : 'Connect'}
                    </Button>
                  </div>
                  
                  {connectionError && (
                    <Alert className="mt-2 bg-destructive/20 text-destructive border-destructive/50">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      <AlertDescription>
                        {connectionError}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <p className="mt-1 text-xs text-blue-200">
                    Must be a valid BSC (Binance Smart Chain) wallet address. Compatible with MetaMask, Trust Wallet, and Binance Chain Wallet.
                  </p>
                  <FormMessage className="text-red-300" />
                </FormItem>
              )}
            />

            {/* CAPTCHA Verification */}
            <div className="p-4 border border-[#2a4365] rounded-lg bg-[#243b5c]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">CAPTCHA Verification</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-blue-300 text-sm hover:text-blue-200 p-0 h-auto"
                  onClick={refreshCaptcha}
                  disabled={submitting}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
              <div className="h-16 bg-[#1c3252] rounded flex items-center justify-center mb-3 font-mono text-lg text-white">
                {captchaCode}
              </div>
              <FormField
                control={form.control}
                name="captchaValue"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter the code above"
                        {...field}
                        disabled={isWalletTaskCompleted || submitting}
                        className="bg-[#243b5c] border-[#2a4365] text-white"
                      />
                    </FormControl>
                    <FormMessage className="text-red-300" />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
              disabled={isWalletTaskCompleted || submitting}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {submitting ? 'Submitting...' : 'Submit Wallet Address'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default WalletSubmission;
