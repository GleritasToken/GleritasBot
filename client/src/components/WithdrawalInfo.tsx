import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';

const WithdrawalInfo: React.FC = () => {
  const { user } = useUser();

  return (
    <Card className="bg-[#1c3252] rounded-xl shadow-sm border border-[#2a4365]">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-3 text-white">Token Withdrawal</h3>
        
        <div className="rounded-lg border border-yellow-800 bg-yellow-900/20 p-3 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-400">
                A small fee of $1 BNB will be required during the withdrawal phase to prevent mass farming and ensure genuine participation.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#2a4365]">
          <span className="text-sm text-blue-200">Available for withdrawal</span>
          <span className="font-semibold text-blue-300">{user?.totalTokens || 0} GLRS</span>
        </div>
        
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#2a4365]">
          <span className="text-sm text-blue-200">Withdrawal fee</span>
          <span className="font-semibold text-blue-300">$1 BNB</span>
        </div>
        
        <Button 
          variant="outline"
          className="w-full bg-[#243b5c] text-gray-300 py-2 px-4 rounded-lg font-medium text-sm cursor-not-allowed border border-[#2a4365]"
          disabled
        >
          Withdrawals Open Soon
        </Button>
      </CardContent>
    </Card>
  );
};

export default WithdrawalInfo;
