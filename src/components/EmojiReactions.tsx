import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMeetingStore } from '../store/useMeetingStore';

export const EmojiReactionsOverlay: React.FC = () => {
  const { activeReactions } = useMeetingStore();

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {activeReactions.map((reaction, index) => {
          // Generate pseudo-random positions across bottom for natural floating effect
          const randomX = (index * 73) % 240 - 120;
          const randomRotate = (index * 37) % 30 - 15;

          return (
            <motion.div
              key={reaction.id}
              initial={{ opacity: 0, scale: 0.4, y: 50, x: randomX }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.6, 1.3, 1.1, 0.9],
                y: -window.innerHeight * 0.7,
                x: randomX + (Math.sin(index) * 40),
                rotate: randomRotate
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 3.8,
                ease: "easeOut"
              }}
              className="absolute bottom-24 right-1/4 sm:right-1/3 flex flex-col items-center gap-1"
            >
              <div className="text-4xl sm:text-5xl filter drop-shadow-lg select-none">
                {reaction.emoji}
              </div>
              <span className="text-[10px] font-bold text-slate-800 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full shadow-md border border-purple-200/60 whitespace-nowrap">
                {reaction.sender}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export const QUICK_EMOJIS = [
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '👏', label: 'Applause' },
  { emoji: '❤️', label: 'Heart' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '😂', label: 'Laugh' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💡', label: 'Idea' },
  { emoji: '🚀', label: 'Rocket' },
];

export default EmojiReactionsOverlay;
