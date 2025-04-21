import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, WalletIcon, Award, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalCompletedTasks: number;
  totalTokensClaimed: number;
}

interface AdminHomeTabProps {
  adminStats?: AdminStats;
  isLoadingStats: boolean;
}

const AdminHomeTab: React.FC<AdminHomeTabProps> = ({ adminStats, isLoadingStats }) => {
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    retry: false,
    gcTime: 0
  });

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
              ) : (
                adminStats?.totalUsers || 0
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Total registered users</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex items-center">
              <WalletIcon className="h-5 w-5 mr-2 text-yellow-400" />
              Connected Wallets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin text-yellow-400" />
              ) : (
                adminStats?.activeUsers || 0
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Users with wallets connected</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
              Completed Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin text-green-400" />
              ) : (
                adminStats?.totalCompletedTasks || 0
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Total completed user tasks</p>
          </CardContent>
        </Card>
        
        <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-400" />
              GLRS Claimed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              ) : (
                adminStats?.totalTokensClaimed || 0
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">Total GLRS tokens claimed</p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg">
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a4365]">
                    <th className="py-3 px-4 text-left">Username</th>
                    <th className="py-3 px-4 text-left">Wallet Connected</th>
                    <th className="py-3 px-4 text-right">Total Tokens</th>
                    <th className="py-3 px-4 text-right">Referrals</th>
                    <th className="py-3 px-4 text-right">Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map((user: any) => (
                    <tr key={user.id} className="border-b border-[#2a4365] hover:bg-[#172a41]">
                      <td className="py-3 px-4">{user.username}</td>
                      <td className="py-3 px-4">
                        {user.walletAddress ? (
                          <span className="text-green-400 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Connected
                          </span>
                        ) : (
                          <span className="text-gray-400">Not connected</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">{user.totalTokens}</td>
                      <td className="py-3 px-4 text-right">{user.referralCount}</td>
                      <td className="py-3 px-4 text-right">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">No users found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminHomeTab;