import React, { useState } from 'react';
import { Table, Check, Flame, Shield, HelpCircle } from 'lucide-react';

export const StrategyMatrix: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'hard' | 'soft'>('hard');

  const dealerUpcards = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

  // Hard hands strategy matrix
  const hardHands = [
    { total: '17-20', plays: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
    { total: '16', plays: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
    { total: '15', plays: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
    { total: '14', plays: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
    { total: '13', plays: ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
    { total: '12', plays: ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'] },
    { total: '11', plays: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'] },
    { total: '10', plays: ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'] },
    { total: '9', plays: ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
    { total: '5-8', plays: ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'] },
  ];

  // Soft hands strategy matrix
  const softHands = [
    { total: 'A,9 (20)', plays: ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'] },
    { total: 'A,8 (19)', plays: ['S', 'S', 'S', 'S', 'D', 'S', 'S', 'S', 'S', 'S'] },
    { total: 'A,7 (18)', plays: ['D', 'D', 'D', 'D', 'D', 'S', 'S', 'H', 'H', 'H'] },
    { total: 'A,6 (17)', plays: ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
    { total: 'A,5 (16)', plays: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
    { total: 'A,4 (15)', plays: ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
    { total: 'A,3 (14)', plays: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
    { total: 'A,2 (13)', plays: ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'] },
  ];

  const getPlayBadge = (action: string) => {
    switch (action) {
      case 'H':
        return <span className="w-6 h-6 rounded bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-bold flex items-center justify-center text-xs">H</span>;
      case 'S':
        return <span className="w-6 h-6 rounded bg-rose-900/80 border border-rose-500/50 text-rose-300 font-bold flex items-center justify-center text-xs">S</span>;
      case 'D':
        return <span className="w-6 h-6 rounded bg-amber-900/80 border border-amber-500/50 text-amber-300 font-bold flex items-center justify-center text-xs">D</span>;
      default:
        return <span>{action}</span>;
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto bg-slate-900 border border-slate-800 p-5 rounded-2xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-indigo-400" />
            <span>Blackjack Basic Strategy Reference Matrix</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Optimal statistical actions for every player hand vs dealer upcard.
          </p>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2">
          <button
            id="strat-hard-btn"
            type="button"
            onClick={() => setActiveCategory('hard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
              activeCategory === 'hard'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Hard Hands
          </button>
          <button
            id="strat-soft-btn"
            type="button"
            onClick={() => setActiveCategory('soft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
              activeCategory === 'soft'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Soft Hands (With Ace)
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800">
        <span className="text-slate-500 text-[11px] uppercase font-bold">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-bold flex items-center justify-center text-[10px]">H</span>
          <span className="text-slate-300">Hit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-rose-900/80 border border-rose-500/50 text-rose-300 font-bold flex items-center justify-center text-[10px]">S</span>
          <span className="text-slate-300">Stand</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded bg-amber-900/80 border border-amber-500/50 text-amber-300 font-bold flex items-center justify-center text-[10px]">D</span>
          <span className="text-slate-300">Double Down (Hit if not allowed)</span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
        <table className="w-full text-xs font-mono text-center border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
              <th className="p-2.5 text-left font-bold text-slate-300">Player Hand</th>
              {dealerUpcards.map(upcard => (
                <th key={upcard} className="p-2.5 font-bold text-slate-200">
                  {upcard}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(activeCategory === 'hard' ? hardHands : softHands).map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-slate-800/60 hover:bg-slate-900/40">
                <td className="p-2.5 text-left font-bold text-slate-300 bg-slate-900/40">
                  {row.total}
                </td>
                {row.plays.map((action, cIdx) => (
                  <td key={cIdx} className="p-1.5">
                    <div className="flex justify-center">
                      {getPlayBadge(action)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
