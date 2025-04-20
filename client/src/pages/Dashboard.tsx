import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import ProgressTracker from '@/components/ProgressTracker';
import TaskCard from '@/components/TaskCard';
import WalletSubmission from '@/components/WalletSubmission';
import ReferralSystem from '@/components/ReferralSystem';
import WithdrawalInfo from '@/components/WithdrawalInfo';
import ProjectInfo from '@/components/ProjectInfo';
import Footer from '@/components/Footer';
import { useUser } from '@/providers/UserProvider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const Dashboard: React.FC = () => {
  const { user, isLoading: userLoading } = useUser();
  const { toast } = useToast();
  
  // Fetch tasks
  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks');
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    }
  });

  // Format user tasks array
  const userTasks = React.useMemo(() => {
    if (!user || !user.tasks) return [];
    return user.tasks;
  }, [user]);

  // Loading state
  if (userLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-gray-500 dark:text-gray-400">Loading airdrop data...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ProgressTracker tasks={tasks || []} userTasks={userTasks} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Task List */}
            <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
                <h3 className="font-semibold text-lg">Required Tasks</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">Earn GLRS Tokens</span>
              </CardHeader>
              
              <CardContent className="p-0 divide-y divide-gray-200 dark:divide-gray-700">
                {tasks && tasks.map((task: any) => {
                  const isCompleted = userTasks.some(
                    (ut: any) => ut.taskName === task.name && ut.completed
                  );
                  
                  return (
                    <TaskCard
                      key={task.id}
                      taskName={task.name}
                      title={task.name.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      description={task.description}
                      tokenAmount={task.tokenAmount}
                      isCompleted={isCompleted}
                      icon={task.iconClass}
                      isRequired={task.isRequired}
                    />
                  );
                })}
              </CardContent>
            </Card>
            
            {/* Wallet Submission Form */}
            <WalletSubmission />
          </div>
          
          <div className="space-y-6">
            {/* Referral System */}
            <ReferralSystem />
            
            {/* Withdrawal Info */}
            <WithdrawalInfo />
            
            {/* Project Info */}
            <ProjectInfo />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
