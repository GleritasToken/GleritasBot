import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/providers/UserProvider';
import { FEES_RECIPIENT_ADDRESS, FEE_AMOUNT_BNB } from '@/lib/wallet-utils';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Zap, Shield, Rocket, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Define premium option types
export type PremiumOptionType = 'earnings_boost' | 'premium_tasks' | 'priority_withdrawals';

interface FeeOptionsProps {
  onComplete?: () => void;
}

const FeeOptions: React.FC<FeeOptionsProps> = ({ onComplete }) => {
  const { toast } = useToast();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<PremiumOptionType>('earnings_boost');
  const [txHash, setTxHash] = useState('');
  
  // Mutation for submitting premium fee payment
  const premiumFeeMutation = useMutation({
    mutationFn: async (data: { optionType: PremiumOptionType; txHash: string }) => {
      const res = await apiRequest('POST', '/api/premium-fee', data);
      const result = await res.json();
      return result;
    },
    onSuccess: () => {
      toast({
        title: 'Premium Status Activated',
        description: 'Your premium status has been activated successfully!',
      });
      setTxHash('');
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Premium Activation Failed',
        description: error.message || 'Failed to activate premium status. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!txHash) {
      toast({
        title: 'Transaction Hash Required',
        description: 'Please enter the transaction hash of your fee payment.',
        variant: 'destructive',
      });
      return;
    }

    premiumFeeMutation.mutate({
      optionType: activeTab,
      txHash: txHash,
    });
  };

  // Get display information based on selected option type
  const getDescription = (optionType: PremiumOptionType) => {
    switch (optionType) {
      case 'earnings_boost':
        return 'Boost your GLRS point earnings by 2x on all completed tasks. Get more rewards for the same effort!';
      case 'premium_tasks':
        return 'Unlock exclusive premium tasks with higher point rewards and special bonuses only available to premium users.';
      case 'priority_withdrawals':
        return 'Get priority processing for your withdrawal requests. Skip the queue and receive your tokens faster!';
      default:
        return '';
    }
  };

  // Get icon for each option type
  const getIcon = (optionType: PremiumOptionType) => {
    switch (optionType) {
      case 'earnings_boost':
        return <Zap className="h-5 w-5 text-yellow-400" />;
      case 'premium_tasks':
        return <Shield className="h-5 w-5 text-blue-400" />;
      case 'priority_withdrawals':
        return <Rocket className="h-5 w-5 text-purple-400" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  // Get title for each option type
  const getTitle = (optionType: PremiumOptionType) => {
    switch (optionType) {
      case 'earnings_boost':
        return '2x Earnings Boost';
      case 'premium_tasks':
        return 'Premium Tasks Access';
      case 'priority_withdrawals':
        return 'Priority Withdrawals';
      default:
        return '';
    }
  };

  // Get color scheme for each option
  const getColorScheme = (optionType: PremiumOptionType) => {
    switch (optionType) {
      case 'earnings_boost':
        return 'from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500';
      case 'premium_tasks':
        return 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500';
      case 'priority_withdrawals':
        return 'from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500';
      default:
        return 'from-blue-600 to-blue-800';
    }
  };

  // Check if the user already has premium status for the selected option
  const isPremiumActive = user?.isPremium && user.premiumOptionChosen === activeTab;

  return (
    <div className="space-y-4">
      <Tabs
        defaultValue="earnings_boost"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as PremiumOptionType)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger 
            value="earnings_boost"
            className="flex items-center gap-1 data-[state=active]:bg-yellow-600/20"
          >
            <Zap className="h-4 w-4 text-yellow-400" />
            <span className="hidden md:inline">Earnings Boost</span>
          </TabsTrigger>
          <TabsTrigger 
            value="premium_tasks"
            className="flex items-center gap-1 data-[state=active]:bg-blue-600/20"
          >
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="hidden md:inline">Premium Tasks</span>
          </TabsTrigger>
          <TabsTrigger 
            value="priority_withdrawals"
            className="flex items-center gap-1 data-[state=active]:bg-purple-600/20"
          >
            <Rocket className="h-4 w-4 text-purple-400" />
            <span className="hidden md:inline">Priority Withdrawals</span>
          </TabsTrigger>
        </TabsList>

        <div className="bg-[#243b5c] border border-[#2a4365] rounded-lg p-4 mb-4">
          {isPremiumActive ? (
            <motion.div 
              className="flex flex-col items-center text-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-green-500/20 p-3 rounded-full mb-3">
                <Check className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-lg font-medium mb-1">Premium Active: {getTitle(activeTab)}</h3>
              <p className="text-gray-400 text-sm mb-2">
                You already have this premium option activated on your account.
              </p>
              <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-800">
                ACTIVE
              </Badge>
            </motion.div>
          ) : (
            <TabsContent value={activeTab} className="mt-0">
              <motion.div 
                className="flex flex-col md:flex-row gap-4 items-center"
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-[#1c3252] p-6 rounded-lg md:w-1/3 flex justify-center">
                  <div className="bg-[#172a41] p-4 rounded-full">
                    {getIcon(activeTab)}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    {getTitle(activeTab)}
                    <Sparkles className="h-4 w-4 ml-2 text-yellow-400" />
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {getDescription(activeTab)}
                  </p>
                  
                  <Alert className="bg-blue-900/30 border-blue-800/50 text-blue-300 mb-4">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      Send {FEE_AMOUNT_BNB} BNB to the address below and submit the transaction hash to activate.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="bg-[#1c3252] p-2 rounded mb-3 font-mono text-xs overflow-x-auto">
                    {FEES_RECIPIENT_ADDRESS}
                  </div>
                  
                  <div className="flex gap-2 flex-col md:flex-row">
                    <Input
                      placeholder="Transaction Hash (0x...)"
                      value={txHash}
                      onChange={(e) => setTxHash(e.target.value)}
                      className="bg-[#1c3252] border-[#2a4365] text-white flex-1"
                    />
                    <Button
                      onClick={handleSubmit}
                      disabled={premiumFeeMutation.isPending || !txHash}
                      className={`bg-gradient-to-r ${getColorScheme(activeTab)} text-white`}
                    >
                      {premiumFeeMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Activate Premium
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
};

export default FeeOptions;