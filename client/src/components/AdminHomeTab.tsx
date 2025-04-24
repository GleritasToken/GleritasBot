import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users, WalletIcon, Award, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get users data
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    retry: false,
    gcTime: 0
  });
  
  // Get token allocation stats
  const { data: tokenAllocation, isLoading: isLoadingAllocation } = useQuery({
    queryKey: ['/api/admin/token-allocation'],
    retry: false,
    gcTime: 0
  });
  
  // Delete all users mutation
  const deleteAllUsersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/delete-all-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete all users');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "System Reset Complete",
        description: "All users and related data have been deleted successfully",
        variant: "default"
      });
      setIsDeleteDialogOpen(false);
      
      // Refresh all admin data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/token-allocation'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete all users",
        variant: "destructive"
      });
    }
  });
  
  // Calculate token allocation percentage
  const tokenPercentage = React.useMemo(() => {
    if (!tokenAllocation || !tokenAllocation.data) return 0;
    const { totalTokensClaimed, totalAllocation } = tokenAllocation.data;
    return (totalTokensClaimed / totalAllocation) * 100;
  }, [tokenAllocation]);

  return (
    <div>
      {/* Token Allocation Card */}
      <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center">
            <Award className="h-5 w-5 mr-2 text-amber-400" />
            GLRS Token Allocation
          </CardTitle>
          <CardDescription>
            Total allocation: 500,000 GLRS tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAllocation ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
            </div>
          ) : tokenAllocation?.data ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Tokens Claimed</span>
                <span className="font-bold text-amber-400">
                  {tokenAllocation.data.totalTokensClaimed.toLocaleString()} / {tokenAllocation.data.totalAllocation.toLocaleString()} GLRS
                </span>
              </div>
              <Progress 
                value={tokenPercentage} 
                max={100} 
                className="h-2" 
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>{tokenPercentage.toFixed(2)}% claimed</span>
                <span>{(100 - tokenPercentage).toFixed(2)}% remaining</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400">Failed to load token allocation data</div>
          )}
        </CardContent>
      </Card>
      
      {/* System Reset Card */}
      <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center text-red-400">
            <Trash2 className="h-5 w-5 mr-2" />
            System Reset
          </CardTitle>
          <CardDescription>
            Delete all users and data after testing phase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-red-900/30 border-red-800 mb-4">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              Warning: This action will permanently delete all users, tasks, referrals, and withdrawals. Use only when moving from testing to production phase.
            </AlertDescription>
          </Alert>
          
          <Button 
            variant="destructive" 
            className="w-full mt-2"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Users
          </Button>
        </CardContent>
      </Card>
      
      {/* Stats Cards */}
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
          ) : users && Array.isArray(users) && users.length > 0 ? (
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
                  {Array.isArray(users) && users.slice(0, 10).map((user: any) => (
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
      
      {/* Confirmation Dialog for System Reset */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Confirm System Reset
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              This action will permanently delete all users, tasks, referrals, and withdrawals from the system.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert className="bg-red-900/30 border-red-800">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-300">
                Only proceed if you are moving from testing to production phase and want to start with a clean database.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAllUsersMutation.mutate()}
              disabled={deleteAllUsersMutation.isPending}
            >
              {deleteAllUsersMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete All Users"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHomeTab;