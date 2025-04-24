import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  ShieldAlert, 
  ShieldCheck, 
  RotateCcw, 
  Search, 
  AlertCircle, 
  Check,
  UserX,
  UserCheck,
  Wallet,
  Trash2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@shared/schema';

interface BanUserData {
  userId: number;
  banReason: string;
}

interface ResetTokensData {
  userId: number;
  reason: string;
}

const AdminUserManagementTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isUnbanDialogOpen, setIsUnbanDialogOpen] = useState(false);
  const [isResetTokensDialogOpen, setIsResetTokensDialogOpen] = useState(false);
  const [isResetTasksDialogOpen, setIsResetTasksDialogOpen] = useState(false);
  const [isResetDataDialogOpen, setIsResetDataDialogOpen] = useState(false);
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [resetReason, setResetReason] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    retry: false,
    gcTime: 0
  });

  // Ban user mutation
  const banUserMutation = useMutation({
    mutationFn: async (data: BanUserData) => {
      const res = await fetch(`/api/admin/users/${data.userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ banReason: data.banReason })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to ban user');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsBanDialogOpen(false);
      setBanReason('');
      toast({
        title: "User banned",
        description: "The user has been banned successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to ban user",
        description: error.message || "An error occurred while banning the user",
        variant: "destructive"
      });
    }
  });

  // Unban user mutation
  const unbanUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to unban user');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsUnbanDialogOpen(false);
      toast({
        title: "User unbanned",
        description: "The user has been unbanned successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to unban user",
        description: error.message || "An error occurred while unbanning the user",
        variant: "destructive"
      });
    }
  });

  // Reset tokens mutation
  const resetTokensMutation = useMutation({
    mutationFn: async (data: ResetTokensData) => {
      const res = await fetch(`/api/admin/users/${data.userId}/reset-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: data.reason })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reset user tokens');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsResetTokensDialogOpen(false);
      setResetReason('');
      toast({
        title: "Tokens reset",
        description: "The user's tokens have been reset to zero",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to reset tokens",
        description: error.message || "An error occurred while resetting the user's tokens",
        variant: "destructive"
      });
    }
  });
  
  // Reset tasks mutation
  const resetTasksMutation = useMutation({
    mutationFn: async (data: ResetTokensData) => {
      const res = await fetch(`/api/admin/users/${data.userId}/reset-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: data.reason })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reset user tasks');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsResetTasksDialogOpen(false);
      setResetReason('');
      toast({
        title: "Tasks reset",
        description: "The user's completed tasks have been reset",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to reset tasks",
        description: error.message || "An error occurred while resetting the user's tasks",
        variant: "destructive"
      });
    }
  });
  
  // Reset full user data mutation
  const resetDataMutation = useMutation({
    mutationFn: async (data: ResetTokensData) => {
      const res = await fetch(`/api/admin/users/${data.userId}/reset-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: data.reason })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reset user data');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsResetDataDialogOpen(false);
      setResetReason('');
      toast({
        title: "Data reset",
        description: "The user's data has been reset. They'll need to reconnect Telegram and complete tasks again.",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to reset user data",
        description: error.message || "An error occurred while resetting the user's data",
        variant: "destructive"
      });
    }
  });

  const handleOpenBanDialog = (user: User) => {
    setSelectedUser(user);
    setBanReason('');
    setIsBanDialogOpen(true);
  };

  const handleOpenUnbanDialog = (user: User) => {
    setSelectedUser(user);
    setIsUnbanDialogOpen(true);
  };

  const handleOpenResetTokensDialog = (user: User) => {
    setSelectedUser(user);
    setResetReason('');
    setIsResetTokensDialogOpen(true);
  };
  
  const handleOpenResetTasksDialog = (user: User) => {
    setSelectedUser(user);
    setResetReason('');
    setIsResetTasksDialogOpen(true);
  };
  
  const handleOpenResetDataDialog = (user: User) => {
    setSelectedUser(user);
    setResetReason('');
    setIsResetDataDialogOpen(true);
  };
  
  const handleOpenDeleteUserDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteConfirmation('');
    setIsDeleteUserDialogOpen(true);
  };

  const handleBanUser = () => {
    if (!selectedUser) return;
    
    if (!banReason.trim()) {
      toast({
        title: "Ban reason required",
        description: "Please provide a reason for banning this user",
        variant: "destructive"
      });
      return;
    }
    
    banUserMutation.mutate({
      userId: selectedUser.id,
      banReason: banReason
    });
  };

  const handleUnbanUser = () => {
    if (!selectedUser) return;
    unbanUserMutation.mutate(selectedUser.id);
  };

  const handleResetTokens = () => {
    if (!selectedUser) return;
    
    resetTokensMutation.mutate({
      userId: selectedUser.id,
      reason: resetReason
    });
  };
  
  const handleResetTasks = () => {
    if (!selectedUser) return;
    
    resetTasksMutation.mutate({
      userId: selectedUser.id,
      reason: resetReason
    });
  };
  
  const handleResetData = () => {
    if (!selectedUser) return;
    
    resetDataMutation.mutate({
      userId: selectedUser.id,
      reason: resetReason
    });
  };
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch(`/api/admin/users/${userId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsDeleteUserDialogOpen(false);
      toast({
        title: "User deleted",
        description: "The user has been permanently deleted from the system",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete user",
        description: error.message || "An error occurred while deleting the user",
        variant: "destructive"
      });
    }
  });
  
  const handleDeleteUser = () => {
    if (!selectedUser) return;
    
    if (deleteConfirmation !== selectedUser.username) {
      toast({
        title: "Confirmation required",
        description: "Please type the username correctly to confirm deletion",
        variant: "destructive"
      });
      return;
    }
    
    deleteUserMutation.mutate(selectedUser.id);
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.walletAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="relative w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#172a41] border-[#2a4365]"
          />
        </div>
      </div>
      
      <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">User List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
            </div>
          ) : filteredUsers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#2a4365]">
                      <TableHead className="text-white">Username</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white">Wallet</TableHead>
                      <TableHead className="text-white text-right">Tokens</TableHead>
                      <TableHead className="text-white text-right">Referrals</TableHead>
                      <TableHead className="text-white text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map(user => (
                      <TableRow key={user.id} className="border-b border-[#2a4365]">
                        <TableCell className="font-medium">
                          {user.username}
                          <div className="text-xs text-gray-400">
                            ID: {user.id} • Code: {user.referralCode}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isBanned ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <ShieldAlert className="h-3 w-3" />
                              Banned
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800 flex items-center gap-1 w-fit">
                              <ShieldCheck className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                          {user.isBanned && user.banReason && (
                            <div className="text-xs text-red-400 mt-1">
                              Reason: {user.banReason}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.walletAddress ? (
                            <div className="text-sm">
                              <div className="flex items-center text-green-400">
                                <Check className="h-3 w-3 mr-1" />
                                Connected
                              </div>
                              <div className="text-xs text-gray-400 truncate max-w-[120px]">
                                {user.walletAddress}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">Not connected</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{user.totalTokens}</TableCell>
                        <TableCell className="text-right">{user.referralCount}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {user.isBanned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenUnbanDialog(user)}
                                className="h-8 border-green-700 bg-green-900/20 text-green-400 hover:bg-green-800/30"
                              >
                                <UserCheck className="h-4 w-4 mr-1" />
                                Unban
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenBanDialog(user)}
                                className="h-8 border-red-700 bg-red-900/20 text-red-400 hover:bg-red-800/30"
                              >
                                <UserX className="h-4 w-4 mr-1" />
                                Ban
                              </Button>
                            )}
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenResetTokensDialog(user)}
                                className="h-8 border-yellow-700 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-800/30"
                              >
                                <Wallet className="h-4 w-4 mr-1" />
                                Reset Tokens
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenResetTasksDialog(user)}
                                className="h-8 border-blue-700 bg-blue-900/20 text-blue-400 hover:bg-blue-800/30"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reset Tasks
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenResetDataDialog(user)}
                                className="h-8 border-red-700 bg-red-900/20 text-red-400 hover:bg-red-800/30"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Reset All
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDeleteUserDialog(user)}
                                className="h-8 border-red-950 bg-red-950/40 text-red-300 hover:bg-red-950/60"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete User
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Logic for showing pagination numbers around current page
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage > 3) {
                          pageNum = currentPage - 3 + i + 1;
                        }
                        if (currentPage > totalPages - 2) {
                          pageNum = totalPages - 5 + i + 1;
                        }
                      }
                      
                      if (pageNum <= totalPages) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink onClick={() => setCurrentPage(totalPages)}>
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      </>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              {searchQuery ? "No users found matching your search" : "No users found"}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Ban User Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ShieldAlert className="h-5 w-5 mr-2 text-red-400" />
              Ban User
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                You are about to ban user:
              </p>
              <div className="bg-[#172a41] p-2 rounded text-sm mb-4">
                <span className="font-bold">{selectedUser?.username}</span>
                {selectedUser?.walletAddress && (
                  <div className="text-xs text-gray-400 mt-1">
                    Wallet: {selectedUser.walletAddress}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-300 mb-2">
                Please provide a reason for banning this user:
              </p>
              <Textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for ban..."
                className="bg-[#172a41] border-[#2a4365] mb-2"
              />
              <p className="text-xs text-red-400 flex items-start">
                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                Banning this user will prevent them from participating in the airdrop. This action can be undone later.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBanDialogOpen(false)}
              className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleBanUser}
              disabled={banUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {banUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Unban User Dialog */}
      <Dialog open={isUnbanDialogOpen} onOpenChange={setIsUnbanDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ShieldCheck className="h-5 w-5 mr-2 text-green-400" />
              Unban User
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                You are about to unban user:
              </p>
              <div className="bg-[#172a41] p-2 rounded text-sm mb-4">
                <span className="font-bold">{selectedUser?.username}</span>
                {selectedUser?.walletAddress && (
                  <div className="text-xs text-gray-400 mt-1">
                    Wallet: {selectedUser.walletAddress}
                  </div>
                )}
              </div>
              {selectedUser?.banReason && (
                <div className="bg-red-900/20 border border-red-800 rounded p-2 mb-4">
                  <p className="text-sm text-red-400 mb-1">Ban Reason:</p>
                  <p className="text-sm text-gray-300">{selectedUser.banReason}</p>
                </div>
              )}
              <p className="text-xs text-green-400 flex items-start">
                <Check className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                Unbanning this user will allow them to participate in the airdrop again.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUnbanDialogOpen(false)}
              className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleUnbanUser}
              disabled={unbanUserMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {unbanUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Unban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Tokens Only Dialog */}
      <Dialog open={isResetTokensDialogOpen} onOpenChange={setIsResetTokensDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2 text-yellow-400" />
              Reset User Tokens
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                You are about to reset tokens for user:
              </p>
              <div className="bg-[#172a41] p-2 rounded text-sm mb-4">
                <span className="font-bold">{selectedUser?.username}</span>
                <div className="flex items-center mt-1">
                  <Wallet className="h-3 w-3 mr-1 text-yellow-400" />
                  <span className="text-yellow-400">
                    Current Balance: {selectedUser?.totalTokens || 0} GLRS <span className="text-red-400">(will be reset to 0)</span>
                  </span>
                </div>
              </div>
              
              <div className="bg-yellow-950/30 border border-yellow-800 rounded p-3 mb-4">
                <p className="text-sm font-medium text-yellow-400 mb-2">This action will:</p>
                <ul className="list-disc pl-5 mb-2 space-y-1 text-xs text-gray-300">
                  <li>Reset token balance to zero</li>
                  <li>Reset referral tokens to zero</li>
                </ul>
                <p className="text-xs text-yellow-400">The user will keep all completed tasks and connections.</p>
              </div>
              
              <p className="text-sm text-gray-300 mb-2">
                Please provide a reason for resetting tokens (optional):
              </p>
              <Textarea
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="Reason for token reset..."
                className="bg-[#172a41] border-[#2a4365] mb-2"
              />
              <p className="text-xs text-yellow-400 flex items-start font-medium">
                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                This action cannot be undone. The token balance will be set to zero.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetTokensDialogOpen(false)}
              className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleResetTokens}
              disabled={resetTokensMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {resetTokensMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Reset Tokens
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset Tasks Only Dialog */}
      <Dialog open={isResetTasksDialogOpen} onOpenChange={setIsResetTasksDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <RotateCcw className="h-5 w-5 mr-2 text-blue-400" />
              Reset User Tasks
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                You are about to reset tasks for user:
              </p>
              <div className="bg-[#172a41] p-2 rounded text-sm mb-4">
                <span className="font-bold">{selectedUser?.username}</span>
                <div className="flex items-center mt-1">
                  <Check className="h-3 w-3 mr-1 text-blue-400" />
                  <span className="text-blue-400">
                    Completed Tasks: <span className="text-red-400">(will be deleted)</span>
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-950/30 border border-blue-800 rounded p-3 mb-4">
                <p className="text-sm font-medium text-blue-400 mb-2">This action will:</p>
                <ul className="list-disc pl-5 mb-2 space-y-1 text-xs text-gray-300">
                  <li>Delete all task completion history</li>
                  <li>Allow the user to complete tasks again</li>
                </ul>
                <p className="text-xs text-blue-400">The user will keep their token balance and account connections.</p>
              </div>
              
              <p className="text-sm text-gray-300 mb-2">
                Please provide a reason for resetting tasks (optional):
              </p>
              <Textarea
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="Reason for tasks reset..."
                className="bg-[#172a41] border-[#2a4365] mb-2"
              />
              <p className="text-xs text-blue-400 flex items-start font-medium">
                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                This action cannot be undone. All task completion records will be deleted.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetTasksDialogOpen(false)}
              className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleResetTasks}
              disabled={resetTasksMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {resetTasksMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Reset Tasks
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reset All User Data Dialog */}
      <Dialog open={isResetDataDialogOpen} onOpenChange={setIsResetDataDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <RotateCcw className="h-5 w-5 mr-2 text-red-400" />
              Reset All User Data
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                You are about to reset ALL data for user:
              </p>
              <div className="bg-[#172a41] p-2 rounded text-sm mb-4">
                <span className="font-bold">{selectedUser?.username}</span>
                {selectedUser?.walletAddress && (
                  <div className="text-xs text-gray-400 mt-1">
                    Wallet: {selectedUser.walletAddress} <span className="text-red-400">(will be removed)</span>
                  </div>
                )}
                {selectedUser?.telegramId && (
                  <div className="text-xs text-gray-400 mt-1">
                    Telegram ID: {selectedUser.telegramId} <span className="text-red-400">(will be removed)</span>
                  </div>
                )}
                <div className="flex items-center mt-1">
                  <Wallet className="h-3 w-3 mr-1 text-yellow-400" />
                  <span className="text-yellow-400">
                    Current Balance: {selectedUser?.totalTokens || 0} GLRS <span className="text-red-400">(will be reset to 0)</span>
                  </span>
                </div>
              </div>
              
              <div className="bg-red-950/30 border border-red-800 rounded p-3 mb-4">
                <p className="text-sm font-medium text-red-400 mb-2">This action will:</p>
                <ul className="list-disc pl-5 mb-2 space-y-1 text-xs text-gray-300">
                  <li>Delete all task completion history</li>
                  <li>Remove Telegram connection</li>
                  <li>Clear wallet address</li>
                  <li>Reset token balance to zero</li>
                  <li>Reset referral tokens to zero</li>
                </ul>
                <p className="text-xs text-red-400">This is a full user reset. They will need to start over with everything.</p>
              </div>
              
              <p className="text-sm text-gray-300 mb-2">
                Please provide a reason for the full reset (optional):
              </p>
              <Textarea
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="Reason for full user data reset..."
                className="bg-[#172a41] border-[#2a4365] mb-2"
              />
              <p className="text-xs text-red-400 flex items-start font-medium">
                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                This action cannot be undone. All user tasks, connections, and tokens will be removed.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsResetDataDialogOpen(false)}
              className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleResetData}
              disabled={resetDataMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {resetDataMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Reset All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete User Dialog */}
      <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-red-400" />
              Delete User Permanently
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <div className="bg-red-950/30 border border-red-800 rounded p-3 mb-4">
                <p className="text-sm font-medium text-red-400 mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Warning: Permanent Action
                </p>
                <p className="text-xs text-gray-300 mb-2">
                  You are about to permanently delete this user from the system. This action:
                </p>
                <ul className="list-disc pl-5 mb-2 space-y-1 text-xs text-gray-300">
                  <li>Cannot be undone</li>
                  <li>Will remove the user from all records</li>
                  <li>Will delete all their completed tasks and tokens</li>
                  <li>Will remove the username from the system, allowing someone else to claim it</li>
                </ul>
              </div>
              
              <p className="text-sm text-gray-300 mb-2">
                User to be deleted:
              </p>
              <div className="bg-[#172a41] p-2 rounded text-sm mb-4">
                <span className="font-bold">{selectedUser?.username}</span>
                <div className="text-xs text-gray-400 mt-1">
                  ID: {selectedUser?.id} • Tokens: {selectedUser?.totalTokens || 0} GLRS
                </div>
                {selectedUser?.walletAddress && (
                  <div className="text-xs text-gray-400 mt-1">
                    Wallet: {selectedUser.walletAddress}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-red-400 font-medium">
                  To confirm deletion, type the username "{selectedUser?.username}" below:
                </p>
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={`Type ${selectedUser?.username} to confirm`}
                  className="bg-[#172a41] border-[#2a4365]"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteUserDialogOpen(false)}
              className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending || deleteConfirmation !== selectedUser?.username}
              className="bg-red-700 hover:bg-red-800 text-white"
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagementTab;