import React from 'react';
import { History, Trash2, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { GameLogEntry } from '../types';

interface GameHistoryLogProps {
  logs: GameLogEntry[];
  onClearLogs: () => void;
}

export const GameHistoryLog: React.FC<GameHistoryLogProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto bg-slate-900 border border-slate-800 p-5 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-400" />
          <h3 className="text-base font-bold text-white">Live Round Audit History ({logs.length})</h3>
        </div>
        {logs.length > 0 && (
          <button
            id="clear-logs-btn"
            type="button"
            onClick={onClearLogs}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 font-mono transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-xs font-mono text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
          No hands played yet. Place a bet and deal cards to see state audit logs here.
        </div>
      ) : (
        <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800 max-h-72 overflow-y-auto">
          <table className="w-full text-xs font-mono text-left">
            <thead className="border-b border-slate-800 bg-slate-900/90 text-slate-400 sticky top-0">
              <tr>
                <th className="p-2.5">Time</th>
                <th className="p-2.5">Player Hand</th>
                <th className="p-2.5">Dealer Hand</th>
                <th className="p-2.5">Outcome</th>
                <th className="p-2.5">Bet</th>
                <th className="p-2.5">Payout</th>
                <th className="p-2.5">Bankroll</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => {
                const isWin = log.payout > log.bet;
                const isLoss = log.payout === 0;

                return (
                  <tr key={log.id} className="hover:bg-slate-900/50">
                    <td className="p-2.5 text-slate-500">{log.timestamp}</td>
                    <td className="p-2.5 text-slate-200">
                      <span className="font-bold">{log.playerCards.join(' ')}</span>
                      <span className="text-slate-400 text-[10px] ml-1.5">({log.playerScore})</span>
                    </td>
                    <td className="p-2.5 text-slate-200">
                      <span className="font-bold">{log.dealerCards.join(' ')}</span>
                      <span className="text-slate-400 text-[10px] ml-1.5">({log.dealerScore})</span>
                    </td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isWin
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                          : isLoss
                          ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                      }`}>
                        {log.outcome.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300 font-bold">${log.bet}</td>
                    <td className="p-2.5">
                      <span className={`font-bold flex items-center gap-0.5 ${
                        isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {isWin && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {isLoss && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {!isWin && !isLoss && <Minus className="w-3.5 h-3.5" />}
                        ${log.payout}
                      </span>
                    </td>
                    <td className="p-2.5 text-emerald-400 font-bold">${log.bankrollAfter}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
