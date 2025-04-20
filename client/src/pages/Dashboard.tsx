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
import { useTelegram } from '@/providers/TelegramProvider';
import { enableTelegramBackButton, expandTelegramWebApp } from '@/lib/telegram-app';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLocation } from 'wouter';

const Dashboard: React.FC = () => {
  const { user, isLoading: userLoading } = useUser();
  const { isTelegram, telegramUser, webApp } = useTelegram();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Expand Telegram WebApp when dashboard loads
  useEffect(() => {
    if (isTelegram) {
      expandTelegramWebApp();
      
      // Setup back button if in Telegram
      enableTelegramBackButton(() => {
        // Navigate back to landing page when back button is clicked
        setLocation('/landing');
      });
    }
  }, [isTelegram, setLocation]);

  // Use Telegram user if available, otherwise use the regular user
  const effectiveUser = telegramUser || user;
  
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
    if (!effectiveUser || !effectiveUser.tasks) return [];
    return effectiveUser.tasks;
  }, [effectiveUser]);

  // Loading state
  if ((userLoading && !isTelegram) || tasksLoading) {
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
        {isTelegram && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2l-19 9.6 6.5 2.4M21.5 2l-9.3 14-4.4-5" />
              <path d="M16.8 16.7L9 12" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Telegram Mini App
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Welcome, {telegramUser?.username || 'Guest'}! Complete tasks to earn GLRS tokens.
              </p>
            </div>
          </div>
        )}
        
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
