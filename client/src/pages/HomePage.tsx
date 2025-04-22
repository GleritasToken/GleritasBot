import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import WalletSubmission from '@/components/WalletSubmission';
import TaskCard from '@/components/TaskCard';
import { useUser } from '@/providers/UserProvider';
import { Wallet, Plus, ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileWalletConnect from '@/components/MobileWalletConnect';

const HomePage: React.FC = () => {
  const { user } = useUser();
  const [showConnectWallet, setShowConnectWallet] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const isMobile = useIsMobile();
  const [showMobileWalletConnect, setShowMobileWalletConnect] = useState(false);

  // Filter completed tasks
  const completedTasks = user?.tasks?.filter(task => task.completed) || [];
  
  // For home page, we display up to 7 tasks initially
  const displayedTasks = showAllTasks 
    ? completedTasks 
    : completedTasks.slice(0, 7);
  
  // Handle wallet connection for mobile
  const handleWalletClick = () => {
    if (isMobile) {
      setShowMobileWalletConnect(true);
    } else {
      setShowConnectWallet(!showConnectWallet);
    }
  };
  
  // Handle mobile wallet connection
  const handleMobileWalletConnect = (address: string) => {
    // Handle the wallet connection here
    setShowMobileWalletConnect(false);
  };
  
  // Cancel mobile wallet connection
  const handleMobileWalletCancel = () => {
    setShowMobileWalletConnect(false);
  };

  return (
    <div className="min-h-screen bg-[#12243B] text-white pb-16 md:pb-0">
      <Navigation />
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Wallet section */}
        <div className="mb-8">
          {!user?.walletAddress ? (
            <Card className="bg-[#1c3252] border-[#2a4365] overflow-hidden">
              <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
                <CardTitle className="flex items-center text-lg">
                  <Wallet className="h-5 w-5 mr-2 text-amber-400" />
                  Connect Your Wallet
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {showConnectWallet ? (
                  <WalletSubmission />
                ) : (
                  <div className="text-center">
                    <p className="mb-4 text-gray-300">
                      Connect your BSC wallet to receive your GLRS tokens when the airdrop distribution begins.
                    </p>
                    <Button 
                      onClick={handleWalletClick} 
                      className="bg-amber-500 hover:bg-amber-600 text-black font-medium"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#1c3252] border-[#2a4365]">
              <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
                <CardTitle className="flex items-center text-lg">
                  <Wallet className="h-5 w-5 mr-2 text-amber-400" />
                  Wallet Connected
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div>
                    <p className="text-gray-300 mb-2">Your BSC wallet is connected</p>
                    <p className="font-mono bg-[#243b5c] p-2 rounded border border-[#2a4365] text-sm break-all">
                      {user.walletAddress}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 text-center">
                    <div className="bg-[#243b5c] rounded-lg p-4 border border-[#2a4365]">
                      <p className="text-gray-300 text-sm">Current Balance</p>
                      <p className="text-2xl font-bold text-amber-400">{user.totalTokens} GLRS</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Completed tasks section */}
        <div>
          <Card className="bg-[#1c3252] border-[#2a4365]">
            <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
              <CardTitle className="flex items-center justify-between text-lg">
                <span className="flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-green-400" />
                  Completed Tasks
                </span>
                {completedTasks.length > 0 && (
                  <span className="text-sm bg-[#243b5c] px-2 py-1 rounded-full">
                    {completedTasks.length} completed
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {completedTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-300 mb-4">You haven't completed any tasks yet.</p>
                  <Button onClick={() => window.location.href = '/tasks'}>
                    View Available Tasks
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedTasks.map((task) => (
                      <div key={task.id} className="bg-[#243b5c] rounded-lg border border-[#2a4365] p-4 flex items-start">
                        <div className="bg-green-500/20 p-2 rounded-full mr-3">
                          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium">
                              {task.taskName.split('_').map(word => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </h3>
                            <span className="flex items-center bg-[#1c3252] px-2 py-1 rounded-full text-xs text-amber-400">
                              +{task.tokenAmount} GLRS
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Completed on {new Date(task.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {completedTasks.length > 7 && (
                    <div className="flex justify-center mt-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAllTasks(!showAllTasks)}
                        className="text-blue-400 border-blue-500/30"
                      >
                        {showAllTasks ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-1" />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Show All ({completedTasks.length})
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Mobile wallet connect modal */}
      {showMobileWalletConnect && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <MobileWalletConnect 
            onConnect={handleMobileWalletConnect}
            onCancel={handleMobileWalletCancel}
          />
        </div>
      )}
      
      {/* Footer with padding for mobile nav */}
      <div className="h-16 md:h-0"></div>
    </div>
  );
};

export default HomePage;