import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';

const WithdrawalInfo: React.FC = () => {
  const { user } = useUser();

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-3">Token Withdrawal</h3>
        
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-yellow-900/20 p-3 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-500">
                A small fee of $1 BNB will be required during the withdrawal phase to prevent mass farming and ensure genuine participation.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Available for withdrawal</span>
          <span className="font-semibold text-primary-600 dark:text-primary-400">{user?.totalTokens || 0} GLRS</span>
        </div>
        
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">Withdrawal fee</span>
          <span className="font-semibold text-gray-700 dark:text-gray-300">$1 BNB</span>
        </div>
        
        <Button 
          variant="outline"
          className="w-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 py-2 px-4 rounded-lg font-medium text-sm cursor-not-allowed"
          disabled
        >
          Withdrawals Open Soon
        </Button>
      </CardContent>
    </Card>
  );
};

export default WithdrawalInfo;
