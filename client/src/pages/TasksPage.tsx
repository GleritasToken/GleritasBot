import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/providers/UserProvider';
import { CheckCircle, CircleDashed, ArrowRight, AlertTriangle, AlertCircle, ExternalLink, MessageCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Task } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ConfettiEffect from '@/components/ConfettiEffect';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TelegramConnectDialog from '@/components/TelegramConnectDialog';

interface VerificationData {
  taskName: string;
  taskId: number;
  verificationData: string;
}

const TasksPage: React.FC = () => {
  const { user, refreshUser } = useUser();
  const [activeTab, setActiveTab] = useState<string>("available");
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [telegramConnectOpen, setTelegramConnectOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [verificationData, setVerificationData] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch all tasks
  const { data: allTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tasks');
      return response.json();
    }
  });
  
  // Telegram verification mutation
  const telegramVerifyMutation = useMutation({
    mutationFn: async (data: {userId: number, taskId: string, telegramId?: number}) => {
      const response = await apiRequest('POST', '/api/verify-task', data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Verification failed. Please make sure you've completed the task.");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        refreshUser();
        setShowConfetti(true);
        
        toast({
          title: "Task Verified!",
          description: "You've earned GLRS tokens for completing this task!",
        });
        
        // Auto-switch to completed tab after a delay
        setTimeout(() => {
          setActiveTab('completed');
          setCompletedTaskId(null);
        }, 2000);
      } else {
        toast({
          title: "Verification Failed",
          description: data.error || "Please make sure you've completed the task first.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Complete task mutation (legacy)
  const completeMutation = useMutation({
    mutationFn: async (data: {taskName: string; verificationData?: string}) => {
      const response = await apiRequest('POST', '/api/tasks/complete', data);
      
      // If response is 202 (Accepted), it means additional verification is required
      if (response.status === 202) {
        const data = await response.json();
        // If there's a redirectUrl, we need to redirect the user
        if (data.redirectUrl) {
          window.open(data.redirectUrl, '_blank', 'noopener,noreferrer');
        }
        throw new Error(data.message || "Please complete the task via the provided link.");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      refreshUser();
      setShowConfetti(true);
      setVerificationDialogOpen(false);
      setVerificationData("");
      setVerificationError("");
      
      toast({
        title: "Task Completed!",
        description: "You've earned GLRS tokens for completing this task!",
      });
      
      // Auto-switch to completed tab after a delay
      setTimeout(() => {
        setActiveTab('completed');
        setCompletedTaskId(null);
      }, 2000);
    },
    onError: (error: Error) => {
      // Don't show error toast for pending verification tasks that have been redirected
      if (error.message.includes("Please complete the task via the provided link")) {
        toast({
          title: "Task Started",
          description: "Please complete the task via the provided link and then verify completion.",
        });
        return;
      }
      
      setVerificationError(error.message || "Failed to complete task. Please try again.");
      
      // Only show toast for non-verification dialog errors
      if (!verificationDialogOpen) {
        toast({
          title: "Task Verification Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });
  
  // Filter tasks
  const completedTaskNames = user?.tasks?.filter(task => task.completed).map(task => task.taskName) || [];
  
  const hasTelegramConnect = completedTaskNames.includes('telegram_connect');
  
  // Filter available tasks based on Telegram connection status
  const availableTasks = allTasks?.filter(task => {
    // First, don't show any completed tasks
    if (completedTaskNames.includes(task.name)) {
      return false;
    }
    
    // If user hasn't connected Telegram, ONLY show the telegram_connect task
    if (!user?.telegramId) {
      return task.name === 'telegram_connect';
    }
    
    // If user has connected Telegram, show all other uncompleted tasks
    return true;
  }) || [];
  
  const completedTasks = user?.tasks?.filter(task => task.completed) || [];
  
  // Open verification dialog for tasks that need verification
  const openVerificationDialog = (task: Task) => {
    setCurrentTask(task);
    setVerificationData("");
    setVerificationError("");
    setVerificationDialogOpen(true);
  };
  
  // Handle task verification submission
  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentTask) return;
    
    if (!verificationData.trim()) {
      setVerificationError("Please provide verification data to complete this task.");
      return;
    }
    
    setCompletedTaskId(`task-${currentTask.id}`);
    completeMutation.mutate({ 
      taskName: currentTask.name, 
      verificationData: verificationData.trim() 
    });
  };
  
  // Handle task action (start or verify)
  const handleTaskAction = (task: Task) => {
    // Set the task as the one being completed (for animation)
    setCompletedTaskId(`task-${task.id}`);
    
    // For Telegram-specific tasks, use our new verification API
    if (task.name === 'telegram_channel' || task.name === 'telegram_group') {
      // If the task has a link, open it first
      if (task.link) {
        window.open(task.link, '_blank', 'noopener,noreferrer');
      }
      
      // Check if user has connected their Telegram account
      if (!user?.telegramId) {
        // Suggest connecting Telegram account
        toast({
          title: "Telegram Account Required",
          description: "Please connect your Telegram account to verify this task automatically.",
          action: (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-xs py-1 px-2 h-auto"
              onClick={() => setTelegramConnectOpen(true)}
            >
              Connect Now
            </Button>
          )
        });
        return;
      }
      
      if (user) {
        // Show a helpful toast notification
        toast({
          title: "Verifying your task...",
          description: "Please make sure you've joined the channel/group before verification.",
        });
        
        // Use the Telegram verification API
        telegramVerifyMutation.mutate({
          userId: user.id,
          taskId: task.name,
          telegramId: user.telegramId
        });
      }
      return;
    }
    
    // For other tasks that require verification, open the verification dialog
    if (needsVerification(task)) {
      openVerificationDialog(task);
      return;
    }
    
    // For simple tasks or tasks with links only
    // If the task has a link, just open the link and don't auto-complete
    if (task.link) {
      window.open(task.link, '_blank', 'noopener,noreferrer');
      // Request completion but with notification that verification will be needed
      completeMutation.mutate({ taskName: task.name });
    } else {
      // For tasks without links, try to complete directly
      completeMutation.mutate({ taskName: task.name });
    }
  };
  
  // Determine if a task needs verification input
  const needsVerification = (task: Task): boolean => {
    return ['wallet_submit', 'twitter_follow', 'twitter_retweet', 'telegram_group', 'telegram_channel'].includes(task.name);
  };
  
  // Get the verification field label and placeholder based on task type
  const getVerificationFieldInfo = (taskName: string): {label: string; placeholder: string} => {
    switch (taskName) {
      case 'wallet_submit':
        return {
          label: 'Your BSC Wallet Address',
          placeholder: '0x...'
        };
      case 'twitter_follow':
        return {
          label: 'Your Twitter Username',
          placeholder: '@username'
        };
      case 'twitter_retweet':
        return {
          label: 'Retweet Link',
          placeholder: 'https://twitter.com/...'
        };
      case 'telegram_group':
        return {
          label: 'Your Telegram Username',
          placeholder: '@username'
        };
      case 'telegram_channel':
        return {
          label: 'Your Telegram Username',
          placeholder: '@username'
        };
      default:
        return {
          label: 'Verification',
          placeholder: 'Enter verification data...'
        };
    }
  };
  
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 30 
      }
    },
    completed: {
      scale: [1, 1.05, 1],
      backgroundColor: ["#243b5c", "#1a7f4b", "#243b5c"],
      transition: { duration: 1.5 }
    }
  };
  
  // Get task icon class
  const getTaskIcon = (taskName: string) => {
    const iconMap: Record<string, string> = {
      'telegram_group': 'bg-blue-500',
      'telegram_channel': 'bg-blue-400',
      'twitter_follow': 'bg-sky-500',
      'twitter_retweet': 'bg-sky-400',
      'discord_join': 'bg-purple-500',
      'wallet_submit': 'bg-amber-500',
      'website_visit': 'bg-green-500',
    };
    
    return iconMap[taskName] || 'bg-gray-500';
  };
  
  // Get task description
  const getTaskDescription = (taskName: string) => {
    const task = allTasks?.find(t => t.name === taskName);
    return task?.description || 'Complete this task to earn GLRS tokens.';
  };

  return (
    <div className="min-h-screen bg-[#12243B] text-white pb-16 md:pb-0">
      <Navigation />
      
      {/* Confetti effect */}
      <ConfettiEffect 
        run={showConfetti} 
        duration={2000} 
        onComplete={() => setShowConfetti(false)} 
      />
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="bg-[#1c3252] border-[#2a4365]">
          <CardHeader className="bg-[#172a41] border-b border-[#2a4365]">
            <CardTitle className="text-lg">
              Tasks & Rewards
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="available" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="available" className="data-[state=active]:bg-blue-600">
                  <CircleDashed className="h-4 w-4 mr-2" />
                  Available Tasks
                </TabsTrigger>
                <TabsTrigger value="completed" className="data-[state=active]:bg-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Completed Tasks
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="available">
                {/* Telegram Connect Button - show if user doesn't have telegramId */}
                {!user?.telegramId ? (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-[#1a2e47] border-blue-500/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-blue-500 p-2 rounded-full mr-3">
                              <MessageCircle className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-medium">Connect Telegram Account</h3>
                              <p className="text-sm text-gray-400">Required to participate in airdrop</p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => setTelegramConnectOpen(true)}
                          >
                            Connect
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="mt-8 text-center py-12">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
                      <h3 className="text-xl font-medium mb-2">Step 1: Connect Telegram Account</h3>
                      <p className="text-gray-400 mb-2">
                        You must connect your Telegram account before you can access other airdrop tasks.
                        This is the first required step of the airdrop process.
                      </p>
                      <p className="text-amber-400 font-medium">
                        Completing this task will reward you with 2 GLRS tokens!
                      </p>
                      <Button 
                        size="lg" 
                        className="bg-blue-600 hover:bg-blue-700 mt-4"
                        onClick={() => setTelegramConnectOpen(true)}
                      >
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Connect Your Telegram Account
                      </Button>
                    </div>
                  </motion.div>
                ) : availableTasks.length === 0 ? (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-xl font-medium mb-2">All Tasks Completed!</h3>
                    <p className="text-gray-400 mb-4">
                      You've completed all available tasks. Check back later for more opportunities to earn GLRS tokens.
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {availableTasks.map((task, index) => (
                      <motion.div
                        key={`task-${task.id}`}
                        id={`task-${task.id}`}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        custom={index} 
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                      >
                        <Card className="bg-[#243b5c] border-[#2a4365] hover:border-blue-500 transition-all duration-300">
                          <CardContent className="p-4">
                            <div className="flex items-start">
                              <div className={`${getTaskIcon(task.name)} p-3 rounded-full mr-4 shrink-0`}>
                                <span className="sr-only">Task Icon</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                  <h3 className="font-medium text-lg">
                                    {task.name.split('_').map(word => 
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')}
                                  </h3>
                                  <span className="flex items-center bg-[#1c3252] px-3 py-1 rounded-full text-sm text-amber-400 font-medium md:ml-2">
                                    +{task.tokenAmount} GLRS
                                  </span>
                                </div>
                                <p className="text-gray-300 text-sm mb-4">
                                  {getTaskDescription(task.name)}
                                </p>
                                <div className="flex justify-end">
                                  <Button 
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 relative overflow-hidden group"
                                    onClick={() => handleTaskAction(task)}
                                    disabled={completeMutation.isPending}
                                  >
                                    {completeMutation.isPending && completedTaskId === `task-${task.id}` ? (
                                      <>
                                        <motion.span 
                                          className="absolute inset-0 bg-green-500" 
                                          initial={{ width: 0 }}
                                          animate={{ width: "100%" }}
                                          transition={{ duration: 2 }}
                                        />
                                        <span className="relative">Processing...</span>
                                      </>
                                    ) : (
                                      <>
                                        {task.link ? 'Go to Task' : (needsVerification(task) ? 'Verify Task' : 'Complete Task')}
                                        {task.link ? 
                                          <ExternalLink className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" /> :
                                          <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        }
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {completedTasks.length === 0 ? (
                  <motion.div 
                    className="text-center py-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CircleDashed className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-xl font-medium mb-2">No Tasks Completed Yet</h3>
                    <p className="text-gray-400 mb-4">
                      You haven't completed any tasks yet. Start earning GLRS tokens by completing the available tasks.
                    </p>
                    <Button 
                      onClick={() => setActiveTab('available')}
                      className="relative overflow-hidden group"
                    >
                      <span className="relative z-10">View Available Tasks</span>
                      <motion.span 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                        initial={{ width: 0, left: "50%" }}
                        whileHover={{ width: "100%", left: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {completedTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial="hidden"
                        animate="visible"
                        variants={cardVariants}
                        custom={index}
                        whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                      >
                        <Card className="bg-[#243b5c] border-[#2a4365] border-green-500/30">
                          <CardContent className="p-4">
                            <div className="flex items-start">
                              <motion.div 
                                className="bg-green-500 p-3 rounded-full mr-4 shrink-0"
                                whileHover={{ scale: 1.1 }}
                              >
                                <CheckCircle className="h-5 w-5 text-white" />
                              </motion.div>
                              <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                  <h3 className="font-medium text-lg">
                                    {task.taskName.split('_').map(word => 
                                      word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')}
                                  </h3>
                                  <motion.span 
                                    className="flex items-center bg-[#1c3252] px-3 py-1 rounded-full text-sm text-amber-400 font-medium md:ml-2"
                                    whileHover={{ 
                                      scale: 1.05, 
                                      backgroundColor: "rgba(76, 29, 149, 0.3)" 
                                    }}
                                  >
                                    +{task.tokenAmount} GLRS
                                  </motion.span>
                                </div>
                                <p className="text-gray-300 text-sm mb-2">
                                  {getTaskDescription(task.taskName)}
                                </p>
                                <div className="bg-[#1c3252] rounded p-2 text-xs text-gray-400">
                                  <span>Completed on {new Date(task.completedAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Footer with padding for mobile nav */}
      <div className="h-16 md:h-0"></div>
      
      {/* Telegram Connect Dialog */}
      <TelegramConnectDialog
        isOpen={telegramConnectOpen}
        onClose={() => setTelegramConnectOpen(false)}
        onSuccess={() => {
          refreshUser();
          toast({
            title: "Telegram Connected",
            description: "Your Telegram account has been linked successfully. You can now verify Telegram tasks automatically.",
          });
        }}
      />
      
      {/* Task Verification Dialog */}
      <Dialog open={verificationDialogOpen} onOpenChange={setVerificationDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle>Verify Task Completion</DialogTitle>
            <DialogDescription className="text-gray-400">
              {currentTask?.name === 'telegram_group' || currentTask?.name === 'telegram_channel' ? (
                <>
                  To verify this task automatically, make sure you've completed these steps:
                  <ol className="list-decimal pl-5 mt-2 space-y-1">
                    <li>Join the {currentTask.name === 'telegram_group' ? 'Telegram group' : 'Telegram channel'}</li>
                    <li>Ensure you're using the same Telegram account that's connected to this app</li>
                    <li>Click "Verify Automatically" below to check your membership</li>
                  </ol>
                </>
              ) : (
                currentTask ? (
                  <>Please provide verification for completing the "{currentTask.name.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}" task.</>
                ) : 'Please provide verification to complete this task.'
              )}
            </DialogDescription>
          </DialogHeader>
          
          {(currentTask?.name === 'telegram_group' || currentTask?.name === 'telegram_channel') ? (
            <div className="space-y-4 py-4">
              {verificationError && (
                <div className="flex items-center bg-red-900/30 text-red-200 p-3 rounded text-sm mb-4">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <p>{verificationError}</p>
                </div>
              )}
              
              <p className="text-sm text-white/80">
                Our system will verify your membership in the {currentTask.name === 'telegram_group' ? 'Telegram group' : 'Telegram channel'} automatically using the Telegram Bot API.
              </p>
              
              {currentTask.link && (
                <div className="flex items-center text-sm mt-2 text-blue-400">
                  <p>If you haven't joined yet, <a 
                    href={currentTask.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-300"
                    onClick={() => {
                      if (currentTask.link) {
                        window.open(currentTask.link, '_blank', 'noopener,noreferrer');
                      }
                    }}
                  >click here</a> to join now.</p>
                </div>
              )}
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVerificationDialogOpen(false)}
                  className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  disabled={telegramVerifyMutation.isPending}
                  onClick={() => {
                    if (!currentTask || !user) return;
                    
                    setVerificationDialogOpen(false);
                    setCompletedTaskId(`task-${currentTask.id}`);
                    
                    // Use the Telegram verification API with the stored telegramId
                    telegramVerifyMutation.mutate({
                      userId: user.id,
                      taskId: currentTask.name,
                      telegramId: user.telegramId
                    });
                  }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  {telegramVerifyMutation.isPending && (
                    <motion.div
                      className="mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <CircleDashed className="h-4 w-4" />
                    </motion.div>
                  )}
                  Verify Automatically
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleVerificationSubmit}>
              <div className="space-y-4 py-4">
                {verificationError && (
                  <div className="flex items-center bg-red-900/30 text-red-200 p-3 rounded text-sm mb-4">
                    <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <p>{verificationError}</p>
                  </div>
                )}
                
                {currentTask && (
                  <div className="grid gap-4">
                    <Label htmlFor="verification-data" className="text-sm">
                      {getVerificationFieldInfo(currentTask.name).label}
                    </Label>
                    <Input
                      id="verification-data"
                      value={verificationData}
                      onChange={e => setVerificationData(e.target.value)}
                      placeholder={getVerificationFieldInfo(currentTask.name).placeholder}
                      className="bg-[#172a41] border-[#2a4365]"
                    />
                    
                    {currentTask.link && (
                      <div className="flex items-center text-sm mt-2 text-blue-400">
                        <p>If you haven't completed the task yet, <a 
                          href={currentTask.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-300"
                          onClick={() => {
                            if (currentTask.link) {
                              window.open(currentTask.link, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        >click here</a> to get started.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVerificationDialogOpen(false)}
                  className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={completeMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  {completeMutation.isPending && (
                    <motion.div
                      className="mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <CircleDashed className="h-4 w-4" />
                    </motion.div>
                  )}
                  Verify & Complete
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksPage;