import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { VerificationAttempt } from '@shared/schema';
import { 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  User, 
  Calendar, 
  Loader2 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

const AdminVerificationsTab: React.FC = () => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('');
  const [currentAttempt, setCurrentAttempt] = useState<VerificationAttempt | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch verification attempts
  const { data: verifications, isLoading, error } = useQuery<VerificationAttempt[]>({
    queryKey: ['/api/admin/verifications'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/verifications');
      return response.json();
    }
  });
  
  // Approve verification mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      const response = await apiRequest('POST', `/api/admin/verifications/${id}/approve`, { notes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      toast({
        title: "Verification approved",
        description: "The verification attempt has been approved successfully.",
      });
      
      setApprovalNotes('');
      setApproveDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to approve verification",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Reject verification mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest('POST', `/api/admin/verifications/${id}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      
      toast({
        title: "Verification rejected",
        description: "The verification attempt has been rejected.",
      });
      
      setRejectionReason('');
      setRejectDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject verification",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle approve button click
  const handleApprove = (attempt: VerificationAttempt) => {
    setCurrentAttempt(attempt);
    setApproveDialogOpen(true);
  };
  
  // Handle reject button click
  const handleReject = (attempt: VerificationAttempt) => {
    setCurrentAttempt(attempt);
    setRejectDialogOpen(true);
  };
  
  // Submit approval
  const submitApproval = () => {
    if (!currentAttempt) return;
    approveMutation.mutate({ id: currentAttempt.id, notes: approvalNotes });
  };
  
  // Submit rejection
  const submitRejection = () => {
    if (!currentAttempt || !rejectionReason.trim()) return;
    rejectMutation.mutate({ id: currentAttempt.id, reason: rejectionReason });
  };
  
  // Format task name for display
  const formatTaskName = (taskName: string) => {
    return taskName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };
  
  // Format date for display
  const formatDate = (dateString: string | Date) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center text-amber-400"><Clock className="w-4 h-4 mr-1" /> Pending</span>;
      case 'approved':
        return <span className="flex items-center text-green-500"><CheckCircle className="w-4 h-4 mr-1" /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center text-red-500"><X className="w-4 h-4 mr-1" /> Rejected</span>;
      default:
        return <span className="flex items-center text-gray-400"><AlertCircle className="w-4 h-4 mr-1" /> Unknown</span>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Loading verification attempts...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="bg-[#1c3252] border-[#2a4365]">
        <CardContent className="pt-6">
          <div className="text-center text-red-400">
            <AlertCircle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-xl font-medium mb-2">Failed to Load Verifications</h3>
            <p>There was an error loading the verification attempts. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const pendingVerifications = verifications?.filter(v => v.status === 'pending') || [];
  
  return (
    <>
      <Card className="bg-[#1c3252] border-[#2a4365]">
        <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
          <CardTitle className="text-lg">Verification Attempts</CardTitle>
          <CardDescription>
            Review and manage task verification attempts from users
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {pendingVerifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
              <h3 className="text-xl font-medium mb-2">No Pending Verifications</h3>
              <p className="text-gray-400">
                There are no verification attempts awaiting review at this time.
              </p>
            </div>
          ) : (
            <Table>
              <TableCaption>
                {pendingVerifications.length} pending verification attempts
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Verification Data</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingVerifications.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell>{attempt.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-blue-400" />
                        {attempt.userId}
                      </div>
                    </TableCell>
                    <TableCell>{formatTaskName(attempt.taskName)}</TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">
                      {attempt.verificationData}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(attempt.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(attempt.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleApprove(attempt)}
                          disabled={approveMutation.isPending}
                          className="border-green-600 hover:bg-green-900 text-green-500"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleReject(attempt)}
                          disabled={rejectMutation.isPending}
                          className="border-red-600 hover:bg-red-900 text-red-500"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle>Approve Verification</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to approve this verification attempt?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentAttempt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">User ID:</span>
                  <span>{currentAttempt.userId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Task:</span>
                  <span>{formatTaskName(currentAttempt.taskName)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Verification Data:</span>
                  <span className="font-mono text-xs max-w-[200px] truncate">
                    {currentAttempt.verificationData}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="approval-notes" className="text-sm font-medium text-gray-200">
                Approval Notes (Optional)
              </label>
              <Textarea 
                id="approval-notes"
                value={approvalNotes} 
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Add any notes about this approval..."
                className="bg-[#243b5c] border-[#2a4365] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setApproveDialogOpen(false)}
              className="border-gray-600 hover:bg-[#172a41]"
            >
              Cancel
            </Button>
            <Button 
              onClick={submitApproval}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please provide a reason for rejecting this verification attempt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {currentAttempt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">User ID:</span>
                  <span>{currentAttempt.userId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Task:</span>
                  <span>{formatTaskName(currentAttempt.taskName)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Verification Data:</span>
                  <span className="font-mono text-xs max-w-[200px] truncate">
                    {currentAttempt.verificationData}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="rejection-reason" className="text-sm font-medium text-gray-200">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <Textarea 
                id="rejection-reason"
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this verification is being rejected..."
                className="bg-[#243b5c] border-[#2a4365] text-white"
                required
              />
              {rejectDialogOpen && !rejectionReason.trim() && (
                <p className="text-xs text-red-500">A rejection reason is required</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRejectDialogOpen(false)}
              className="border-gray-600 hover:bg-[#172a41]"
            >
              Cancel
            </Button>
            <Button 
              onClick={submitRejection}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminVerificationsTab;