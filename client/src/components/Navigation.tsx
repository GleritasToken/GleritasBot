import React from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, CheckSquare, Users, Info, LogOut } from 'lucide-react';
import { useUser } from '@/providers/UserProvider';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Navigation() {
  const [location] = useLocation();
  const { user, refreshUser } = useUser();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/logout');
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      
      // Force reload to clear all state
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: 'Failed to log out. Please try again.',
      });
    }
  };

  const isActive = (path: string) => {
    return location === path ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top header with logo and user info */}
      <div className="bg-[#0d1b2a] text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-500 rounded-full w-8 h-8 flex items-center justify-center">
            <span className="font-bold text-black">G</span>
          </div>
          <span className="font-bold text-lg">GLRS Airdrop</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#1c3252] rounded-full px-3 py-1 text-white font-medium">
            <span className="text-amber-400 mr-1">{user?.totalTokens || 0}</span>
            <span className="text-sm">GLRS</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Logout</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile bottom navigation - Only navigation that should be visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#12243B] border-t border-[#2a4365] p-2 flex justify-around items-center z-50">
        <Link href="/">
          <Button 
            variant="ghost" 
            size="sm"
            className={`${isActive('/')} flex flex-col items-center p-2`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Button>
        </Link>
        
        <Link href="/tasks">
          <Button 
            variant="ghost" 
            size="sm"
            className={`${isActive('/tasks')} flex flex-col items-center p-2`}
          >
            <CheckSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Tasks</span>
          </Button>
        </Link>
        
        <Link href="/referrals">
          <Button 
            variant="ghost" 
            size="sm"
            className={`${isActive('/referrals')} flex flex-col items-center p-2`}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Referrals</span>
          </Button>
        </Link>
        
        <Link href="/about">
          <Button 
            variant="ghost" 
            size="sm"
            className={`${isActive('/about')} flex flex-col items-center p-2`}
          >
            <Info className="h-5 w-5" />
            <span className="text-xs mt-1">About</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}