import React from 'react';
import { motion } from 'motion/react';
import { Card } from '../types';

interface PlayingCardProps {
  card: Card;
  index?: number;
  highlight?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayingCard: React.FC<PlayingCardProps> = ({
  card,
  index = 0,
  highlight = false,
  size = 'md',
}) => {
  const isRed = card.suit === '♥' || card.suit === '♦';

  const sizeClasses = {
    sm: 'w-14 h-20 text-xs rounded-md',
    md: 'w-20 h-28 sm:w-24 sm:h-36 text-sm sm:text-base rounded-lg sm:rounded-xl',
    lg: 'w-28 h-40 sm:w-32 sm:h-48 text-base sm:text-lg rounded-xl',
  }[size];

  if (!card.isFaceUp) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20, rotateY: 180 }}
        animate={{ opacity: 1, y: 0, rotateY: 0 }}
        transition={{ duration: 0.35, delay: index * 0.1 }}
        className={`${sizeClasses} bg-gradient-to-br from-indigo-900 via-blue-950 to-slate-900 border-2 border-indigo-500/40 shadow-xl flex items-center justify-center relative overflow-hidden select-none`}
      >
        {/* Card back pattern */}
        <div className="absolute inset-1.5 border border-indigo-400/30 rounded-md flex items-center justify-center bg-indigo-950/60">
          <div className="grid grid-cols-3 gap-1.5 opacity-30">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rotate-45 bg-indigo-300" />
            ))}
          </div>
        </div>
        <span className="text-indigo-300/60 font-display font-bold text-xs tracking-widest uppercase z-10">
          BJ
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className={`${sizeClasses} bg-slate-50 text-slate-900 border ${
        highlight ? 'border-amber-400 ring-2 ring-amber-400/60 shadow-amber-500/20' : 'border-slate-300'
      } shadow-xl relative flex flex-col justify-between p-2 sm:p-2.5 select-none transition-transform hover:-translate-y-1`}
    >
      {/* Top Left Rank & Suit */}
      <div className={`flex flex-col items-center leading-none ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
        <span className="font-extrabold font-mono text-sm sm:text-base tracking-tighter">{card.rank}</span>
        <span className="text-xs sm:text-sm">{card.suit}</span>
      </div>

      {/* Center Display / Royalty Accent */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${isRed ? 'text-rose-500/90' : 'text-slate-800'}`}>
        {card.rank === 'A' ? (
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-4xl">{card.suit}</span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">Ace</span>
          </div>
        ) : ['K', 'Q', 'J'].includes(card.rank) ? (
          <div className="flex flex-col items-center">
            <span className="text-xl sm:text-3xl font-display font-bold">
              {card.rank === 'K' ? '👑 K' : card.rank === 'Q' ? '👸 Q' : '⚔️ J'}
            </span>
            <span className="text-xs">{card.suit}</span>
          </div>
        ) : (
          <span className="text-2xl sm:text-3xl opacity-80">{card.suit}</span>
        )}
      </div>

      {/* Bottom Right Rank & Suit (Inverted) */}
      <div className={`flex flex-col items-center leading-none self-end rotate-180 ${isRed ? 'text-rose-600' : 'text-slate-900'}`}>
        <span className="font-extrabold font-mono text-sm sm:text-base tracking-tighter">{card.rank}</span>
        <span className="text-xs sm:text-sm">{card.suit}</span>
      </div>
    </motion.div>
  );
};
