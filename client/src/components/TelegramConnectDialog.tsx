import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, HelpCircle } from "lucide-react";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TelegramConnectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TelegramConnectDialog: React.FC<TelegramConnectDialogProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [telegramId, setTelegramId] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const connectMutation = useMutation({
    mutationFn: async (telegramId: string) => {
      const response = await apiRequest('POST', '/api/connect-telegram', { telegramId });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to connect Telegram account");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your Telegram account has been connected successfully.",
      });
      onSuccess();
      onClose();
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      
      // Enhance error message for common issues
      if (errorMessage.includes("Failed to connect Telegram account")) {
        errorMessage = "Server error: Could not connect your Telegram account. Please check your Telegram ID and try again later.";
      }
      
      setError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Log the error for debugging purposes
      console.error("Telegram connection error:", error);
    }
  });

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!telegramId.trim()) {
      setError("Please enter your Telegram ID");
      return;
    }

    // Check if input is a valid number
    if (isNaN(Number(telegramId))) {
      setError("Telegram ID must be a number");
      return;
    }

    connectMutation.mutate(telegramId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1c3252] border-[#2a4365] text-white">
        <DialogHeader>
          <DialogTitle>Connect Telegram Account</DialogTitle>
          <DialogDescription className="text-gray-300">
            Connecting your Telegram account allows for automatic verification of Telegram tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConnect}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegramId">Your Telegram ID</Label>
              <Input
                id="telegramId"
                placeholder="Enter your Telegram ID number"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                className="bg-[#243b5c] border-[#2a4365] focus:border-blue-500"
              />
              <div className="text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <p>To find your Telegram ID:</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-blue-400" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#1c3252] border-[#2a4365] text-white max-w-xs">
                        <p>Your Telegram ID is a unique number assigned to your account. It's not your username or phone number.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <ol className="list-decimal pl-5 mt-1">
                  <li>Open Telegram and search for "@userinfobot"</li>
                  <li>Start a chat with this bot and send any message (like "Hi")</li>
                  <li>The bot will reply with your Telegram ID (a number)</li>
                  <li>Copy just the number and paste it here</li>
                </ol>
                <div className="mt-3 p-2 bg-blue-900/30 border border-blue-800 rounded-md">
                  <p className="text-xs text-blue-300">
                    <strong>Troubleshooting:</strong> If you're experiencing connection issues, try:
                    <br />- Making sure you're entering just the number (e.g., 123456789)
                    <br />- Refreshing the page and trying again
                    <br />- Ensuring you're using your main Telegram account ID
                  </p>
                </div>
                <p className="text-amber-400 mt-2 text-xs">* Connecting your Telegram account will reward you with 30 GLRS Points!</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 p-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-600"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={connectMutation.isPending}
            >
              {connectMutation.isPending ? "Connecting..." : "Connect Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TelegramConnectDialog;