export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  suitName: 'spades' | 'hearts' | 'diamonds' | 'clubs';
  isFaceUp: boolean;
}

export interface HandEvaluation {
  total: number;
  isBust: boolean;
  isBlackjack: boolean;
  isSoft: boolean;
  acesCount: number;
  acesReduced: number;
  displayValue: string;
}

export type GameStatus = 
  | 'betting'      // Waiting for player to place bet and press Deal
  | 'dealing'      // Animating initial cards deal
  | 'player_turn'  // Player can Hit, Stand, Double Down
  | 'dealer_turn'  // Dealer is revealing hole card and drawing to >= 17
  | 'round_over';  // Result evaluated and payouts processed

export type GameOutcome = 
  | 'player_blackjack' // Paid 3:2
  | 'player_won'       // Paid 1:1
  | 'dealer_bust'      // Paid 1:1
  | 'dealer_won'       // Lost bet
  | 'player_bust'      // Lost bet
  | 'push'             // Returned bet
  | 'surrender';       // Returned 50% bet

export interface GameResult {
  outcome: GameOutcome;
  title: string;
  message: string;
  payout: number;
  netChange: number;
}

export interface GameStats {
  handsPlayed: number;
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  dealerBusts: number;
  highestBankroll: number;
  totalWagered: number;
  netProfit: number;
}

export interface GameLogEntry {
  id: string;
  timestamp: string;
  playerCards: string[];
  playerScore: number;
  dealerCards: string[];
  dealerScore: number;
  outcome: GameOutcome;
  bet: number;
  payout: number;
  bankrollAfter: number;
}

export interface StrategyAdvice {
  action: 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'SURRENDER';
  explanation: string;
  riskLevel: 'safe' | 'optimal' | 'aggressive' | 'risky';
}

export interface SimulationResult {
  rounds: number;
  playerWins: number;
  playerWinPct: number;
  dealerWins: number;
  dealerWinPct: number;
  pushes: number;
  pushPct: number;
  playerBlackjacks: number;
  dealerBusts: number;
  finalBankroll: number;
  roiPct: number;
  history: number[];
}
