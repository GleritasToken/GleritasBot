import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, FileText } from 'lucide-react';

const ProjectInfo: React.FC = () => {
  return (
    <Card className="bg-[#1c3252] rounded-xl shadow-sm border border-[#2a4365]">
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-3 text-white">About Gleritas Token</h3>
        <p className="text-sm text-blue-200 mb-4">
          Gleritas is a next-generation token built on Binance Smart Chain with a focus on community governance and sustainable growth.
        </p>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-[#243b5c] rounded-lg border border-[#2a4365]">
            <p className="text-xs text-blue-300">Token Symbol</p>
            <p className="font-medium text-white">GLRS</p>
          </div>
          <div className="p-3 bg-[#243b5c] rounded-lg border border-[#2a4365]">
            <p className="text-xs text-blue-300">Network</p>
            <p className="font-medium text-white">BEP-20 (BSC)</p>
          </div>
          <div className="p-3 bg-[#243b5c] rounded-lg border border-[#2a4365]">
            <p className="text-xs text-blue-300">Total Supply</p>
            <p className="font-medium text-white">1,000,000,000</p>
          </div>
          <div className="p-3 bg-[#243b5c] rounded-lg border border-[#2a4365]">
            <p className="text-xs text-blue-300">Airdrop Amount</p>
            <p className="font-medium text-white">5,000,000 GLRS</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            className="flex-1 bg-[#243b5c] hover:bg-[#2d4a71] py-2 rounded flex items-center justify-center text-sm text-blue-200 border border-[#2a4365]"
            onClick={() => window.open('https://gleritas.io', '_blank')}
          >
            <Globe className="h-4 w-4 mr-1" />
            Website
          </Button>
          <Button 
            variant="outline"
            className="flex-1 bg-[#243b5c] hover:bg-[#2d4a71] py-2 rounded flex items-center justify-center text-sm text-blue-200 border border-[#2a4365]"
            onClick={() => window.open('https://drive.google.com/file/d/1d1e154XQTxAb-JRizElQgGpjMx8yJvmk/view?usp=drive_link', '_blank')}
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
