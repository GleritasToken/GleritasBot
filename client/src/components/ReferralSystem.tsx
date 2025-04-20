import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/providers/UserProvider';
import { useQueryClient } from '@tanstack/react-query';

const ReferralSystem: React.FC = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Generate referral link
  const referralLink = React.useMemo(() => {
    if (!user?.referralCode) return window.location.origin;
    return `${window.location.origin}?ref=${user.referralCode}`;
  }, [user]);

  // Copy referral link to clipboard
  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    });
  };

  // Share on social media
  const shareOn = (platform: string) => {
    let url = '';
    const message = `Join the Gleritas Token Airdrop and earn free tokens! Use my referral link:`;
    
    switch (platform) {
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(message)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message + ' ' + referralLink)}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodeURIComponent(message + ' ' + referralLink)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Card className="bg-[#1c3252] rounded-xl shadow-sm overflow-hidden border border-[#2a4365]">
      <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 text-white border-b border-[#2a4365]">
        <h3 className="font-semibold text-lg">Referral Program</h3>
        <p className="text-sm text-white/80">Earn +5 GLRS for each friend who completes tasks</p>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="bg-blue-900/30 rounded-lg p-4 mb-4 border border-blue-800">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-200">Your Referrals</span>
            <span className="text-xl font-bold text-blue-300">
              {user?.referralCount || 0}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-blue-300">Earned from referrals</span>
            <span className="text-lg font-semibold text-blue-300">
              {user?.referralTokens || 0} GLRS
            </span>
          </div>
        </div>
        
        <p className="text-sm text-blue-200 mb-3">Share your unique referral link with friends:</p>
        
        <div className="relative mb-4">
          <Input
            type="text"
            value={referralLink}
            readOnly
            className="block w-full px-4 py-3 bg-[#243b5c] border border-[#2a4365] rounded-md font-mono text-sm pr-10 text-white"
          />
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-blue-200 focus:outline-none h-auto p-1"
            onClick={copyReferralLink}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="default"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
            onClick={() => shareOn('telegram')}
          >
            <i className="fab fa-telegram-plane mr-1"></i>
            Telegram
          </Button>
          <Button
            variant="default"
            className="flex-1 bg-blue-400 hover:bg-blue-500 text-white"
            onClick={() => shareOn('twitter')}
          >
            <i className="fab fa-twitter mr-1"></i>
            Twitter
          </Button>
          <Button
            variant="default"
            className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            onClick={() => shareOn('whatsapp')}
          >
            <i className="fab fa-whatsapp mr-1"></i>
            WhatsApp
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralSystem;
