import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import TelegramWalletConnect from '@/components/TelegramWalletConnect';

/**
 * A standalone page to connect wallets, optimized for embedding
 * in Telegram Mini App as well as direct access
 */
const WalletConnectPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12243B] text-white p-4 flex items-center justify-center">
      <Card className="bg-[#1c3252] border-[#2a4365] w-full max-w-md mx-auto">
        <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
          <CardTitle className="flex items-center text-xl justify-center">
            <Wallet className="h-6 w-6 mr-2 text-amber-400" />
            Connect Your Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 text-center">
            <p className="text-gray-300">
              Open your cryptocurrency wallet app to connect your BSC wallet address.
            </p>
          </div>
          
          <TelegramWalletConnect />
          
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>After connecting your wallet, you'll be able to receive GLRS Points and participate in the airdrop.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletConnectPage;