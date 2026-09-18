/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Gamepad2, 
  Table, 
  History, 
  Coins, 
  Sparkles, 
  ShieldCheck, 
  Cpu
} from 'lucide-react';
import { BlackjackTable } from './components/BlackjackTable';
import { StrategyMatrix } from './components/StrategyMatrix';
import { GameHistoryLog } from './components/GameHistoryLog';
import { GameLogEntry, GameStats } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'table' | 'strategy' | 'history'>('table');
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [stats, setStats] = useState<GameStats>({
    handsPlayed: 0,
    wins: 0,
    losses: 0,
    pushes: 0,
    blackjacks: 0,
    dealerBusts: 0,
    highestBankroll: 1000,
    totalWagered: 0,
    netProfit: 0,
  });

  const handleNewLog = (entry: GameLogEntry) => {
    setLogs(prev => [entry, ...prev]);
  };

  const handleStatsUpdate = (newStats: GameStats) => {
    setStats(newStats);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/50 border border-emerald-400/30">
              <span className="font-display font-black text-xl text-slate-950">21</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg text-white tracking-wide">
                  Blackjack Game Simulator
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Standard 52-Card Deck • Dynamic Ace 1/11 • Casino S17/H17 & 3:2 Payouts
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              id="nav-table-btn"
              type="button"
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'table'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Play Table</span>
            </button>

            <button
              id="nav-strategy-btn"
              type="button"
              onClick={() => setActiveTab('strategy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'strategy'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Strategy Matrix</span>
            </button>

            <button
              id="nav-history-btn"
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Log ({logs.length})</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {activeTab === 'table' && (
          <BlackjackTable
            onLogEntry={handleNewLog}
            onStatsUpdate={handleStatsUpdate}
          />
        )}

        {activeTab === 'strategy' && <StrategyMatrix />}

        {activeTab === 'history' && (
          <GameHistoryLog logs={logs} onClearLogs={handleClearLogs} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 mt-8 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Blackjack Rule Specifications: 52-Cards • Ace Dynamic Reduction • 3:2 Natural Blackjack</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Hands Tested: {stats.handsPlayed}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">Player Wins: {stats.wins}</span>
            <span>•</span>
            <span className="text-indigo-400 font-bold">Blackjacks: {stats.blackjacks}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
