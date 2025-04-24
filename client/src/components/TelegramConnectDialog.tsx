import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import RewardAnimation from './RewardAnimation';

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
  const [showReward, setShowReward] = useState(false);
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
      // Show reward animation instead of immediately closing
      setShowReward(true);
      onSuccess();
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
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
    <>
      <Dialog open={isOpen && !showReward} onOpenChange={(open) => !showReward && onClose()}>
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
                  <p>To find your Telegram ID:</p>
                  <ol className="list-decimal pl-5 mt-1">
                    <li>Open Telegram and search for "@userinfobot"</li>
                    <li>Start a chat with this bot and send any message (like "Hi")</li>
                    <li>The bot will reply with your Telegram ID (a number)</li>
                    <li>Copy just the number and paste it here</li>
                  </ol>
                  <p className="text-amber-400 mt-2 text-xs">* Connecting your Telegram account will reward you with 2 GLRS tokens!</p>
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

      {/* Reward Animation */}
      <RewardAnimation
        isOpen={showReward}
        onClose={() => {
          setShowReward(false);
          onClose();
        }}
        rewardAmount={2}
        rewardType="GLRS"
        message="Telegram Account Connected!"
      />
    </>
  );
};

export default TelegramConnectDialog;