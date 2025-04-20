import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, FileText } from 'lucide-react';

const ProjectInfo: React.FC = () => {
  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-3">About Gleritas Token</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Gleritas is a next-generation token built on Binance Smart Chain with a focus on community governance and sustainable growth.
        </p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Token Symbol</p>
            <p className="font-medium">GLRS</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Network</p>
            <p className="font-medium">BEP-20 (BSC)</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Supply</p>
            <p className="font-medium">1,000,000,000</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Airdrop Amount</p>
            <p className="font-medium">5,000,000 GLRS</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 py-2 rounded flex items-center justify-center text-sm text-gray-700 dark:text-gray-300"
            onClick={() => window.open('https://gleritas.io', '_blank')}
          >
            <Globe className="h-4 w-4 mr-1" />
            Website
          </Button>
          <Button 
            variant="outline"
            className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 py-2 rounded flex items-center justify-center text-sm text-gray-700 dark:text-gray-300"
            onClick={() => window.open('https://gleritas.io/whitepaper.pdf', '_blank')}
          >
            <FileText className="h-4 w-4 mr-1" />
            Whitepaper
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectInfo;
