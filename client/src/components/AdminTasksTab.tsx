import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, Plus, CheckCircle, Clock } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TaskWithStats {
  id: number;
  name: string;
  description: string;
  tokenAmount: number;
  isRequired: boolean;
  iconClass: string;
  createdAt: string;
  completionCount: number;
  totalTokensAwarded: number;
}

interface TaskFormData {
  name: string;
  description: string;
  tokenAmount: number;
  isRequired: boolean;
  iconClass: string;
  link?: string;
}

const AdminTasksTab: React.FC = () => {
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskWithStats | null>(null);
  const [formData, setFormData] = useState<TaskFormData>({
    name: '',
    description: '',
    tokenAmount: 5,
    isRequired: false,
    iconClass: 'fa fa-check'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<TaskWithStats[]>({
    queryKey: ['/api/admin/tasks'],
    retry: false,
    gcTime: 0
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create task');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      setIsTaskDialogOpen(false);
      toast({
        title: "Task created",
        description: "The task has been created successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create task",
        description: error.message || "An error occurred while creating the task",
        variant: "destructive"
      });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: TaskFormData }) => {
      const res = await fetch(`/api/admin/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update task');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      setIsTaskDialogOpen(false);
      toast({
        title: "Task updated",
        description: "The task has been updated successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update task",
        description: error.message || "An error occurred while updating the task",
        variant: "destructive"
      });
    }
  });

  const handleOpenNewTaskDialog = () => {
    setCurrentTask(null);
    setFormData({
      name: '',
      description: '',
      tokenAmount: 5,
      isRequired: false,
      iconClass: 'fa fa-check'
    });
    setIsTaskDialogOpen(true);
  };

  const handleOpenEditTaskDialog = (task: TaskWithStats) => {
    setCurrentTask(task);
    setFormData({
      name: task.name,
      description: task.description,
      tokenAmount: task.tokenAmount,
      isRequired: task.isRequired,
      iconClass: task.iconClass
    });
    setIsTaskDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description) {
      toast({
        title: "Invalid form data",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    if (currentTask) {
      updateTaskMutation.mutate({ id: currentTask.id, data: formData });
    } else {
      createTaskMutation.mutate(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isRequired: checked }));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Task Management</h2>
        <Button 
          onClick={handleOpenNewTaskDialog}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Task
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
        </div>
      ) : tasks && Array.isArray(tasks) && tasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(tasks) && tasks.map((task: TaskWithStats) => (
            <Card key={task.id} className="bg-[#1c3252] border-[#2a4365] shadow-lg overflow-hidden">
              <CardHeader className="pb-2 bg-[#172a41]">
                <CardTitle className="text-lg font-medium flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2 text-xl">
                      <i className={task.iconClass}></i>
                    </div>
                    {task.name}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleOpenEditTaskDialog(task)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-300 mb-4">{task.description}</p>
                
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-gray-400">Token Reward:</span>
                  <span className="font-medium">{task.tokenAmount} GLRS</span>
                </div>
                
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-gray-400">Required:</span>
                  <span className="font-medium">
                    {task.isRequired ? (
                      <span className="text-green-400 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="text-yellow-400 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Optional
                      </span>
                    )}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="text-gray-400">Completions:</span>
                  <span className="font-medium">{task.completionCount}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Tokens Awarded:</span>
                  <span className="font-medium">{task.totalTokensAwarded} GLRS</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-[#1c3252] border-[#2a4365] shadow-lg">
          <CardContent className="p-12 text-center">
            <p className="text-lg text-gray-400 mb-4">No tasks found</p>
            <Button 
              onClick={handleOpenNewTaskDialog}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Task
            </Button>
          </CardContent>
        </Card>
      )}
      
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <DialogHeader>
            <DialogTitle>{currentTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right text-sm">Name:</label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Task name"
                  className="col-span-3 bg-[#172a41] border-[#2a4365]"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right text-sm">Description:</label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Task description"
                  className="col-span-3 bg-[#172a41] border-[#2a4365]"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="tokenAmount" className="text-right text-sm">Token Reward:</label>
                <Input
                  id="tokenAmount"
                  name="tokenAmount"
                  type="number"
                  value={formData.tokenAmount}
                  onChange={handleNumberChange}
                  min={0}
                  className="col-span-3 bg-[#172a41] border-[#2a4365]"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="iconClass" className="text-right text-sm">Icon Class:</label>
                <Input
                  id="iconClass"
                  name="iconClass"
                  value={formData.iconClass}
                  onChange={handleInputChange}
                  placeholder="fa fa-check"
                  className="col-span-3 bg-[#172a41] border-[#2a4365]"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right text-sm">Required:</div>
                <div className="col-span-3 flex items-center">
                  <Checkbox 
                    id="isRequired" 
                    checked={formData.isRequired}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <label htmlFor="isRequired" className="ml-2 text-sm">
                    Task is required for airdrop
                  </label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsTaskDialogOpen(false)}
                className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {(createTaskMutation.isPending || updateTaskMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {currentTask ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTasksTab;