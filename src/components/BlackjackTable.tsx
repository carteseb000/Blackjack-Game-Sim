import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  RotateCcw, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Lightbulb, 
  Coins, 
  TrendingUp, 
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Card, GameLogEntry, GameResult, GameStats, HandEvaluation } from '../types';
import { 
  create_deck, 
  calculate_hand_value, 
  deal_initial_hands, 
  player_hit, 
  dealer_turn_step, 
  determine_winner, 
  get_strategy_advice,
  get_card_base_value 
} from '../engine/blackjackEngine';
import { PlayingCard } from './PlayingCard';
import { soundEffects } from '../utils/soundEffects';

const CHIP_DENOMINATIONS = [5, 25, 50, 100, 500];

interface BlackjackTableProps {
  onLogEntry?: (entry: GameLogEntry) => void;
  onStatsUpdate?: (stats: GameStats) => void;
}

export const BlackjackTable: React.FC<BlackjackTableProps> = ({
  onLogEntry,
  onStatsUpdate,
}) => {
  // Game Configuration
  const [numDecks, setNumDecks] = useState(6);
  const [hitOnSoft17, setHitOnSoft17] = useState(false);
  const [showStrategyAdvisor, setShowStrategyAdvisor] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  // Core Game State
  const [deck, setDeck] = useState<Card[]>(() => create_deck(6));
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [gamePhase, setGamePhase] = useState<'betting' | 'dealing' | 'player_turn' | 'dealer_turn' | 'round_over'>('betting');
  
  // Betting & Bankroll State
  const [bankroll, setBankroll] = useState(1000);
  const [currentBet, setCurrentBet] = useState(25);
  const [lastBet, setLastBet] = useState(25);
  const [roundResult, setRoundResult] = useState<GameResult | null>(null);

  // Statistics State
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

  // Safely synchronize statistics with parent component outside render phase
  useEffect(() => {
    if (onStatsUpdate) {
      onStatsUpdate(stats);
    }
  }, [stats, onStatsUpdate]);

  // Evaluations
  const playerEval: HandEvaluation = calculate_hand_value(playerHand);
  const dealerEval: HandEvaluation = calculate_hand_value(dealerHand);
  const dealerUpcard = dealerHand.length > 0 ? dealerHand[0] : null;
  const strategy = get_strategy_advice(playerHand, dealerUpcard);

  // Audio helper
  const handleToggleSound = () => {
    const next = soundEffects.toggleSound();
    setSoundOn(next);
  };

  // Add chips to current bet
  const addChip = (amount: number) => {
    if (gamePhase !== 'betting') return;
    if (currentBet + amount <= bankroll) {
      soundEffects.playChip();
      setCurrentBet(prev => prev + amount);
    }
  };

  const clearBet = () => {
    if (gamePhase !== 'betting') return;
    soundEffects.playChip();
    setCurrentBet(0);
  };

  const setAllIn = () => {
    if (gamePhase !== 'betting') return;
    soundEffects.playChip();
    setCurrentBet(bankroll);
  };

  // 1. Deal Initial Hands
  const startRound = () => {
    if (currentBet <= 0 || currentBet > bankroll) return;

    soundEffects.playChip();
    setRoundResult(null);
    setGamePhase('dealing');
    setLastBet(currentBet);

    // Deduct bet from bankroll upfront
    const newBankroll = bankroll - currentBet;
    setBankroll(newBankroll);

    // Track statistics
    setStats(prev => ({
      ...prev,
      totalWagered: prev.totalWagered + currentBet,
    }));

    // Deal cards from engine
    const { playerHand: initialP, dealerHand: initialD, remainingDeck } = deal_initial_hands(deck);
    setDeck(remainingDeck);

    // Card dealing animation sequence
    soundEffects.playCardSlide();
    setTimeout(() => {
      setPlayerHand([initialP[0]]);
      soundEffects.playCardSlide();
      setTimeout(() => {
        setDealerHand([initialD[0]]);
        soundEffects.playCardSlide();
        setTimeout(() => {
          setPlayerHand([initialP[0], initialP[1]]);
          soundEffects.playCardSlide();
          setTimeout(() => {
            setDealerHand([initialD[0], initialD[1]]);
            
            // Check immediate Natural Blackjack
            const pEval = calculate_hand_value(initialP);
            const dEval = calculate_hand_value(initialD.map(c => ({ ...c, isFaceUp: true })));

            if (pEval.isBlackjack || dEval.isBlackjack) {
              // End round immediately
              finishRound(initialP, initialD.map(c => ({ ...c, isFaceUp: true })), currentBet, newBankroll);
            } else {
              setGamePhase('player_turn');
            }
          }, 250);
        }, 250);
      }, 250);
    }, 250);
  };

  // 2. Player Hit
  const handleHit = () => {
    if (gamePhase !== 'player_turn') return;
    soundEffects.playCardSlide();

    const { newPlayerHand, remainingDeck, evaluation } = player_hit(deck, playerHand);
    setDeck(remainingDeck);
    setPlayerHand(newPlayerHand);

    if (evaluation.isBust) {
      soundEffects.playLoss();
      // Player busted, reveal dealer hand and finish
      const revealedDealer = dealerHand.map(c => ({ ...c, isFaceUp: true }));
      setDealerHand(revealedDealer);
      finishRound(newPlayerHand, revealedDealer, currentBet, bankroll);
    } else if (evaluation.total === 21) {
      // Automatic stand on 21
      handleStand(newPlayerHand);
    }
  };

  // 3. Player Stand -> Dealer Turn
  const handleStand = (customPlayerHand?: Card[]) => {
    if (gamePhase !== 'player_turn') return;
    setGamePhase('dealer_turn');

    const activePlayer = customPlayerHand || playerHand;
    // Reveal hole card
    soundEffects.playCardSlide();
    const revealedDealer = dealerHand.map(c => ({ ...c, isFaceUp: true }));
    setDealerHand(revealedDealer);

    // Run dealer steps with natural casino rhythm
    let currentD = revealedDealer;
    let currentDeckState = deck;

    const runDealerLoop = () => {
      const step = dealer_turn_step(currentDeckState, currentD, hitOnSoft17);
      currentD = step.newDealerHand;
      currentDeckState = step.remainingDeck;
      setDeck(currentDeckState);
      setDealerHand(currentD);

      if (step.shouldHitAgain) {
        soundEffects.playCardSlide();
        setTimeout(runDealerLoop, 650);
      } else {
        setTimeout(() => {
          finishRound(activePlayer, currentD, currentBet, bankroll);
        }, 500);
      }
    };

    setTimeout(runDealerLoop, 600);
  };

  // 4. Double Down
  const handleDoubleDown = () => {
    if (gamePhase !== 'player_turn' || playerHand.length !== 2) return;
    if (bankroll < currentBet) return;

    soundEffects.playChip();
    const doubleBet = currentBet * 2;
    const additionalBet = currentBet;
    setBankroll(prev => prev - additionalBet);
    setCurrentBet(doubleBet);

    // Draw exactly one card
    soundEffects.playCardSlide();
    const { newPlayerHand, remainingDeck, evaluation } = player_hit(deck, playerHand);
    setDeck(remainingDeck);
    setPlayerHand(newPlayerHand);

    if (evaluation.isBust) {
      soundEffects.playLoss();
      const revealedDealer = dealerHand.map(c => ({ ...c, isFaceUp: true }));
      setDealerHand(revealedDealer);
      finishRound(newPlayerHand, revealedDealer, doubleBet, bankroll - additionalBet);
    } else {
      // Proceed to dealer turn with updated hand
      setTimeout(() => {
        handleStand(newPlayerHand);
      }, 400);
    }
  };

  // 5. Surrender
  const handleSurrender = () => {
    if (gamePhase !== 'player_turn' || playerHand.length !== 2) return;
    const result = determine_winner(playerHand, dealerHand, currentBet, true);
    setRoundResult(result);
    setGamePhase('round_over');
    
    const finalBankroll = bankroll + result.payout;
    setBankroll(finalBankroll);

    updateStatsAndLog(result, playerHand, dealerHand, currentBet, finalBankroll);
  };

  // 6. Finish Round & Settle Payouts
  const finishRound = (
    finalPlayer: Card[],
    finalDealer: Card[],
    activeBet: number,
    baseBankroll: number
  ) => {
    const result = determine_winner(finalPlayer, finalDealer, activeBet);
    setRoundResult(result);
    setGamePhase('round_over');

    const finalBankroll = baseBankroll + result.payout;
    setBankroll(finalBankroll);

    // Trigger visual confetti and audio
    if (result.outcome === 'player_blackjack' || result.outcome === 'player_won' || result.outcome === 'dealer_bust') {
      soundEffects.playWin();
      try {
        confetti({
          particleCount: result.outcome === 'player_blackjack' ? 80 : 45,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#10b981', '#f59e0b', '#3b82f6', '#ffffff']
        });
      } catch {}
    } else if (result.outcome === 'player_bust' || result.outcome === 'dealer_won') {
      soundEffects.playLoss();
    }

    updateStatsAndLog(result, finalPlayer, finalDealer, activeBet, finalBankroll);
  };

  const updateStatsAndLog = (
    result: GameResult,
    finalP: Card[],
    finalD: Card[],
    betAmount: number,
    finalBankroll: number
  ) => {
    const isWin = result.outcome === 'player_won' || result.outcome === 'player_blackjack' || result.outcome === 'dealer_bust';
    const isLoss = result.outcome === 'dealer_won' || result.outcome === 'player_bust' || result.outcome === 'surrender';
    const isPush = result.outcome === 'push';

    setStats(prev => ({
      ...prev,
      handsPlayed: prev.handsPlayed + 1,
      wins: prev.wins + (isWin ? 1 : 0),
      losses: prev.losses + (isLoss ? 1 : 0),
      pushes: prev.pushes + (isPush ? 1 : 0),
      blackjacks: prev.blackjacks + (result.outcome === 'player_blackjack' ? 1 : 0),
      dealerBusts: prev.dealerBusts + (result.outcome === 'dealer_bust' ? 1 : 0),
      highestBankroll: Math.max(prev.highestBankroll, finalBankroll),
      totalWagered: prev.totalWagered,
      netProfit: prev.netProfit + result.netChange,
    }));

    if (onLogEntry) {
      onLogEntry({
        id: `round-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        playerCards: finalP.map(c => `${c.rank}${c.suit}`),
        playerScore: calculate_hand_value(finalP).total,
        dealerCards: finalD.map(c => `${c.rank}${c.suit}`),
        dealerScore: calculate_hand_value(finalD).total,
        outcome: result.outcome,
        bet: betAmount,
        payout: result.payout,
        bankrollAfter: finalBankroll,
      });
    }
  };

  // Reset to initial bankroll
  const resetBankroll = () => {
    setBankroll(1000);
    setCurrentBet(25);
    setRoundResult(null);
    setGamePhase('betting');
    setPlayerHand([]);
    setDealerHand([]);
  };

  return (
    <div id="blackjack-table-container" className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Table Top Stats & Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl shadow-xl backdrop-blur-md">
        {/* Bankroll & Current Bet Display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <Coins className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Bankroll</div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                ${bankroll.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <Flame className="w-5 h-5 text-rose-400" />
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Bet</div>
              <div className="text-lg font-mono font-bold text-amber-400">
                ${currentBet.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Engine Rules & Tools Badges */}
        <div className="flex items-center gap-2">
          {/* S17 / H17 Toggle */}
          <button
            id="toggle-dealer-rule-btn"
            type="button"
            disabled={gamePhase !== 'betting'}
            onClick={() => setHitOnSoft17(!hitOnSoft17)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
              hitOnSoft17 
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' 
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Toggle Dealer Soft 17 rule (S17 = Stand on Soft 17, H17 = Hit on Soft 17)"
          >
            {hitOnSoft17 ? 'Rule: Dealer Hits S17 (H17)' : 'Rule: Dealer Stands S17 (S17)'}
          </button>

          {/* Strategy Advisor Toggle */}
          <button
            id="toggle-strategy-advisor-btn"
            type="button"
            onClick={() => setShowStrategyAdvisor(!showStrategyAdvisor)}
            className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${
              showStrategyAdvisor
                ? 'bg-indigo-950/70 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Strategy Advisor</span>
          </button>

          {/* Audio Toggle */}
          <button
            id="toggle-audio-btn"
            type="button"
            onClick={handleToggleSound}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Toggle Sound Effects"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Bankroll Reload */}
          {bankroll <= 0 && gamePhase === 'round_over' && (
            <button
              id="reload-bankroll-btn"
              type="button"
              onClick={resetBankroll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-900/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reload $1,000</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Casino Felt Table */}
      <div 
        id="casino-felt"
        className="relative w-full rounded-3xl border-4 border-amber-900/60 shadow-2xl p-6 sm:p-8 flex flex-col justify-between min-h-[500px] overflow-hidden bg-gradient-to-b from-emerald-950 via-[#06422b] to-[#042c1d]"
      >
        {/* Wood rim subtle texture accent */}
        <div className="absolute inset-0 border border-emerald-500/20 rounded-[22px] pointer-events-none" />
        
        {/* Casino Table Arch Guide */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-2xl h-64 border border-emerald-400/10 rounded-t-full pointer-events-none" />
        
        {/* Table Print Text */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none opacity-40 select-none">
          <div className="font-display tracking-[0.25em] text-xs sm:text-sm text-emerald-200 uppercase font-bold">
            Blackjack Pays 3 to 2
          </div>
          <div className="text-[10px] tracking-widest text-emerald-300/80 uppercase mt-0.5">
            Dealer Must Stand on 17 and Draw to 16
          </div>
        </div>

        {/* --- DEALER ZONE --- */}
        <div className="flex flex-col items-center z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-300/90 font-mono">
              Dealer Hand
            </span>
            {dealerHand.length > 0 && (
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-300">
                {gamePhase === 'player_turn' 
                  ? `${get_card_base_value(dealerHand[0].rank)} + ?` 
                  : dealerEval.displayValue}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[140px]">
            <AnimatePresence>
              {dealerHand.length === 0 ? (
                <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-xl border-2 border-dashed border-emerald-500/20 flex items-center justify-center text-emerald-500/30 text-xs font-mono">
                  Dealer Area
                </div>
              ) : (
                dealerHand.map((card, idx) => (
                  <PlayingCard
                    key={card.id || `dealer-${idx}`}
                    card={card}
                    index={idx}
                    highlight={gamePhase === 'dealer_turn'}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- CENTER BANNER (Outcome / Notifications) --- */}
        <div className="my-3 min-h-[60px] flex items-center justify-center z-20">
          <AnimatePresence mode="wait">
            {roundResult ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`px-5 py-2.5 rounded-2xl border backdrop-blur-md shadow-2xl text-center max-w-md ${
                  roundResult.outcome === 'player_blackjack' || roundResult.outcome === 'player_won' || roundResult.outcome === 'dealer_bust'
                    ? 'bg-emerald-950/90 border-emerald-400 text-emerald-100 shadow-emerald-900/50'
                    : roundResult.outcome === 'push'
                    ? 'bg-slate-900/90 border-amber-400 text-amber-100 shadow-amber-900/40'
                    : 'bg-rose-950/90 border-rose-500 text-rose-100 shadow-rose-950/60'
                }`}
              >
                <div className="text-base sm:text-lg font-bold font-display">{roundResult.title}</div>
                <div className="text-xs sm:text-sm text-slate-200/90 mt-0.5">{roundResult.message}</div>
              </motion.div>
            ) : gamePhase === 'player_turn' && showStrategyAdvisor ? (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 text-indigo-200 text-xs backdrop-blur-sm"
              >
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong className="text-white font-mono uppercase bg-indigo-900/60 px-1.5 py-0.5 rounded border border-indigo-400/30 mr-1.5">
                    {strategy.action}
                  </strong>
                  {strategy.explanation}
                </span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* --- PLAYER ZONE --- */}
        <div className="flex flex-col items-center z-10">
          <div className="flex items-center justify-center gap-2 sm:gap-3 min-h-[140px] mb-2">
            <AnimatePresence>
              {playerHand.length === 0 ? (
                <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-xl border-2 border-dashed border-emerald-500/20 flex items-center justify-center text-emerald-500/30 text-xs font-mono">
                  Player Area
                </div>
              ) : (
                playerHand.map((card, idx) => (
                  <PlayingCard
                    key={card.id || `player-${idx}`}
                    card={card}
                    index={idx}
                    highlight={gamePhase === 'player_turn'}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-widest text-emerald-300/90 font-mono">
              Your Hand
            </span>
            {playerHand.length > 0 && (
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                playerEval.isBust 
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-300' 
                  : playerEval.isBlackjack 
                  ? 'bg-amber-950/80 border-amber-400/60 text-amber-300' 
                  : 'bg-slate-900/80 border-emerald-500/30 text-emerald-300'
              }`}>
                {playerEval.displayValue}
              </span>
            )}
          </div>
        </div>

        {/* Betting Chip Ring on Felt */}
        <div className="absolute bottom-6 left-6 hidden sm:flex flex-col items-center opacity-80 pointer-events-none">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-400/30 flex items-center justify-center">
            <span className="text-[10px] font-mono font-bold text-emerald-300/70 uppercase">
              ${currentBet}
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-emerald-400/50 mt-1 font-semibold">Bet Circle</span>
        </div>
      </div>

      {/* Interactive Controls & Chip Tray */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col gap-4">
        {gamePhase === 'betting' ? (
          /* BETTING PHASE CONTROLS */
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Select Chips to Place Wager
              </span>
              <div className="flex items-center gap-2">
                <button
                  id="bet-clear-btn"
                  type="button"
                  onClick={clearBet}
                  disabled={currentBet === 0}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                >
                  Clear
                </button>
                <button
                  id="bet-all-in-btn"
                  type="button"
                  onClick={setAllIn}
                  disabled={bankroll <= 0}
                  className="text-xs px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-600/40 hover:bg-amber-900/60 text-amber-300 transition-colors"
                >
                  All-In (${bankroll})
                </button>
              </div>
            </div>

            {/* Chip Selection Buttons */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {CHIP_DENOMINATIONS.map(amt => {
                const colors = {
                  5: 'from-rose-600 to-rose-800 border-rose-400 shadow-rose-900/50',
                  25: 'from-emerald-600 to-emerald-800 border-emerald-400 shadow-emerald-900/50',
                  50: 'from-blue-600 to-blue-800 border-blue-400 shadow-blue-900/50',
                  100: 'from-slate-800 to-slate-950 border-amber-400 shadow-amber-900/30',
                  500: 'from-purple-700 to-purple-900 border-purple-400 shadow-purple-900/50',
                }[amt];

                return (
                  <button
                    key={amt}
                    id={`chip-btn-${amt}`}
                    type="button"
                    onClick={() => addChip(amt)}
                    disabled={currentBet + amt > bankroll}
                    className={`h-12 sm:h-14 rounded-2xl bg-gradient-to-b border-2 ${colors} shadow-md flex flex-col items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all`}
                  >
                    <span className="text-[10px] uppercase font-mono text-white/70 font-semibold leading-none">+</span>
                    <span className="text-sm sm:text-base font-extrabold font-mono text-white tracking-tight leading-none">${amt}</span>
                  </button>
                );
              })}
            </div>

            {/* Deal Button */}
            <button
              id="deal-btn"
              type="button"
              onClick={startRound}
              disabled={currentBet <= 0 || currentBet > bankroll}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none transition-all"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Deal Hand (${currentBet})</span>
            </button>
          </div>
        ) : gamePhase === 'player_turn' ? (
          /* ACTIVE PLAYER ACTION BUTTONS */
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {/* Hit Button */}
            <button
              id="action-hit-btn"
              type="button"
              onClick={handleHit}
              className="py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex flex-col items-center justify-center shadow-lg shadow-emerald-950/60 active:scale-95 transition-all"
            >
              <span className="text-lg">Hit 🃏</span>
              <span className="text-[11px] font-normal text-emerald-100/80">Draw Card</span>
            </button>

            {/* Stand Button */}
            <button
              id="action-stand-btn"
              type="button"
              onClick={() => handleStand()}
              className="py-3.5 px-4 rounded-2xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-base flex flex-col items-center justify-center shadow-lg shadow-rose-950/60 active:scale-95 transition-all"
            >
              <span className="text-lg">Stand 🛑</span>
              <span className="text-[11px] font-normal text-rose-100/80">End Turn</span>
            </button>

            {/* Double Down Button */}
            <button
              id="action-double-btn"
              type="button"
              onClick={handleDoubleDown}
              disabled={playerHand.length !== 2 || bankroll < currentBet}
              className="py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-base flex flex-col items-center justify-center shadow-lg shadow-amber-950/60 active:scale-95 disabled:pointer-events-none transition-all"
            >
              <span className="text-lg">Double 2x ⚡</span>
              <span className="text-[11px] font-normal text-amber-100/80">
                {playerHand.length === 2 ? `+ $${currentBet}` : '2 Cards Only'}
              </span>
            </button>

            {/* Surrender Button */}
            <button
              id="action-surrender-btn"
              type="button"
              onClick={handleSurrender}
              disabled={playerHand.length !== 2}
              className="py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-base flex flex-col items-center justify-center border border-slate-700 active:scale-95 disabled:pointer-events-none transition-all"
            >
              <span className="text-lg">Surrender 🏳️</span>
              <span className="text-[11px] font-normal text-slate-400">Save 50% Bet</span>
            </button>
          </div>
        ) : gamePhase === 'round_over' ? (
          /* ROUND COMPLETE RE-BET CONTROLS */
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              id="next-round-btn"
              type="button"
              onClick={() => {
                setPlayerHand([]);
                setDealerHand([]);
                setRoundResult(null);
                setGamePhase('betting');
              }}
              className="w-full sm:flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-base transition-colors"
            >
              Change Bet
            </button>

            <button
              id="rebet-deal-btn"
              type="button"
              onClick={() => {
                const betToUse = Math.min(lastBet, bankroll);
                if (betToUse > 0) {
                  setCurrentBet(betToUse);
                  setRoundResult(null);
                  setTimeout(() => {
                    startRound();
                  }, 50);
                }
              }}
              disabled={bankroll <= 0}
              className="w-full sm:flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 disabled:opacity-40 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Re-bet & Deal (${Math.min(lastBet, bankroll)})</span>
            </button>
          </div>
        ) : (
          /* DEALING / DEALER TURN SPINNER */
          <div className="flex items-center justify-center py-4 text-sm font-mono text-emerald-400 animate-pulse">
            Executing Dealer Logic...
          </div>
        )}
      </div>
    </div>
  );
};
