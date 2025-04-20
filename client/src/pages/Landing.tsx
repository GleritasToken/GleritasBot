import React, { useState } from 'react';
import { useLocation } from 'wouter';
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
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Logo from '@/components/logo';
import { useUser } from '@/providers/UserProvider';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, ArrowRight } from 'lucide-react';

// Create registration schema
const registrationSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters.")
    .max(50, "Username must be less than 50 characters.")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens."),
  captchaValue: z.string()
    .min(1, "Please complete the CAPTCHA")
});

const Landing: React.FC = () => {
  const [location, navigate] = useLocation();
  const { registerUser, user } = useUser();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("ABC123"); // In a real app, this would be generated server-side
  
  // Get referral code from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref');

  // Initialize form
  const form = useForm<z.infer<typeof registrationSchema>>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      username: '',
      captchaValue: '',
    },
  });

  // Regenerate CAPTCHA
  const refreshCaptcha = () => {
    // In a real app, this would call an API to get a new CAPTCHA
    const randomCaptcha = Math.random().toString(36).substring(2, 8).toUpperCase();
    setCaptchaCode(randomCaptcha);
    form.setValue('captchaValue', '');
  };

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof registrationSchema>) => {
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

      // Get browser fingerprint (simplified)
      const fingerprint = navigator.userAgent;
      
      // Register user
      await registerUser({
        username: values.username,
        referredBy: referralCode || undefined,
        fingerprint,
        captchaToken: values.captchaValue,
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "There was an error during registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // If user is already registered, redirect to dashboard
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      
      <div className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-md px-4 py-8">
          <Card className="bg-white dark:bg-gray-800 shadow-xl">
            <CardHeader className="pb-2 text-center">
              <div className="mx-auto rounded-full bg-primary-100 dark:bg-primary-900/30 p-3 w-16 h-16 flex items-center justify-center mb-4">
                <Logo />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Join Gleritas Airdrop</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Complete tasks and earn GLRS tokens
              </p>
            </CardHeader>
            
            <CardContent className="pt-6">
              {referralCode && (
                <div className="mb-4 p-2 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/30 rounded-md text-sm text-primary-700 dark:text-primary-300">
                  You were referred by a friend! You'll both earn bonus tokens.
                </div>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter a username"
                            {...field}
                            disabled={submitting}
                          />
                        </FormControl>
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
                              disabled={submitting}
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
                    disabled={submitting}
                  >
                    {submitting ? 'Registering...' : 'Start Earning GLRS'}
                    {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex flex-col text-center text-xs text-gray-500 dark:text-gray-400 pt-2">
              <p>By registering, you agree to the terms and conditions of the Gleritas Token Airdrop program.</p>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Landing;
