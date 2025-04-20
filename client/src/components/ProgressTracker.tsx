import React from 'react';
import { Progress } from '@/components/ui/progress';
import { useUser } from '@/providers/UserProvider';

interface Task {
  id: number;
  name: string;
  description: string;
  tokenAmount: number;
  isRequired: boolean;
  iconClass: string;
  createdAt: string;
}

interface TaskStatus {
  name: string;
  title: string;
  completed: boolean;
  tokenAmount: number;
  iconClass: string;
}

const ProgressTracker: React.FC<{ tasks: Task[], userTasks: any[] }> = ({ tasks, userTasks }) => {
  const { user } = useUser();
  
  // Create task status array
  const taskStatuses: TaskStatus[] = tasks.map(task => {
    const userTask = userTasks.find(ut => ut.taskName === task.name);
    return {
      name: task.name,
      title: task.name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      completed: !!userTask?.completed,
      tokenAmount: task.tokenAmount,
      iconClass: task.iconClass
    };
  });
  
  // Calculate progress
  const completedTasksCount = taskStatuses.filter(t => t.completed).length;
  const requiredTasksCount = tasks.filter(t => t.isRequired).length;
  const progressPercentage = Math.round((completedTasksCount / requiredTasksCount) * 100);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Your Airdrop Progress</h2>
        <div className="bg-blue-900/30 text-blue-300 py-1 px-3 rounded-full text-sm font-medium flex items-center border border-blue-800">
          <i className="fas fa-coins mr-2"></i>
          <span>{user?.totalTokens || 0} GLRS Earned</span>
        </div>
      </div>
      
      <div className="bg-[#1c3252] rounded-xl shadow-sm p-4 border border-[#2a4365]">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Progress: {completedTasksCount}/{requiredTasksCount} Tasks Completed
          </span>
          <span className="text-sm font-medium text-success-500">{progressPercentage}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2.5 bg-gray-200 dark:bg-gray-700" />
        
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {taskStatuses.map((task) => (
            <div 
              key={task.name}
              className={`flex flex-col items-center p-2 rounded-lg ${
                task.completed 
                  ? "bg-primary-50 dark:bg-primary-900/20" 
                  : "bg-gray-100 dark:bg-gray-800/50"
              } text-center`}
            >
              <i className={`${
                task.completed 
                  ? "fas fa-check-circle text-success-500" 
                  : "fas fa-lock text-gray-400"
              } text-lg mb-1`}></i>
              <span className="text-xs font-medium">
                {task.title}
              </span>
              <span className={`text-xs ${
                task.completed 
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}>
                {task.tokenAmount > 0 ? `+${task.tokenAmount} GLRS` : "Required"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
