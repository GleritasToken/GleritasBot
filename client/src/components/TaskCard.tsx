import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, ExternalLink } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { QueryClient, useQueryClient } from '@tanstack/react-query';

interface TaskCardProps {
  taskName: string;
  title: string;
  description: string;
  tokenAmount: number;
  isCompleted: boolean;
  icon: string;
  isRequired: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({
  taskName,
  title,
  description,
  tokenAmount,
  isCompleted,
  icon,
  isRequired
}) => {
  const { user, refreshUser } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);

  const handleTaskCompletion = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please register first to complete tasks",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // For wallet submission, we'll handle separately in WalletSubmission component
      if (taskName === "wallet_submit") {
        return;
      }

      // In a real app, this would redirect to the social platform for verification
      // For this prototype, we'll simulate verification
      
      // Simulate opening a popup/redirect for task verification
      let verificationData = "";
      
      if (taskName === "telegram_group") {
        window.open("https://t.me/+hcJdayisPFIxOGVk", "_blank");
        verificationData = "joined_group";
      } else if (taskName === "telegram_channel") {
        window.open("https://t.me/gleritaschat", "_blank");
        verificationData = "joined_channel";
      } else if (taskName === "twitter_follow") {
        window.open("https://twitter.com/GleritasToken", "_blank");
        verificationData = "followed";
      } else if (taskName === "twitter_engage") {
        window.open("https://twitter.com/GleritasToken/status/123456789", "_blank");
        verificationData = "engaged";
      } else if (taskName === "youtube") {
        window.open("https://www.youtube.com/watch?v=gleritastoken", "_blank");
        verificationData = "watched";
      }
      
      // Send completion request
      const response = await apiRequest('POST', '/api/tasks/complete', {
        taskName,
        verificationData
      });
      
      const data = await response.json();
      
      toast({
        title: "Task Completed",
        description: data.message || `You earned ${tokenAmount} GLRS tokens!`,
      });
      
      // Refresh user data
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    } catch (error) {
      console.error("Failed to complete task:", error);
      toast({
        title: "Task Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-card p-4 flex items-center justify-between hover:bg-[#243b5c]">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 h-10 w-10 bg-blue-900/30 rounded-full flex items-center justify-center">
          <i className={icon}></i>
        </div>
        <div>
          <h4 className="font-medium text-white">{title}</h4>
          <p className="text-sm text-blue-200">{description}</p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="text-sm font-medium text-blue-200">
          {tokenAmount > 0 ? `+${tokenAmount} GLRS` : (isRequired ? "Required" : "Optional")}
        </div>
        {isCompleted ? (
          <Button 
            variant="outline" 
            size="sm"
            className="bg-green-700/30 border-green-600 text-green-300 pointer-events-none" 
            disabled
          >
            <Check className="h-4 w-4 mr-1" />
            Completed
          </Button>
        ) : (
          taskName === "wallet_submit" ? (
            <Button 
              variant="default" 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleTaskCompletion}
              disabled={loading}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Submit
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleTaskCompletion}
              disabled={loading}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              {loading ? "Verifying..." : "Verify"}
            </Button>
          )
        )}
      </div>
    </div>
  );
};

export default TaskCard;
