import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/providers/UserProvider';
import { CheckCircle, CircleDashed, ArrowRight } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { useQuery } from '@tanstack/react-query';
import { Task } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

const TasksPage: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<string>("available");
  
  // Fetch all tasks
  const { data: allTasks } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tasks');
      return response.json();
    }
  });
  
  // Filter tasks
  const completedTaskNames = user?.tasks?.filter(task => task.completed).map(task => task.taskName) || [];
  
  const availableTasks = allTasks?.filter(task => 
    !completedTaskNames.includes(task.name)
  ) || [];
  
  const completedTasks = user?.tasks?.filter(task => task.completed) || [];
  
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
                {availableTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-xl font-medium mb-2">All Tasks Completed!</h3>
                    <p className="text-gray-400 mb-4">
                      You've completed all available tasks. Check back later for more opportunities to earn GLRS tokens.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableTasks.map((task) => (
                      <Card key={task.id} className="bg-[#243b5c] border-[#2a4365]">
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
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Complete Task
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="completed">
                {completedTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CircleDashed className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                    <h3 className="text-xl font-medium mb-2">No Tasks Completed Yet</h3>
                    <p className="text-gray-400 mb-4">
                      You haven't completed any tasks yet. Start earning GLRS tokens by completing the available tasks.
                    </p>
                    <Button onClick={() => setActiveTab('available')}>
                      View Available Tasks
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {completedTasks.map((task) => (
                      <Card key={task.id} className="bg-[#243b5c] border-[#2a4365]">
                        <CardContent className="p-4">
                          <div className="flex items-start">
                            <div className="bg-green-500 p-3 rounded-full mr-4 shrink-0">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                                <h3 className="font-medium text-lg">
                                  {task.taskName.split('_').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ')}
                                </h3>
                                <span className="flex items-center bg-[#1c3252] px-3 py-1 rounded-full text-sm text-amber-400 font-medium md:ml-2">
                                  +{task.tokenAmount} GLRS
                                </span>
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
    </div>
  );
};

export default TasksPage;