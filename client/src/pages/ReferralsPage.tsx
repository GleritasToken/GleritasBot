import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/providers/UserProvider';
import { Copy, Users, AlertCircle, CheckCircle, Share2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { 
  FacebookShareButton, TwitterShareButton, TelegramShareButton, WhatsappShareButton,
  FacebookIcon, TwitterIcon, TelegramIcon, WhatsappIcon
} from 'react-share';

const ReferralsPage: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // Get referrals data
  const { data: referrals } = useQuery({
    queryKey: ['/api/referrals'],
    queryFn: async () => {
      const response = await fetch('/api/referrals');
      if (!response.ok) {
        throw new Error('Failed to fetch referrals');
      }
      return response.json();
    },
    enabled: !!user,
  });
  
  const referralUrl = `${window.location.origin}?ref=${user?.referralCode}`;
  
  // Copy referral link to clipboard
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    toast({
      title: 'Copied to clipboard',
      description: 'Referral link has been copied to your clipboard',
    });
    
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-[#12243B] text-white pb-16 md:pb-0">
      <Navigation />
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Referral program section */}
        <Card className="bg-[#1c3252] border-[#2a4365] mb-6">
          <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
            <CardTitle className="flex items-center text-lg">
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              Referral Program
            </CardTitle>
            <CardDescription className="text-gray-400">
              Invite friends to earn bonus GLRS tokens
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="font-medium mb-2">Your Referral Stats</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <motion.div 
                  className="bg-[#243b5c] rounded-lg p-4 text-center border border-[#2a4365]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02, borderColor: "#3b82f6" }}
                >
                  <p className="text-sm text-gray-400 mb-1">Total Referrals</p>
                  <motion.p 
                    className="text-2xl font-bold"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.1 
                    }}
                  >
                    {user?.referralCount || 0}
                  </motion.p>
                </motion.div>
                <motion.div 
                  className="bg-[#243b5c] rounded-lg p-4 text-center border border-[#2a4365]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  whileHover={{ scale: 1.02, borderColor: "#e6b94d" }}
                >
                  <p className="text-sm text-gray-400 mb-1">Referral Earnings</p>
                  <motion.p 
                    className="text-2xl font-bold text-amber-400"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.2 
                    }}
                  >
                    {user?.referralTokens || 0} GLRS
                  </motion.p>
                </motion.div>
                <motion.div 
                  className="bg-[#243b5c] rounded-lg p-4 text-center border border-[#2a4365]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  whileHover={{ scale: 1.02, borderColor: "#22c55e" }}
                >
                  <p className="text-sm text-gray-400 mb-1">Remaining Referrals</p>
                  <motion.p 
                    className="text-2xl font-bold"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: 0.3 
                    }}
                  >
                    {Math.max(0, 50 - (user?.referralCount || 0))}
                  </motion.p>
                </motion.div>
              </div>
              
              {/* Referral progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Referral Progress</span>
                  <span className="text-sm font-medium">{user?.referralCount || 0}/50</span>
                </div>
                <Progress 
                  value={(user?.referralCount || 0) * 2} 
                  max={100} 
                  className="h-2 bg-[#243b5c]" 
                />
                <motion.div 
                  className="mt-2 text-xs text-right text-gray-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {user?.referralCount === 50 ? 
                    <span className="text-green-400">Maximum referrals reached!</span> :
                    <span>Refer {Math.max(0, 50 - (user?.referralCount || 0))} more friends to maximize your earnings</span>
                  }
                </motion.div>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Alert className="bg-blue-900/30 border-blue-800/50 text-blue-300 mb-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    Earn 5 GLRS tokens for each friend who joins using your referral link (maximum 50 referrals).
                  </AlertDescription>
                </Alert>
              </motion.div>
              
              <motion.h3 
                className="font-medium mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Your Referral Link
              </motion.h3>
              <motion.div 
                className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex-1">
                  <Input 
                    value={referralUrl}
                    readOnly
                    className="bg-[#243b5c] border-[#2a4365] text-white"
                  />
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    onClick={copyReferralLink} 
                    className={`relative overflow-hidden ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {copied ? (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copied
                      </motion.div>
                    ) : (
                      <motion.div
                        className="flex items-center"
                        animate={{ x: [0, 2, -2, 0] }}
                        transition={{ repeat: 2, duration: 0.3, delay: 1.2 }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
              
              {/* Social media share buttons */}
              <motion.div
                className="mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-medium flex items-center">
                    <Share2 className="h-4 w-4 mr-2 text-blue-400" />
                    Share with friends
                  </h4>
                </div>
                <div className="flex space-x-3 justify-center">
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <FacebookShareButton url={referralUrl} quote="Join me on Gleritas Token Airdrop and earn GLRS tokens!">
                      <FacebookIcon size={40} round={true} />
                    </FacebookShareButton>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <TwitterShareButton url={referralUrl} title="Join me on Gleritas Token Airdrop and earn GLRS tokens!" via="GleritasToken">
                      <TwitterIcon size={40} round={true} />
                    </TwitterShareButton>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <TelegramShareButton url={referralUrl} title="Join me on Gleritas Token Airdrop and earn GLRS tokens!">
                      <TelegramIcon size={40} round={true} />
                    </TelegramShareButton>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <WhatsappShareButton url={referralUrl} title="Join me on Gleritas Token Airdrop and earn GLRS tokens!">
                      <WhatsappIcon size={40} round={true} />
                    </WhatsappShareButton>
                  </motion.div>
                </div>
              </motion.div>
            </div>
            
            {/* Referrals List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h3 className="font-medium mb-3">Your Referrals</h3>
              
              {!referrals || !referrals.referrals || referrals.referrals.length === 0 ? (
                <motion.div 
                  className="bg-[#243b5c] border border-[#2a4365] rounded-lg p-6 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1, duration: 0.5, type: "spring" }}
                  >
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                  </motion.div>
                  <motion.h4 
                    className="text-lg font-medium mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1 }}
                  >
                    No Referrals Yet
                  </motion.h4>
                  <motion.p 
                    className="text-gray-400 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                  >
                    Share your referral link with friends to start earning bonus tokens.
                  </motion.p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                  >
                    <Button 
                      onClick={copyReferralLink} 
                      size="sm"
                      className="relative overflow-hidden group"
                    >
                      <Copy className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
                      <span>Copy Referral Link</span>
                      <motion.span 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                        initial={{ width: 0, left: "50%" }}
                        whileHover={{ width: "80%", left: "10%" }}
                        transition={{ duration: 0.3 }}
                      />
                    </Button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div 
                  className="bg-[#243b5c] border border-[#2a4365] rounded-lg overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#1c3252] border-b border-[#2a4365]">
                        <tr>
                          <motion.th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.9 }}
                          >
                            Username
                          </motion.th>
                          <motion.th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.0 }}
                          >
                            Date Joined
                          </motion.th>
                          <motion.th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.1 }}
                          >
                            Tasks Completed
                          </motion.th>
                          <motion.th 
                            className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.2 }}
                          >
                            Reward
                          </motion.th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a4365]">
                        {referrals.referrals && referrals.referrals.map((referral: any, index: number) => (
                          <motion.tr 
                            key={referral.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 + (index * 0.1) }}
                            whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{referral.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(referral.createdAt)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{referral.tasksCompleted || 0}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-400">+5 GLRS</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer with padding for mobile nav */}
      <div className="h-16 md:h-0"></div>
    </div>
  );
};

export default ReferralsPage;