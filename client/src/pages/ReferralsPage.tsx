import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUser } from '@/providers/UserProvider';
import { Copy, Users, AlertCircle, CheckCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

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
                <div className="bg-[#243b5c] rounded-lg p-4 text-center border border-[#2a4365]">
                  <p className="text-sm text-gray-400 mb-1">Total Referrals</p>
                  <p className="text-2xl font-bold">{user?.referralCount || 0}</p>
                </div>
                <div className="bg-[#243b5c] rounded-lg p-4 text-center border border-[#2a4365]">
                  <p className="text-sm text-gray-400 mb-1">Referral Earnings</p>
                  <p className="text-2xl font-bold text-amber-400">{user?.referralTokens || 0} GLRS</p>
                </div>
                <div className="bg-[#243b5c] rounded-lg p-4 text-center border border-[#2a4365]">
                  <p className="text-sm text-gray-400 mb-1">Remaining Referrals</p>
                  <p className="text-2xl font-bold">{Math.max(0, 50 - (user?.referralCount || 0))}</p>
                </div>
              </div>
              
              <Alert className="bg-blue-900/30 border-blue-800/50 text-blue-300 mb-4">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Earn 5 GLRS tokens for each friend who joins using your referral link (maximum 50 referrals).
                </AlertDescription>
              </Alert>
              
              <h3 className="font-medium mb-3">Your Referral Link</h3>
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                <div className="flex-1">
                  <Input 
                    value={referralUrl}
                    readOnly
                    className="bg-[#243b5c] border-[#2a4365] text-white"
                  />
                </div>
                <Button onClick={copyReferralLink} className="bg-blue-600 hover:bg-blue-700">
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Referrals List */}
            <div>
              <h3 className="font-medium mb-3">Your Referrals</h3>
              
              {!referrals || !referrals.referrals || referrals.referrals.length === 0 ? (
                <div className="bg-[#243b5c] border border-[#2a4365] rounded-lg p-6 text-center">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-500" />
                  <h4 className="text-lg font-medium mb-2">No Referrals Yet</h4>
                  <p className="text-gray-400 mb-4">
                    Share your referral link with friends to start earning bonus tokens.
                  </p>
                  <Button onClick={copyReferralLink} size="sm">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Referral Link
                  </Button>
                </div>
              ) : (
                <div className="bg-[#243b5c] border border-[#2a4365] rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#1c3252] border-b border-[#2a4365]">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date Joined</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tasks Completed</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Reward</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2a4365]">
                        {referrals.referrals && referrals.referrals.map((referral: any) => (
                          <tr key={referral.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{referral.username}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDate(referral.createdAt)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{referral.tasksCompleted || 0}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-400">+5 GLRS</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer with padding for mobile nav */}
      <div className="h-16 md:h-0"></div>
    </div>
  );
};

export default ReferralsPage;