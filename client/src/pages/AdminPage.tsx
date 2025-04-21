import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users, WalletIcon, Award, CheckCircle } from 'lucide-react';
import AdminTasksTab from '../components/AdminTasksTab';
import AdminHomeTab from '../components/AdminHomeTab';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  
  const { data: adminStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/admin/stats'],
    gcTime: 0,
    retry: false,
    onError: (error) => {
      console.error("Failed to load admin stats:", error);
    }
  });

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>
      
      <Tabs defaultValue="home" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="home">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Manage Tasks</TabsTrigger>
        </TabsList>
        
        <TabsContent value="home">
          <AdminHomeTab adminStats={adminStats} isLoadingStats={isLoadingStats} />
        </TabsContent>
        
        <TabsContent value="tasks">
          <AdminTasksTab />
        </TabsContent>
      </Tabs>
      
      {/* Footer with padding for mobile nav */}
      <div className="h-16 md:h-0"></div>
    </div>
  );
};

export default AdminPage;