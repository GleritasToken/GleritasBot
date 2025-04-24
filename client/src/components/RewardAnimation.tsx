import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from 'react-confetti';
import { useWindowSize } from '../hooks/use-window-size';
import { Gift, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RewardAnimationProps {
  isOpen: boolean;
  onClose: () => void;
  rewardAmount: number;
  rewardType: string;
  message?: string;
}

const RewardAnimation: React.FC<RewardAnimationProps> = ({
  isOpen,
  onClose,
  rewardAmount,
  rewardType,
  message = "Congratulations! You've earned a reward!"
}) => {
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000); // Stop confetti after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {showConfetti && (
            <Confetti
              width={width}
              height={height}
              recycle={false}
              numberOfPieces={200}
              gravity={0.15}
              colors={['#FFD700', '#FFA500', '#FF4500', '#00BFFF', '#1E90FF', '#9370DB']}
            />
          )}
          
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <motion.div
              className="relative max-w-md w-full mx-4 bg-gradient-to-b from-[#172a41] to-[#1c3252] rounded-lg shadow-xl border border-[#2a4365] overflow-hidden"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            >
              {/* Animated background sparkles */}
              <div className="absolute inset-0 opacity-20">
                <motion.div
                  className="absolute top-1/4 left-1/4 w-2 h-2 bg-amber-400 rounded-full"
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut" 
                  }}
                />
                <motion.div
                  className="absolute top-3/4 left-1/3 w-1 h-1 bg-blue-400 rounded-full"
                  animate={{ 
                    scale: [1, 1.8, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                    delay: 0.3
                  }}
                />
                <motion.div
                  className="absolute top-1/2 right-1/4 w-2 h-2 bg-purple-400 rounded-full"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />
                <motion.div
                  className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-green-400 rounded-full"
                  animate={{ 
                    scale: [1, 1.6, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                    delay: 0.8
                  }}
                />
              </div>
              
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 text-gray-400 hover:text-white hover:bg-transparent z-10"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Content */}
              <div className="p-6 pt-12 pb-8 flex flex-col items-center relative">
                <motion.div
                  className="mb-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 p-1 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: [0, 1.2, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ 
                    duration: 0.7,
                    delay: 0.2,
                    type: "spring"
                  }}
                >
                  <div className="bg-[#1c3252] rounded-full p-3">
                    <Sparkles className="h-10 w-10 text-amber-400" />
                  </div>
                </motion.div>
                
                <motion.h2
                  className="text-xl md:text-2xl font-bold text-center mb-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {message}
                </motion.h2>
                
                <motion.div
                  className="flex items-center justify-center text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600 mb-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.5,
                    delay: 0.6,
                    type: "spring"
                  }}
                >
                  <span>+{rewardAmount}</span>
                  <span className="ml-2">{rewardType}</span>
                </motion.div>
                
                <motion.p
                  className="text-gray-300 text-center mb-6 max-w-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  Your reward has been added to your balance. Keep completing tasks to earn more tokens!
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 }}
                >
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 w-full"
                    onClick={onClose}
                  >
                    <Gift className="h-5 w-5 mr-2" /> Continue
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RewardAnimation;