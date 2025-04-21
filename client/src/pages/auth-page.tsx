import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

// Auth schemas
const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  walletAddress: z.string().optional(),
  referredBy: z.string().optional(),
  captchaToken: z.string().min(1, "CAPTCHA verification is required"),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms and conditions"
  })
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  
  // Check if user is already logged in
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false
  });
  
  // Handle logged in user redirect
  useEffect(() => {
    if (user && typeof user === 'object' && 'id' in user) {
      console.log('Auth page detected logged in user:', (user as any).username);
      console.log('Redirecting to dashboard');
      // Use window.location for a full page reload to ensure clean state
      window.location.href = '/';
    }
  }, [user]);
  
  // Log auth state for debugging
  console.log('Auth page state:', { isLoggedIn: !!user, isLoading, isError });

  // Login form setup
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
    }
  });

  // Register form setup
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      walletAddress: "",
      referredBy: "",
      captchaToken: "demo-token", // In a real app, this would come from a CAPTCHA component
      agreeTerms: false
    }
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const response = await apiRequest("POST", "/api/login", data);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Login successful, response:", data);
      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
      
      // Force a page refresh to ensure all auth state is properly updated
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormValues) => {
      console.log("Registering with data:", { ...data, password: "[REDACTED]" });
      
      // Add device fingerprint and IP in a real app
      const formData = {
        ...data,
        fingerprint: "demo-fingerprint",
        ipAddress: "127.0.0.1"
      };
      
      // Create a new object without the agreeTerms field
      const { agreeTerms, ...submitData } = formData;

      const response = await apiRequest("POST", "/api/register", submitData);
      return await response.json();
    },
    onSuccess: (data) => {
      console.log("Registration successful, response:", data);
      toast({
        title: "Registration successful",
        description: "Your account has been created!",
      });
      
      // Force a page refresh to ensure all auth state is properly updated
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    }
  });

  // Form submission handlers
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left column - Auth forms */}
      <div className="w-full lg:w-1/2 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">GLRS Token Airdrop</CardTitle>
            <CardDescription className="text-center">Join our community and earn tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="walletAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BEP-20 Wallet Address (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="0x..." {...field} />
                          </FormControl>
                          <FormDescription>
                            You can add this later
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="referredBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referral Code (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter referral code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="agreeTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the terms and conditions
                            </FormLabel>
                            <FormDescription>
                              By registering, you agree to complete social media tasks to earn tokens
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              {activeTab === "login" ? 
                "Don't have an account? " : 
                "Already have an account? "}
              <Button 
                variant="link" 
                className="p-0" 
                onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")}
              >
                {activeTab === "login" ? "Register" : "Login"}
              </Button>
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right column - Hero section */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-primary to-primary-foreground p-12 text-white">
        <div className="h-full flex flex-col justify-center">
          <h1 className="text-4xl font-bold mb-6">GLRS Token Airdrop</h1>
          <p className="text-xl mb-8">Join our community and participate in our token airdrop program.</p>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Earn tokens for social media engagement</h3>
                <p>Complete simple tasks like following, liking, and sharing to earn tokens</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Refer friends for bonus rewards</h3>
                <p>Get additional tokens for each person you refer to our program</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Withdraw tokens to your wallet</h3>
                <p>Once you've earned enough tokens, withdraw them to your BEP-20 wallet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}