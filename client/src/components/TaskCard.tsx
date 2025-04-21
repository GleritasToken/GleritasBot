import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CheckCircle, MessageCircle, Twitter, Globe, Wallet } from 'lucide-react';

interface TaskCardProps {
  taskName: string;
  title: string;
  description: string;
  tokenAmount: number;
  isCompleted: boolean;
  icon: string;
  isRequired: boolean;
  onComplete?: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  taskName,
  title,
  description,
  tokenAmount,
  isCompleted,
  icon,
  isRequired,
  onComplete,
}) => {
  // Map icon classes to color classes
  const getIconColor = () => {
    const iconMap: Record<string, string> = {
      'telegram': 'bg-blue-500',
      'twitter': 'bg-sky-500',
      'discord': 'bg-purple-500',
      'wallet': 'bg-amber-500',
      'website': 'bg-green-500',
    };
    
    // Find the matching icon type
    const iconType = Object.keys(iconMap).find(key => icon.includes(key));
    
    return iconType ? iconMap[iconType] : 'bg-gray-500';
  };

  return (
    <Card className="bg-[#243b5c] border-[#2a4365] hover:border-blue-500/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start">
          <div className={`${getIconColor()} p-3 rounded-full mr-4 shrink-0`}>
            {isCompleted ? (
              <CheckCircle className="h-5 w-5 text-white" />
            ) : (
              <span className="h-5 w-5 flex items-center justify-center text-white">
                {icon === 'telegram' && <MessageCircle className="h-5 w-5" />}
                {icon === 'twitter' && <Twitter className="h-5 w-5" />}
                {icon === 'discord' && <MessageCircle className="h-5 w-5" />}
                {icon === 'wallet' && <Wallet className="h-5 w-5" />}
                {icon === 'website' && <Globe className="h-5 w-5" />}
              </span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
              <h3 className="font-medium text-lg">{title}</h3>
              <span className="flex items-center bg-[#1c3252] px-3 py-1 rounded-full text-sm text-amber-400 font-medium md:ml-2">
                +{tokenAmount} GLRS
              </span>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              {description}
            </p>
            <div className="flex justify-between items-center">
              {isRequired && (
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded-full">
                  Required
                </span>
              )}
              {!isCompleted && onComplete && (
                <Button 
                  size="sm"
                  onClick={onComplete}
                  className="bg-blue-600 hover:bg-blue-700 ml-auto"
                >
                  Complete Task
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {isCompleted && (
                <span className="flex items-center text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full ml-auto">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;