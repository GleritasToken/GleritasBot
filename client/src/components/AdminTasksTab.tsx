import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Edit, Plus, CheckCircle, Clock, Trash2, RefreshCw } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface TaskWithStats {
  id: number;
  name: string;
  description: string;
  tokenAmount: number;
  isRequired: boolean;
  iconClass: string;
  link?: string;
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetTasksDialogOpen, setIsResetTasksDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<TaskWithStats | null>(null);
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
  
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/tasks/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete task');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      setIsDeleteDialogOpen(false);
      setTaskToDelete(null);
      toast({
        title: "Task deleted",
        description: "The task has been deleted successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete task",
        description: error.message || "An error occurred while deleting the task",
        variant: "destructive"
      });
    }
  });
  
  // Reset all tasks mutation
  const resetAllTasksMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/reset-all-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reset all tasks');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tasks'] });
      setIsResetTasksDialogOpen(false);
      toast({
        title: "Tasks Reset",
        description: data.message || "All user tasks have been reset successfully. Users can now complete tasks again.",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to reset tasks",
        description: error.message || "An error occurred while resetting tasks",
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
      iconClass: task.iconClass,
      link: task.link
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
    
    // Make sure link is valid or empty
    const formDataToSubmit = { ...formData };
    if (formDataToSubmit.link && formDataToSubmit.link.trim() === '') {
      formDataToSubmit.link = undefined; // Remove empty link
    } else if (formDataToSubmit.link && !formDataToSubmit.link.startsWith('http')) {
      // Make sure link has protocol
      formDataToSubmit.link = 'https://' + formDataToSubmit.link;
    }
    
    // Validate link URL format if provided
    if (formDataToSubmit.link && !isValidUrl(formDataToSubmit.link)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL for the link (e.g., https://example.com)",
        variant: "destructive"
      });
      return;
    }
    
    if (currentTask) {
      updateTaskMutation.mutate({ id: currentTask.id, data: formDataToSubmit });
    } else {
      createTaskMutation.mutate(formDataToSubmit);
    }
  };
  
  // Helper function to validate URL format
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
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
  
  const handleOpenDeleteDialog = (task: TaskWithStats) => {
    setTaskToDelete(task);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteTask = () => {
    if (taskToDelete) {
      deleteTaskMutation.mutate(taskToDelete.id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Task Management</h2>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setIsResetTasksDialogOpen(true)}
            variant="outline"
            className="border-amber-600 text-amber-500 hover:bg-amber-950 hover:text-amber-400"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset All Tasks
          </Button>
          <Button 
            onClick={handleOpenNewTaskDialog}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Task
          </Button>
        </div>
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
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleOpenDeleteDialog(task)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-100/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleOpenEditTaskDialog(task)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
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
                
                {task.link && (
                  <div className="flex justify-between items-center mb-2 text-sm">
                    <span className="text-gray-400">Link:</span>
                    <a 
                      href={task.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="font-medium text-blue-400 hover:text-blue-300 truncate max-w-[150px]"
                    >
                      {task.link}
                    </a>
                  </div>
                )}
                
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
                <label htmlFor="link" className="text-right text-sm">Link URL:</label>
                <Input
                  id="link"
                  name="link"
                  value={formData.link || ''}
                  onChange={handleInputChange}
                  placeholder="https://example.com/task-link"
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
            
            <DialogFooter className="flex justify-between">
              {currentTask && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    setIsTaskDialogOpen(false);
                    handleOpenDeleteDialog(currentTask);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </Button>
              )}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTaskDialogOpen(false)}
                  className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white mr-2"
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
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this task?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              This action cannot be undone. This will permanently delete the task
              "{taskToDelete?.name}" and remove all associated user completions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700 text-white border-none"
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reset All Tasks Confirmation Dialog */}
      <AlertDialog open={isResetTasksDialogOpen} onOpenChange={setIsResetTasksDialogOpen}>
        <AlertDialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all user task completions?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              <p className="mb-2">
                This action will reset all users' task completion history, allowing them to complete tasks again and earn tokens again.
              </p>
              <p className="mb-2">
                Users will keep their current token balance, but will be able to re-complete all tasks for additional tokens.
              </p>
              <p className="font-semibold text-amber-500">
                This action cannot be undone and will affect all users on the platform.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => resetAllTasksMutation.mutate()}
              className="bg-amber-600 hover:bg-amber-700 text-white border-none"
              disabled={resetAllTasksMutation.isPending}
            >
              {resetAllTasksMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Reset All Tasks
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTasksTab;