import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Search, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Calendar,
  CreditCard,
  DollarSign,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  Info
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Withdrawal } from '@shared/schema';

interface EnrichedWithdrawal extends Withdrawal {
  username: string;
}

interface ActionData {
  action: 'approve' | 'reject';
  notes?: string;
  rejectionReason?: string;
}

const AdminWithdrawalsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<EnrichedWithdrawal | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [copiedTxHash, setCopiedTxHash] = useState<string | null>(null);
  
  const itemsPerPage = 10;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: withdrawals = [], isLoading } = useQuery<EnrichedWithdrawal[]>({
    queryKey: ['/api/admin/withdrawals'],
    retry: false,
    gcTime: 0
  });

  // Update withdrawal status mutation
  const updateWithdrawalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: ActionData }) => {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update withdrawal');
      }
      
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/withdrawals'] });
      setIsApproveDialogOpen(false);
      setIsRejectDialogOpen(false);
      setAdminNotes('');
      setRejectionReason('');
      toast({
        title: `Withdrawal ${variables.data.action === 'approve' ? 'approved' : 'rejected'}`,
        description: `The withdrawal has been ${variables.data.action === 'approve' ? 'approved' : 'rejected'} successfully`,
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update withdrawal",
        description: error.message || "An error occurred while updating the withdrawal",
        variant: "destructive"
      });
    }
  });

  const handleOpenApproveDialog = (withdrawal: EnrichedWithdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setAdminNotes('');
    setIsApproveDialogOpen(true);
  };

  const handleOpenRejectDialog = (withdrawal: EnrichedWithdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const handleApproveWithdrawal = () => {
    if (!selectedWithdrawal) return;
    
    updateWithdrawalMutation.mutate({
      id: selectedWithdrawal.id,
      data: {
        action: 'approve',
        notes: adminNotes || undefined
      }
    });
  };

  const handleRejectWithdrawal = () => {
    if (!selectedWithdrawal) return;
    
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please provide a reason for rejecting this withdrawal",
        variant: "destructive"
      });
      return;
    }
    
    updateWithdrawalMutation.mutate({
      id: selectedWithdrawal.id,
      data: {
        action: 'reject',
        rejectionReason
      }
    });
  };

  const toggleRowExpanded = (id: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxHash(text);
    setTimeout(() => setCopiedTxHash(null), 2000);
  };

  // Get withdrawal status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-800 flex items-center gap-1 w-fit">
            <AlertCircle className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800 flex items-center gap-1 w-fit">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-800 text-gray-400 border-gray-700 flex items-center gap-1 w-fit">
            {status}
          </Badge>
        );
    }
  };

  // Filter and search withdrawals
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = 
      withdrawal.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      withdrawal.walletAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (withdrawal.txHash && withdrawal.txHash.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterStatus) {
      return matchesSearch && withdrawal.status === filterStatus;
    }
    
    return matchesSearch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredWithdrawals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWithdrawals = filteredWithdrawals.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Withdrawal Management</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterStatus(null)}
              className={`px-3 py-1.5 rounded-md text-sm ${!filterStatus ? 'bg-[#1c3252] text-white' : 'bg-[#172a41] text-gray-400 hover:bg-[#1c3252]'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-md text-sm ${filterStatus === 'pending' ? 'bg-[#1c3252] text-yellow-400' : 'bg-[#172a41] text-gray-400 hover:bg-[#1c3252]'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus('processing')}
              className={`px-3 py-1.5 rounded-md text-sm ${filterStatus === 'processing' ? 'bg-[#1c3252] text-blue-400' : 'bg-[#172a41] text-gray-400 hover:bg-[#1c3252]'}`}
            >
              Processing
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-md text-sm ${filterStatus === 'completed' ? 'bg-[#1c3252] text-green-400' : 'bg-[#172a41] text-gray-400 hover:bg-[#1c3252]'}`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-3 py-1.5 rounded-md text-sm ${filterStatus === 'rejected' ? 'bg-[#1c3252] text-red-400' : 'bg-[#172a41] text-gray-400 hover:bg-[#1c3252]'}`}
            >
              Rejected
            </button>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search withdrawals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#172a41] border-[#2a4365]"
            />
          </div>
        </div>
      </div>
      
      <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
            </div>
          ) : filteredWithdrawals.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-[#2a4365]">
                      <TableHead className="text-white"></TableHead>
                      <TableHead className="text-white">User</TableHead>
                      <TableHead className="text-white">Status</TableHead>
                      <TableHead className="text-white text-right">Amount</TableHead>
                      <TableHead className="text-white text-right">Fee Paid</TableHead>
                      <TableHead className="text-white text-right">Date</TableHead>
                      <TableHead className="text-white text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedWithdrawals.map(withdrawal => {
                      const isExpanded = expandedRows.has(withdrawal.id);
                      return (
                        <React.Fragment key={withdrawal.id}>
                          <TableRow className="border-b border-[#2a4365] hover:bg-[#172a41] cursor-pointer" onClick={() => toggleRowExpanded(withdrawal.id)}>
                            <TableCell className="w-10">
                              <Button variant="ghost" size="icon" className="h-6 w-6 p-0 rounded-full">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                            <TableCell className="font-medium">
                              {withdrawal.username}
                              <div className="text-xs text-gray-400">
                                ID: {withdrawal.id}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(withdrawal.status)}
                              {withdrawal.status === 'rejected' && withdrawal.rejectionReason && (
                                <div className="text-xs text-red-400 mt-1 max-w-[150px] truncate">
                                  {withdrawal.rejectionReason}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {withdrawal.amount} GLRS
                            </TableCell>
                            <TableCell className="text-right">
                              {withdrawal.bnbFeeCollected ? (
                                <Badge variant="outline" className="bg-green-900/20 text-green-400 border-green-800">
                                  Paid
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-900/20 text-yellow-400 border-yellow-800">
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-gray-400 text-sm">
                              {new Date(withdrawal.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {withdrawal.status === 'pending' && (
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenApproveDialog(withdrawal);
                                    }}
                                    className="h-8 border-green-700 bg-green-900/20 text-green-400 hover:bg-green-800/30"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenRejectDialog(withdrawal);
                                    }}
                                    className="h-8 border-red-700 bg-red-900/20 text-red-400 hover:bg-red-800/30"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                              {withdrawal.status !== 'pending' && (
                                <span className="text-gray-400 text-sm">
                                  {withdrawal.status === 'processing' ? 'Processing...' : 
                                   withdrawal.status === 'completed' ? 'Completed' : 
                                   withdrawal.status === 'rejected' ? 'Rejected' : 
                                   withdrawal.status}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow className="bg-[#172a41]">
                              <TableCell colSpan={7} className="py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                                  <div>
                                    <h4 className="text-sm font-bold mb-2 text-gray-300">Withdrawal Details</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex items-start">
                                        <DollarSign className="h-4 w-4 mr-2 mt-0.5 text-green-400" />
                                        <div>
                                          <div className="font-medium">Amount</div>
                                          <div className="text-gray-400">{withdrawal.amount} GLRS</div>
                                        </div>
                                      </div>
                                      <div className="flex items-start">
                                        <CreditCard className="h-4 w-4 mr-2 mt-0.5 text-blue-400" />
                                        <div>
                                          <div className="font-medium">Wallet Address</div>
                                          <div className="text-gray-400 break-all">{withdrawal.walletAddress}</div>
                                        </div>
                                      </div>
                                      <div className="flex items-start">
                                        <Calendar className="h-4 w-4 mr-2 mt-0.5 text-yellow-400" />
                                        <div>
                                          <div className="font-medium">Created At</div>
                                          <div className="text-gray-400">
                                            {new Date(withdrawal.createdAt).toLocaleString()}
                                          </div>
                                        </div>
                                      </div>
                                      {withdrawal.txHash && (
                                        <div className="flex items-start">
                                          <ExternalLink className="h-4 w-4 mr-2 mt-0.5 text-purple-400" />
                                          <div>
                                            <div className="font-medium">Transaction Hash</div>
                                            <div className="text-gray-400 break-all flex items-center">
                                              <a 
                                                href={`https://bscscan.com/tx/${withdrawal.txHash}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="hover:text-blue-400 mr-2"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                {withdrawal.txHash}
                                              </a>
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  copyToClipboard(withdrawal.txHash!);
                                                }}
                                                className="hover:text-blue-400"
                                              >
                                                {copiedTxHash === withdrawal.txHash ? (
                                                  <Check className="h-4 w-4" />
                                                ) : (
                                                  <Copy className="h-4 w-4" />
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold mb-2 text-gray-300">Admin Info</h4>
                                    <div className="space-y-2 text-sm">
                                      {withdrawal.adminNotes && (
                                        <div className="bg-blue-900/20 border border-blue-800 rounded p-2">
                                          <p className="text-blue-400 text-xs mb-1">Admin Notes:</p>
                                          <p className="text-gray-300">{withdrawal.adminNotes}</p>
                                        </div>
                                      )}
                                      {withdrawal.status === 'rejected' && withdrawal.rejectionReason && (
                                        <div className="bg-red-900/20 border border-red-800 rounded p-2">
                                          <p className="text-red-400 text-xs mb-1">Rejection Reason:</p>
                                          <p className="text-gray-300">{withdrawal.rejectionReason}</p>
                                        </div>
                                      )}
                                      {withdrawal.approvedBy && (
                                        <div className="bg-green-900/20 border border-green-800 rounded p-2">
                                          <p className="text-green-400 text-xs mb-1">Approved By:</p>
                                          <p className="text-gray-300">Admin ID: {withdrawal.approvedBy}</p>
                                          {withdrawal.approvedAt && (
                                            <p className="text-gray-400 text-xs mt-1">
                                              {new Date(withdrawal.approvedAt).toLocaleString()}
                                            </p>
                                          )}
                                        </div>
                                      )}
                                      {!withdrawal.adminNotes && !withdrawal.rejectionReason && !withdrawal.approvedBy && (
                                        <div className="flex items-center justify-center h-20 bg-[#1c3252] rounded border border-[#2a4365]">
                                          <Info className="h-5 w-5 mr-2 text-gray-400" />
                                          <span className="text-gray-400">No admin actions recorded</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
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
              {searchQuery || filterStatus ? "No withdrawals found matching your criteria" : "No withdrawals found"}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Approve Withdrawal Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
              Approve Withdrawal
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                You are about to approve this withdrawal request:
              </p>
              <div className="bg-[#172a41] p-2 rounded text-sm mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{selectedWithdrawal?.username}</span>
                  <span className="text-green-400 font-bold">{selectedWithdrawal?.amount} GLRS</span>
                </div>
                <div className="text-xs text-gray-400 mt-1 break-all">
                  Wallet: {selectedWithdrawal?.walletAddress}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Fee Status: {selectedWithdrawal?.bnbFeeCollected ? 'Paid' : 'Pending'}
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-2">
                Add notes (optional):
              </p>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Admin notes..."
                className="bg-[#172a41] border-[#2a4365] mb-2"
              />
              <p className="text-xs text-green-400 flex items-start">
                <CheckCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                Approving will change the status to "processing" and queue it for distribution.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
              className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleApproveWithdrawal}
              disabled={updateWithdrawalMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {updateWithdrawalMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Approve Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject Withdrawal Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <XCircle className="h-5 w-5 mr-2 text-red-400" />
              Reject Withdrawal
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-300 mb-2">
                You are about to reject this withdrawal request:
              </p>
              <div className="bg-[#172a41] p-2 rounded text-sm mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{selectedWithdrawal?.username}</span>
                  <span className="text-green-400 font-bold">{selectedWithdrawal?.amount} GLRS</span>
                </div>
                <div className="text-xs text-gray-400 mt-1 break-all">
                  Wallet: {selectedWithdrawal?.walletAddress}
                </div>
              </div>
              <p className="text-sm text-gray-300 mb-2">
                Please provide a reason for rejecting this withdrawal:
              </p>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Rejection reason..."
                className="bg-[#172a41] border-[#2a4365] mb-2"
              />
              <p className="text-xs text-red-400 flex items-start">
                <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                Rejected withdrawals will return the tokens to the user's balance.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={handleRejectWithdrawal}
              disabled={updateWithdrawalMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {updateWithdrawalMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Reject Withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawalsTab;