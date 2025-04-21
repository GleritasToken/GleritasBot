import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { 
  Loader2, 
  Users, 
  WalletIcon, 
  Award, 
  CheckCircle, 
  LayoutDashboard, 
  BarChart,
  ListTodo,
  UserCog,
  CreditCard
} from 'lucide-react';
import AdminTasksTab from '@/components/AdminTasksTab';
import AdminHomeTab from '@/components/AdminHomeTab';
import AdminUserManagementTab from '@/components/AdminUserManagementTab';
import AdminWithdrawalsTab from '@/components/AdminWithdrawalsTab';
import AdminAnalyticsTab from '@/components/AdminAnalyticsTab';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  
  interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    totalCompletedTasks: number;
    totalTokensClaimed: number;
  }

  const { data: adminStats, isLoading: isLoadingStats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    gcTime: 0,
    retry: false
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>
      
      <Tabs defaultValue="home" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="home" className="flex items-center">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center">
            <UserCog className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center">
            <ListTodo className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="withdrawals" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Withdrawals
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="home">
          <AdminHomeTab adminStats={adminStats} isLoadingStats={isLoadingStats} />
        </TabsContent>
        
        <TabsContent value="users">
          <AdminUserManagementTab />
        </TabsContent>
        
        <TabsContent value="tasks">
          <AdminTasksTab />
        </TabsContent>
        
        <TabsContent value="withdrawals">
          <AdminWithdrawalsTab />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AdminAnalyticsTab />
        </TabsContent>
      </Tabs>
      
      {/* Footer with padding for mobile nav */}
      <div className="h-16 md:h-0"></div>
    </div>
  );
};

export default AdminPage;