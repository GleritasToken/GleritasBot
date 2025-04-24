import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/providers/UserProvider';
import { Star, ArrowRight, Check, AlertCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface UpgradeOption {
  id: string;
  title: string;
  label: string;
  description: string;
  price: string;
  features: string[];
}

const upgradeOptions: UpgradeOption[] = [
  {
    id: 'boost',
    title: 'Boost Your Earnings',
    label: 'Boost Your Airdrop Points',
    description: 'Get x2 Airdrop Rewards when you upgrade your account with a one-time boost fee of $3 (in BNB). This unlocks double earnings, early withdrawal access, and exclusive referral bonuses.',
    price: '$3 in BNB',
    features: [
      'Double earnings on all tasks',
      'Early withdrawal access',
      'Exclusive referral bonuses',
      'Earn 50 GLRS instead of 25'
    ]
  },
  {
    id: 'premium_tasks',
    title: 'Complete Premium Tasks',
    label: 'Unlock Premium Task Access',
    description: 'Gain access to exclusive GLRS tasks with higher rewards and instant eligibility for whitelist/referral bonuses. Requires one-time access payment of $3 (in BNB).',
    price: '$3 in BNB',
    features: [
      'Exclusive tasks with higher rewards',
      'Instant whitelist eligibility',
      'Enhanced referral bonuses',
      'Priority customer support'
    ]
  },
  {
    id: 'withdrawal_slot',
    title: 'Priority Withdrawal Slot',
    label: 'Reserve Your Withdrawal Slot',
    description: 'Secure a guaranteed spot in the early withdrawal batch by confirming your slot now with a $3 (BNB) confirmation fee.',
    price: '$3 in BNB',
    features: [
      'Guaranteed early withdrawal spot',
      'Skip the queue when withdrawals open',
      'No additional verification needed',
      'Priority transaction processing'
    ]
  }
];

const GLERITAS_WALLET = '0x7c427B65ebA206026A055B04c6086AC9af40B1B4';

const UpgradePage: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [showPayment, setShowPayment] = useState<boolean>(false);
  
  // Submit the upgrade payment
  const upgradeMutation = useMutation({
    mutationFn: async ({ optionId, transactionHash }: { optionId: string; transactionHash: string }) => {
      const response = await apiRequest('POST', '/api/upgrade', {
        optionId,
        txHash: transactionHash,
        captchaToken: 'demo-token', // In a real app, this would be a real captcha token
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Upgrade Successful!',
        description: 'Your account has been successfully upgraded.',
      });
      setTxHash('');
      setShowPayment(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Upgrade Failed',
        description: error.message || 'Failed to verify your upgrade payment',
        variant: 'destructive',
      });
    },
  });
  
  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setShowPayment(true);
  };
  
  const handleSubmitPayment = () => {
    if (!txHash) {
      toast({
        title: 'Transaction Hash Required',
        description: 'Please enter the BNB transaction hash',
        variant: 'destructive',
      });
      return;
    }
    
    if (!selectedOption) {
      toast({
        title: 'Option Required',
        description: 'Please select an upgrade option',
        variant: 'destructive',
      });
      return;
    }
    
    upgradeMutation.mutate({ optionId: selectedOption, transactionHash: txHash });
  };
  
  return (
    <div className="min-h-screen bg-[#12243B] text-white pb-16 md:pb-0">
      <Navigation />
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-amber-300 to-amber-500 text-transparent bg-clip-text">
            Upgrade Your GLRS Experience
          </h1>
          <p className="text-gray-300 mb-6">
            Boost your rewards, unlock exclusive content, and gain early access to withdrawals with our premium options.
          </p>
        </motion.div>
        
        {/* Premium Options */}
        {!showPayment ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {upgradeOptions.map((option) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: upgradeOptions.findIndex(o => o.id === option.id) * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <Card className="bg-[#1c3252] border-[#2a4365] h-full flex flex-col overflow-hidden">
                  <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
                    <CardTitle className="flex items-center text-lg">
                      <Star className="h-5 w-5 mr-2 text-amber-400" />
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {option.label}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 flex-grow">
                    <div className="mb-4">
                      <div className="text-lg font-semibold text-amber-400 mb-1">{option.price}</div>
                      <p className="text-gray-300 text-sm">One-time fee</p>
                    </div>
                    <p className="mb-4 text-gray-300 text-sm">
                      {option.description}
                    </p>
                    <div className="space-y-2">
                      {option.features.map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <Check className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-200 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 bg-[#192f4c] border-t border-[#2a4365]">
                    <Button 
                      onClick={() => handleOptionSelect(option.id)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
                    >
                      Select {option.title}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="bg-[#1c3252] border-[#2a4365]">
              <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
                <CardTitle className="flex items-center text-lg">
                  <Star className="h-5 w-5 mr-2 text-amber-400" />
                  Complete Your Upgrade
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Selected Option: {upgradeOptions.find(opt => opt.id === selectedOption)?.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Alert className="bg-blue-900/30 border-blue-800/50 text-blue-300 mb-6">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    Please send {upgradeOptions.find(opt => opt.id === selectedOption)?.price} to the following address and submit the transaction hash.
                  </AlertDescription>
                </Alert>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Payment Address</h3>
                  <div className="bg-[#243b5c] p-3 rounded border border-[#2a4365] font-mono text-sm break-all">
                    {GLERITAS_WALLET}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Send exactly $3 worth of BNB to this address from your personal wallet
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Transaction Hash</h3>
                  <Input
                    placeholder="Enter your transaction hash (0x...)"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    className="bg-[#243b5c] border-[#2a4365] text-white"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    After sending BNB, copy the transaction hash from your wallet or block explorer
                  </p>
                </div>
                
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPayment(false);
                      setSelectedOption(null);
                      setTxHash('');
                    }}
                    className="border-gray-600"
                  >
                    Go Back
                  </Button>
                  <Button
                    onClick={handleSubmitPayment}
                    disabled={upgradeMutation.isPending || !txHash}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-medium flex-1"
                  >
                    {upgradeMutation.isPending ? (
                      <>Processing...</>
                    ) : (
                      <>Complete Upgrade</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      
      {/* Footer with padding for mobile nav */}
      <div className="h-16 md:h-0"></div>
    </div>
  );
};

export default UpgradePage;