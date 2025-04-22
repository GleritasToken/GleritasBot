import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/providers/UserProvider';
import { AlertCircle, Wallet, ArrowRight, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import FeeOptions from '@/components/FeeOptions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { validateWalletAddress, FEES_RECIPIENT_ADDRESS } from '@/lib/wallet-utils';

interface Withdrawal {
  id: number;
  userId: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bnbFeeCollected: boolean;
  txHash: string | null;
  walletAddress: string;
  createdAt: string;
}

const WithdrawalPage: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState<number>(10);
  const [txHash, setTxHash] = useState<string>('');
  const [activeWithdrawal, setActiveWithdrawal] = useState<number | null>(null);
  
  // Fetch withdrawals
  const { data: withdrawals, isLoading } = useQuery<Withdrawal[]>({
    queryKey: ['/api/withdrawals'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/withdrawals');
      return response.json();
    },
    enabled: !!user,
  });
  
  // Create withdrawal request
  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/withdrawals', {
        amount,
        captchaToken: 'demo-token',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: 'Withdrawal Request Created',
        description: 'Please submit the BNB fee to process your withdrawal',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to create withdrawal request',
        variant: 'destructive',
      });
    },
  });
  
  // Submit BNB fee
  const feeSubmitMutation = useMutation({
    mutationFn: async ({ id, hash }: { id: number; hash: string }) => {
      const response = await apiRequest('POST', `/api/withdrawals/${id}/fee`, {
        txHash: hash,
        captchaToken: 'demo-token',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/withdrawals'] });
      toast({
        title: 'Fee Payment Verified',
        description: 'Your withdrawal is now being processed',
      });
      setTxHash('');
      setActiveWithdrawal(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Payment Verification Failed',
        description: error.message || 'Failed to verify your BNB payment',
        variant: 'destructive',
      });
    },
  });

  const handleWithdraw = () => {
    if (!user?.walletAddress) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet before withdrawing',
        variant: 'destructive',
      });
      return;
    }
    
    if (withdrawAmount < 10) {
      toast({
        title: 'Minimum Withdrawal',
        description: 'Minimum withdrawal amount is 10 GLRS',
        variant: 'destructive',
      });
      return;
    }
    
    if (withdrawAmount > (user?.totalPoints || 0)) {
      toast({
        title: 'Insufficient Balance',
        description: 'You don\'t have enough points to withdraw this amount',
        variant: 'destructive',
      });
      return;
    }
    
    withdrawMutation.mutate(withdrawAmount);
  };
  
  const handleFeeSubmit = (withdrawalId: number) => {
    if (!txHash) {
      toast({
        title: 'Transaction Hash Required',
        description: 'Please enter the BNB fee transaction hash',
        variant: 'destructive',
      });
      return;
    }
    
    feeSubmitMutation.mutate({ id: withdrawalId, hash: txHash });
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Get status badge class
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'processing':
        return 'bg-blue-500/20 text-blue-300';
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      case 'failed':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 mr-1 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case 'failed':
        return <XCircle className="h-4 w-4 mr-1" />;
      default:
        return <Clock className="h-4 w-4 mr-1" />;
    }
  };

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
                Withdraw GLRS Tokens
              </CardTitle>
              <CardDescription className="text-gray-400">
                Withdraw your earned GLRS tokens to your connected wallet
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
                    {user?.totalPoints || 0} GLRS
                  </motion.p>
                </motion.div>
                
                <Alert className="bg-blue-900/30 border-blue-800/50 text-blue-300 mb-6">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    Withdrawals require a small BNB network fee (0.001 BNB) to be paid separately after submission.
                  </AlertDescription>
                </Alert>
                
                <h3 className="font-medium mb-2">Withdrawal Amount</h3>
                <div className="mb-6">
                  <div className="mb-4">
                    <Slider
                      value={[withdrawAmount]}
                      min={10}
                      max={Math.max(user?.totalPoints || 10, 10)}
                      step={1}
                      onValueChange={(value) => setWithdrawAmount(value[0])}
                      className="my-4"
                    />
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Min: 10 GLRS</span>
                      <span>Max: {Math.max(user?.totalTokens || 10, 10)} GLRS</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                        min={10}
                        max={user?.totalTokens || 0}
                        className="bg-[#243b5c] border-[#2a4365] text-white"
                      />
                    </div>
                    <Button
                      onClick={handleWithdraw}
                      disabled={withdrawMutation.isPending || !user?.walletAddress || user?.totalTokens < 10}
                      className="bg-blue-600 hover:bg-blue-700 relative overflow-hidden group"
                    >
                      {withdrawMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Wallet className="h-4 w-4 mr-2" />
                          Withdraw
                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {!user?.walletAddress && (
                    <p className="text-sm text-red-400 mt-2">
                      You must connect your wallet before withdrawing.
                    </p>
                  )}
                </div>
              </div>
              
              {/* Withdrawal History */}
              <div>
                <h3 className="font-medium mb-3">Withdrawal History</h3>
                
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  </div>
                ) : !withdrawals || withdrawals.length === 0 ? (
                  <div className="bg-[#243b5c] border border-[#2a4365] rounded-lg p-6 text-center">
                    <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                    <h4 className="text-lg font-medium mb-2">No Withdrawals Yet</h4>
                    <p className="text-gray-400 mb-4">
                      You haven't made any withdrawal requests yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <motion.div
                        key={withdrawal.id}
                        className="bg-[#243b5c] border border-[#2a4365] rounded-lg p-4"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring" }}
                        whileHover={{ 
                          scale: 1.01, 
                          borderColor: withdrawal.status === 'completed' 
                            ? '#10b981' 
                            : withdrawal.status === 'pending' 
                              ? '#eab308' 
                              : '#3b82f6' 
                        }}
                      >
                        <div className="flex flex-col md:flex-row justify-between mb-2">
                          <div>
                            <div className="flex items-center">
                              <h4 className="font-medium text-lg">{withdrawal.amount} GLRS</h4>
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs flex items-center ${getStatusBadge(withdrawal.status)}`}>
                                {getStatusIcon(withdrawal.status)}
                                {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">
                              Requested on {formatDate(withdrawal.createdAt)}
                            </p>
                          </div>
                          
                          <div className="mt-2 md:mt-0">
                            <div className="flex items-center text-sm">
                              <span className="text-gray-400 mr-2">To wallet:</span>
                              <span className="text-white font-mono">
                                {withdrawal.walletAddress.slice(0, 6)}...{withdrawal.walletAddress.slice(-4)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {withdrawal.status === 'pending' && !withdrawal.bnbFeeCollected && (
                          <div className="mt-3 p-3 bg-[#172a41] rounded-lg">
                            <h5 className="text-sm font-medium mb-2">BNB Fee Required</h5>
                            <p className="text-xs text-gray-400 mb-3">
                              Please send 0.001 BNB to the following address and submit the transaction hash:
                            </p>
                            <div className="bg-[#1c3252] p-2 rounded mb-3 font-mono text-xs overflow-hidden">
                              0x7A123Bb4D123E56789aBc9876543210dEfB1234c
                            </div>
                            
                            {activeWithdrawal === withdrawal.id ? (
                              <div className="space-y-2">
                                <Input
                                  placeholder="Enter transaction hash (0x...)"
                                  value={txHash}
                                  onChange={(e) => setTxHash(e.target.value)}
                                  className="bg-[#243b5c] border-[#2a4365] text-white text-xs"
                                />
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs border-gray-600"
                                    onClick={() => setActiveWithdrawal(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="text-xs bg-blue-600 hover:bg-blue-700"
                                    onClick={() => handleFeeSubmit(withdrawal.id)}
                                    disabled={feeSubmitMutation.isPending || !txHash}
                                  >
                                    {feeSubmitMutation.isPending ? (
                                      <>
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Verifying...
                                      </>
                                    ) : (
                                      <>Submit</>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                className="text-xs w-full bg-blue-600 hover:bg-blue-700"
                                onClick={() => setActiveWithdrawal(withdrawal.id)}
                              >
                                I've Sent the BNB Fee
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {withdrawal.txHash && (
                          <div className="mt-2 text-xs text-gray-400">
                            <span className="font-medium">Tx Hash:</span> {withdrawal.txHash}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Footer with padding for mobile nav */}
      <div className="h-16 md:h-0"></div>
    </div>
  );
};

export default WithdrawalPage;