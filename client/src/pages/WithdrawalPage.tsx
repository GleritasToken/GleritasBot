import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/providers/UserProvider';
import { AlertCircle, Lock, Wallet } from 'lucide-react';
import Navigation from '@/components/Navigation';
import FeeOptions from '@/components/FeeOptions';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Removed withdrawal interface as it's no longer needed

const WithdrawalPage: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return (
    <div className="min-h-screen bg-[#12243B] text-white pb-16 md:pb-0">
      <Navigation />
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Withdrawal Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="bg-[#1c3252] border-[#2a4365] mb-6">
            <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
              <CardTitle className="flex items-center text-lg">
                <Wallet className="h-5 w-5 mr-2 text-blue-400" />
                Withdraw GLRS Points
              </CardTitle>
              <CardDescription className="text-gray-400">
                Convert your earned GLRS points to tokens in your connected wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="font-medium mb-2">Your Balance</h3>
                <motion.div 
                  className="bg-[#243b5c] rounded-lg p-4 text-center border border-[#2a4365] mb-6"
                  whileHover={{ scale: 1.02, borderColor: "#e6b94d" }}
                >
                  <p className="text-sm text-gray-400 mb-1">Available for Withdrawal</p>
                  <motion.p 
                    className="text-3xl font-bold text-amber-400"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20
                    }}
                  >
                    {user?.totalPoints || 0} GLRS Points
                  </motion.p>
                </motion.div>

                {/* Withdrawal available soon message */}
                <Alert className="bg-amber-900/30 border-amber-800/50 text-amber-300 mb-6">
                  <Lock className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    <span className="font-semibold">Withdrawal available soon.</span> Points will be converted to tokens and tokens withdrawal will be live soon.
                  </AlertDescription>
                </Alert>
                
                <Alert className="bg-blue-900/30 border-blue-800/50 text-blue-300 mb-6">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    Withdrawals require a small BNB network fee (0.001 BNB) to be paid separately after submission.
                  </AlertDescription>
                </Alert>
                
                <div className="flex items-center justify-center mb-6">
                  <Button
                    disabled={true}
                    className="bg-gray-600 hover:bg-gray-700 relative overflow-hidden group cursor-not-allowed px-8 py-3 text-base"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    Withdrawals Coming Soon
                  </Button>
                </div>
                
                {!user?.walletAddress && (
                  <p className="text-sm text-red-400 text-center mb-4">
                    You must connect your wallet before withdrawing.
                  </p>
                )}
              </div>
              
              {/* Premium Fee Options */}
              <div className="mb-8">
                <h3 className="font-medium mb-3">Premium Withdrawal Options</h3>
                <FeeOptions onComplete={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                  toast({
                    title: 'Premium Status Updated',
                    description: 'Your premium status has been updated successfully!',
                  });
                }} />
              </div>
              
              {/* Removed withdrawal history section as requested */}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default WithdrawalPage;