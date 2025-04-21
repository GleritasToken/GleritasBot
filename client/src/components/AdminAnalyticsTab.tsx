import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Loader2, PieChart as PieChartIcon, BarChart as BarChartIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from '@tanstack/react-query';

interface TaskStats {
  taskName: string;
  taskDescription: string;
  completionCount: number;
  completionPercentage: number;
  tokenAmount: number;
  totalTokensAwarded: number;
}

interface DailyStats {
  date: string;
  newUsers: number;
  tasksCompleted: number;
  tokensDistributed: number;
}

interface TaskTypeBreakdown {
  taskType: string;
  count: number;
  percentage: number;
}

interface AnalyticsData {
  taskStats: TaskStats[];
  dailyStats: DailyStats[];
  taskTypeBreakdown: TaskTypeBreakdown[];
  totalUsers: number;
  activeUsers: number;
  totalCompletedTasks: number;
  totalTokensAwarded: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#172a41] border border-[#2a4365] rounded p-3 shadow-lg">
        <p className="text-gray-200 font-medium mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

const AdminAnalyticsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('daily');
  
  const { data: taskStats, isLoading: isLoadingTaskStats } = useQuery<TaskStats[]>({
    queryKey: ['/api/admin/task-stats'],
    retry: false,
    gcTime: 0
  });
  
  const { data: activityStats, isLoading: isLoadingActivityStats } = useQuery<{
    dailyStats: DailyStats[];
    taskTypeBreakdown: TaskTypeBreakdown[];
  }>({
    queryKey: ['/api/admin/user-activity'],
    retry: false,
    gcTime: 0
  });

  if (isLoadingTaskStats || isLoadingActivityStats) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
      </div>
    );
  }

  const dailyStats = activityStats?.dailyStats || [];
  const taskTypeBreakdown = activityStats?.taskTypeBreakdown || [];
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>
      
      <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="daily" className="flex items-center">
            <BarChartIcon className="h-4 w-4 mr-2" />
            Daily Activity
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center">
            <PieChartIcon className="h-4 w-4 mr-2" />
            Task Completion
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily">
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Daily User Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {dailyStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={dailyStats}
                        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a4365" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#8884d8" 
                          angle={-45} 
                          textAnchor="end"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar 
                          dataKey="newUsers" 
                          name="New Users" 
                          fill="#0088FE" 
                          stackId="a" 
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="tasksCompleted" 
                          name="Tasks Completed" 
                          fill="#00C49F" 
                          stackId="b"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="tokensDistributed" 
                          name="Tokens Distributed" 
                          fill="#FFBB28" 
                          stackId="c" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No daily activity data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Task Type Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {taskTypeBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={taskTypeBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="taskType"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {taskTypeBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend formatter={(value) => <span className="text-gray-300">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No task breakdown data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="tasks">
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Task Completion Rates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {taskStats && taskStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={taskStats}
                        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a4365" />
                        <XAxis 
                          dataKey="taskName" 
                          stroke="#8884d8" 
                          angle={-45} 
                          textAnchor="end"
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar 
                          dataKey="completionCount" 
                          name="Completions" 
                          fill="#0088FE"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="totalTokensAwarded" 
                          name="Tokens Awarded" 
                          fill="#00C49F"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No task statistics available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Task Completion Percentage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {taskStats && taskStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={taskStats}
                        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a4365" />
                        <XAxis 
                          type="number" 
                          domain={[0, 100]}
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                        />
                        <YAxis 
                          dataKey="taskName" 
                          type="category" 
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          width={150}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar 
                          dataKey="completionPercentage" 
                          name="Completion %" 
                          fill="#FFBB28"
                          radius={[0, 4, 4, 0]}
                          label={{ 
                            position: 'right', 
                            fill: '#fff',
                            formatter: (value: number) => `${value.toFixed(1)}%`
                          }}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400">No task statistics available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalyticsTab;