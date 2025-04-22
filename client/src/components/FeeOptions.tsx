import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, CardHeader, CardTitle, CardDescription, 
  CardContent, CardFooter 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useUser } from '@/providers/UserProvider';
import { PremiumOptionType } from '@shared/schema';
import { Loader2, Check, Wallet, Rocket, Star, Clock } from 'lucide-react';
import { FEES_RECIPIENT_ADDRESS, FEE_AMOUNT_BNB } from '@/lib/wallet-utils';

interface FeeOptionsProps {
  onComplete?: () => void;
}

const FeeOptions: React.FC<FeeOptionsProps> = ({ onComplete }) => {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PremiumOptionType>('boost_earnings');
  const [txHash, setTxHash] = useState('');

  // Submit premium fee payment
  const premiumFeeMutation = useMutation({
    mutationFn: async (data: { optionType: PremiumOptionType; txHash: string }) => {
      const response = await apiRequest('POST', '/api/premium-fee', {
        userId: user?.id,
        optionType: data.optionType,
        txHash: data.txHash,
        captchaToken: 'demo-token',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Premium Feature Activated',
        description: 'Your payment has been received and the premium feature is now active.',
      });
      setTxHash('');
      if (onComplete) onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: 'Activation Failed',
        description: error.message || 'Failed to activate premium feature',
        variant: 'destructive',
      });
    },
  });

  const handleFeeSubmit = () => {
    if (!txHash) {
      toast({
        title: 'Transaction Hash Required',
        description: 'Please enter the BNB transaction hash',
        variant: 'destructive',
      });
      return;
    }
    
    premiumFeeMutation.mutate({ 
      optionType: activeTab, 
      txHash 
    });
  };

  const getDescription = (optionType: PremiumOptionType) => {
    switch (optionType) {
      case 'boost_earnings':
        return 'Get x2 Airdrop Rewards when you upgrade your account with a one-time boost fee of $3 (in BNB).';
      case 'premium_tasks':
        return 'Access exclusive GLRS tasks with higher rewards and instant eligibility for whitelist/referral bonuses.';
      case 'priority_withdrawal':
        return 'Secure a guaranteed spot in the early withdrawal batch by confirming your slot now.';
      default:
        return '';
    }
  };

  const getIcon = (optionType: PremiumOptionType) => {
    switch (optionType) {
      case 'boost_earnings':
        return <Rocket className="h-6 w-6 text-yellow-500" />;
      case 'premium_tasks':
        return <Star className="h-6 w-6 text-purple-500" />;
      case 'priority_withdrawal':
        return <Clock className="h-6 w-6 text-blue-500" />;
      default:
        return null;
    }
  };

  // If user is already premium, show their status
  if (user?.isPremium) {
    return (
      <Card className="bg-[#1c3252] border-[#2a4365] mb-6">
        <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
          <CardTitle className="flex items-center text-lg">
            <Check className="h-5 w-5 mr-2 text-green-400" />
            Premium Status Active
          </CardTitle>
          <CardDescription className="text-gray-400">
            Your account has been upgraded with premium features
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-lg bg-[#243b5c] p-4 border border-[#2a4365]">
            <div className="flex items-center mb-2">
              {getIcon(user.premiumOptionChosen as PremiumOptionType)}
              <h3 className="ml-2 font-semibold">
                {user.premiumOptionChosen === 'boost_earnings' && 'Boosted Earnings (x2)'}
                {user.premiumOptionChosen === 'premium_tasks' && 'Premium Tasks Access'}
                {user.premiumOptionChosen === 'priority_withdrawal' && 'Priority Withdrawal'}
              </h3>
            </div>
            <p className="text-sm text-gray-300">
              {getDescription(user.premiumOptionChosen as PremiumOptionType)}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1c3252] border-[#2a4365] mb-6">
      <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
        <CardTitle className="flex items-center text-lg">
          <Star className="h-5 w-5 mr-2 text-yellow-400" />
          Upgrade Your Experience
        </CardTitle>
        <CardDescription className="text-gray-400">
          Choose from these premium options to enhance your airdrop rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="boost_earnings" onValueChange={(value) => setActiveTab(value as PremiumOptionType)}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="boost_earnings">Boost Earnings</TabsTrigger>
            <TabsTrigger value="premium_tasks">Premium Tasks</TabsTrigger>
            <TabsTrigger value="priority_withdrawal">Priority Withdrawal</TabsTrigger>
          </TabsList>
          
          <TabsContent value="boost_earnings">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#243b5c] rounded-lg p-5 border border-[#2a4365]"
            >
              <div className="flex items-center mb-3">
                <Rocket className="h-6 w-6 text-yellow-500 mr-3" />
                <h3 className="text-lg font-medium">Boost Your Airdrop Points</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Get x2 Airdrop Rewards when you upgrade your account with a one-time boost fee. This unlocks double earnings,
                early withdrawal access, and exclusive referral bonuses.
              </p>
              <div className="bg-yellow-900/20 border border-yellow-800/30 text-yellow-300 p-3 rounded-md text-sm mb-4">
                After upgrading, you'll earn 50 GLRS points instead of 25 for each task!
              </div>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="premium_tasks">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#243b5c] rounded-lg p-5 border border-[#2a4365]"
            >
              <div className="flex items-center mb-3">
                <Star className="h-6 w-6 text-purple-500 mr-3" />
                <h3 className="text-lg font-medium">Unlock Premium Task Access</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Get access to exclusive GLRS tasks with higher rewards and instant eligibility for whitelist/referral bonuses.
                Requires one-time access payment.
              </p>
              <div className="bg-purple-900/20 border border-purple-800/30 text-purple-300 p-3 rounded-md text-sm mb-4">
                Premium tasks offer 2-3x higher rewards compared to standard tasks!
              </div>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="priority_withdrawal">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#243b5c] rounded-lg p-5 border border-[#2a4365]"
            >
              <div className="flex items-center mb-3">
                <Clock className="h-6 w-6 text-blue-500 mr-3" />
                <h3 className="text-lg font-medium">Reserve Your Withdrawal Slot</h3>
              </div>
              <p className="text-gray-300 mb-4">
                Secure a guaranteed spot in the early withdrawal batch by confirming your slot now with a confirmation fee.
                Be among the first to receive your GLRS tokens.
              </p>
              <div className="bg-blue-900/20 border border-blue-800/30 text-blue-300 p-3 rounded-md text-sm mb-4">
                You'll be eligible for withdrawal as soon as it's enabled!
              </div>
            </motion.div>
          </TabsContent>
          
          <div className="mt-6 p-4 bg-[#172a41] rounded-lg">
            <h4 className="font-medium mb-2">Payment Instructions</h4>
            <p className="text-sm text-gray-300 mb-3">
              Send {FEE_AMOUNT_BNB} BNB (approximately $3) to the address below to activate your selected premium feature:
            </p>
            <div className="bg-[#1c3252] p-2 rounded mb-3 font-mono text-xs overflow-hidden border border-[#2a4365] break-all">
              {FEES_RECIPIENT_ADDRESS}
            </div>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Transaction Hash
                </label>
                <Input
                  placeholder="Enter BNB transaction hash (0x...)"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="bg-[#243b5c] border-[#2a4365] text-white"
                />
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-yellow-600 to-amber-500 hover:from-yellow-500 hover:to-amber-400"
                onClick={handleFeeSubmit}
                disabled={premiumFeeMutation.isPending || !txHash}
              >
                {premiumFeeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Activate Premium Feature
                  </>
                )}
              </Button>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FeeOptions;