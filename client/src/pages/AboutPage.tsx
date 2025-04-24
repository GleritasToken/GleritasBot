import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, FileText, MessageCircle, Twitter, Globe, Trophy, Loader2 } from 'lucide-react';

const AboutPage: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Fetch leaderboard data
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/leaderboard');
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        console.error('Leaderboard fetch error:', err);
        setError('Could not load leaderboard data');
        toast({
          title: "Error",
          description: "Failed to load leaderboard data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [toast]);
  
  return (
    <div className="min-h-screen bg-[#12243B] text-white pb-16 md:pb-0">
      <Navigation />
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* About GLRS section */}
        <Card className="bg-[#1c3252] border-[#2a4365] mb-6">
          <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
            <CardTitle className="flex items-center text-lg">
              About GLRS Token
            </CardTitle>
            <CardDescription className="text-gray-400">
              Learn more about Gleritas Token and our community
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">Welcome to GLRS</h3>
              <p className="text-gray-300 mb-4">
                Gleritas (GLRS) is a BEP-20 token built on the Binance Smart Chain (BSC). Gleritas (GLRS) is a next-generation blockchain-powered cryptocurrency built to seamlessly connect the world of digital assets with the fast-growing e-commerce industry. Our mission is to empower both merchants and consumers by providing fast, secure, and cost-effective payment solutions that goes beyond traditional systems.
              </p>
            </div>
            
            {/* Resources section */}
            <div className="mb-8">
              <h3 className="font-medium text-lg mb-4">Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="https://drive.google.com/file/d/1d1e154XQTxAb-JRizElQgGpjMx8yJvmk/view?usp=drive_link" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="bg-[#243b5c] border-[#2a4365] hover:border-blue-500 transition-colors">
                    <CardContent className="p-4 flex items-center">
                      <div className="bg-blue-500/20 p-3 rounded-full mr-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Whitepaper</h4>
                        <p className="text-sm text-gray-400">Read our detailed project documentation</p>
                      </div>
                      <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
                    </CardContent>
                  </Card>
                </a>
                
                <a 
                  href="https://Gleritastoken.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="bg-[#243b5c] border-[#2a4365] hover:border-blue-500 transition-colors">
                    <CardContent className="p-4 flex items-center">
                      <div className="bg-purple-500/20 p-3 rounded-full mr-3">
                        <Globe className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Website</h4>
                        <p className="text-sm text-gray-400">Visit our official website</p>
                      </div>
                      <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
                    </CardContent>
                  </Card>
                </a>
              </div>
            </div>
            
            {/* Community section */}
            <div>
              <h3 className="font-medium text-lg mb-4">Join Our Community</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a 
                  href="https://t.me/gleritaschat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="bg-[#243b5c] border-[#2a4365] hover:border-blue-500 transition-colors">
                    <CardContent className="p-4 flex items-center">
                      <div className="bg-blue-500/20 p-3 rounded-full mr-3">
                        <MessageCircle className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Telegram Channel</h4>
                        <p className="text-sm text-gray-400">Join our Telegram channel for announcements</p>
                      </div>
                      <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
                    </CardContent>
                  </Card>
                </a>
                
                <a 
                  href="https://t.me/+hcJdayisPFIxOGVk" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="bg-[#243b5c] border-[#2a4365] hover:border-blue-500 transition-colors">
                    <CardContent className="p-4 flex items-center">
                      <div className="bg-blue-500/20 p-3 rounded-full mr-3">
                        <MessageCircle className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Telegram Group</h4>
                        <p className="text-sm text-gray-400">Join our Telegram community group</p>
                      </div>
                      <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
                    </CardContent>
                  </Card>
                </a>
                
                <a 
                  href="https://twitter.com/GleritasToken" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="bg-[#243b5c] border-[#2a4365] hover:border-blue-500 transition-colors">
                    <CardContent className="p-4 flex items-center">
                      <div className="bg-sky-500/20 p-3 rounded-full mr-3">
                        <Twitter className="h-5 w-5 text-sky-500" />
                      </div>
                      <div>
                        <h4 className="font-medium">Twitter</h4>
                        <p className="text-sm text-gray-400">Follow us on Twitter for updates</p>
                      </div>
                      <ExternalLink className="h-4 w-4 ml-auto text-gray-400" />
                    </CardContent>
                  </Card>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Token Metrics section */}
        {/* Leaderboard Section */}
        <Card className="bg-[#1c3252] border-[#2a4365] mb-6">
          <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
            <CardTitle className="flex items-center text-lg">
              <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
              Leaderboard
            </CardTitle>
            <CardDescription className="text-gray-400">
              Top 50 users with most GLRS tokens earned
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-400">Loading leaderboard data...</span>
              </div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 text-center text-red-300">
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 bg-transparent border-red-800 hover:bg-red-900/30 text-red-300"
                  onClick={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center p-8 text-gray-400">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-600 opacity-50" />
                <p>No users on the leaderboard yet. Be the first!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#172a41] text-gray-300">
                      <th className="py-3 px-4 text-left font-medium text-xs uppercase tracking-wider">#</th>
                      <th className="py-3 px-4 text-left font-medium text-xs uppercase tracking-wider">Username</th>
                      <th className="py-3 px-4 text-left font-medium text-xs uppercase tracking-wider">Tokens Earned</th>
                      <th className="py-3 px-4 text-left font-medium text-xs uppercase tracking-wider">Referrals</th>
                      <th className="py-3 px-4 text-left font-medium text-xs uppercase tracking-wider">Wallet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((user, index) => (
                      <tr 
                        key={index} 
                        className={`border-b border-[#2a4365] ${
                          index === 0 ? 'bg-yellow-500/10' : 
                          index === 1 ? 'bg-gray-400/10' : 
                          index === 2 ? 'bg-amber-700/10' : 
                          index % 2 === 0 ? 'bg-[#1c3252]' : 'bg-[#243b5c]'
                        } hover:bg-blue-900/20`}
                      >
                        <td className="py-3 px-4 whitespace-nowrap">
                          {index === 0 ? (
                            <span className="text-yellow-500 font-bold">🥇 1</span>
                          ) : index === 1 ? (
                            <span className="text-gray-400 font-bold">🥈 2</span>
                          ) : index === 2 ? (
                            <span className="text-amber-700 font-bold">🥉 3</span>
                          ) : (
                            index + 1
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium">
                          {user.username}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-amber-400 font-medium">
                          {user.totalTokens.toFixed(2)} GLRS
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-blue-400">
                          {user.referralCount}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {user.walletConnected ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400">
                              Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-400">
                              Not connected
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Token Metrics section */}
        <Card className="bg-[#1c3252] border-[#2a4365]">
          <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
            <CardTitle className="flex items-center text-lg">
              Token Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3">Token Information</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-[#2a4365]">
                    <dt className="text-gray-400">Token Name</dt>
                    <dd className="font-medium">Gleritas</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2a4365]">
                    <dt className="text-gray-400">Token Symbol</dt>
                    <dd className="font-medium">GLRS</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2a4365]">
                    <dt className="text-gray-400">Blockchain</dt>
                    <dd className="font-medium">Binance Smart Chain (BSC)</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2a4365]">
                    <dt className="text-gray-400">Token Standard</dt>
                    <dd className="font-medium">BEP-20</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="font-medium mb-3">Airdrop Details</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-[#2a4365]">
                    <dt className="text-gray-400">Total Airdrop Supply</dt>
                    <dd className="font-medium">500,000 GLRS</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2a4365]">
                    <dt className="text-gray-400">Base Reward</dt>
                    <dd className="font-medium">25 GLRS</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2a4365]">
                    <dt className="text-gray-400">Referral Reward</dt>
                    <dd className="font-medium">0.2 GLRS per referral</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#2a4365]">
                    <dt className="text-gray-400">Max Referrals</dt>
                    <dd className="font-medium">50 per user</dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer with padding for mobile nav */}
      <div className="h-16 md:h-0"></div>
    </div>
  );
};

export default AboutPage;