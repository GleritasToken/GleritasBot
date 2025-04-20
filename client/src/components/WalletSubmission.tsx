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
import { RefreshCw, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useUser } from '@/providers/UserProvider';
import { useQueryClient } from '@tanstack/react-query';
import { validateWalletAddress } from '@/lib/wallet-utils';

// Create schema for wallet submission
const walletSubmissionSchema = z.object({
  walletAddress: z.string()
    .min(42, "Wallet address must be 42 characters.")
    .max(42, "Wallet address must be 42 characters.")
    .refine(val => val.startsWith('0x'), {
      message: "Address must start with 0x",
    })
    .refine(validateWalletAddress, {
      message: "Invalid BEP-20 wallet address",
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
    <Card>
      <CardContent className="p-6">
        <h3 className="font-semibold text-lg mb-4">Submit Your BEP-20 Wallet Address</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
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
                  <FormLabel>Wallet Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0x..."
                      {...field}
                      disabled={isWalletTaskCompleted || submitting}
                    />
                  </FormControl>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Must be a valid BEP-20 address. Tokens will be sent to this address after the airdrop ends.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CAPTCHA Verification */}
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">CAPTCHA Verification</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-primary-600 dark:text-primary-400 text-sm hover:text-primary-700 dark:hover:text-primary-300 p-0 h-auto"
                  onClick={refreshCaptcha}
                  disabled={submitting}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center mb-3 font-mono text-lg">
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
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center"
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
