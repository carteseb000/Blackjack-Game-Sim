import { Card, GameOutcome, GameResult, HandEvaluation, Rank, StrategyAdvice, Suit } from '../types';

export const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const SUIT_NAMES: Record<Suit, 'spades' | 'hearts' | 'diamonds' | 'clubs'> = {
  '♠': 'spades',
  '♥': 'hearts',
  '♦': 'diamonds',
  '♣': 'clubs',
};

/**
 * 1. create_deck():
 * Generates and shuffles a standard 52-card deck using Fisher-Yates shuffle algorithm.
 * Can also generate multiple decks (e.g. 1 to 6 decks).
 */
export function create_deck(numDecks = 1): Card[] {
  const deck: Card[] = [];
  
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          id: `${rank}-${suit}-${d}-${Math.random().toString(36).substring(2, 7)}`,
          suit,
          rank,
          suitName: SUIT_NAMES[suit],
          isFaceUp: true,
        });
      }
    }
  }

  // Fisher-Yates unbiased shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }

  return deck;
}

/**
 * Returns raw numeric value of a single card without hand context.
 * Face cards (J, Q, K) = 10, Ace = 11, Number cards = 2-10.
 */
export function get_card_base_value(rank: Rank): number {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

/**
 * 2. calculate_hand_value(cards):
 * Calculates total value of a hand, correctly handling Aces (1 or 11) and Face cards (10).
 * Aces are initially counted as 11. If the total exceeds 21, Aces are sequentially
 * reduced from 11 to 1 (subtracting 10 per Ace) until the hand is <= 21 or no Aces remain at 11.
 */
export function calculate_hand_value(cards: Card[]): HandEvaluation {
  // Only evaluate face-up cards (or all if specified)
  const activeCards = cards.filter(c => c.isFaceUp);
  
  let total = 0;
  let acesCount = 0;

  for (const card of activeCards) {
    if (card.rank === 'A') {
      acesCount++;
      total += 11;
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank, 10);
    }
  }

  let acesReduced = 0;
  while (total > 21 && (acesCount - acesReduced) > 0) {
    total -= 10; // Reduce Ace from 11 to 1
    acesReduced++;
  }

  const isBust = total > 21;
  const isSoft = (acesCount - acesReduced) > 0 && !isBust;
  const isBlackjack = activeCards.length === 2 && total === 21;

  let displayValue = `${total}`;
  if (isSoft && total < 21) {
    displayValue = `${total - 10} / ${total} (Soft ${total})`;
  } else if (isBlackjack) {
    displayValue = 'Blackjack! (21)';
  } else if (isBust) {
    displayValue = `${total} (Bust)`;
  }

  return {
    total,
    isBust,
    isBlackjack,
    isSoft,
    acesCount,
    acesReduced,
    displayValue,
  };
}

/**
 * 3. deal_initial_hands():
 * Deals two cards to the player and two cards to the dealer from the deck.
 * The dealer's second card is dealt face-down (hole card).
 */
export function deal_initial_hands(deck: Card[]): {
  playerHand: Card[];
  dealerHand: Card[];
  remainingDeck: Card[];
} {
  const currentDeck = [...deck];
  
  if (currentDeck.length < 15) {
    // Reshuffle fresh deck if running low
    const freshDeck = create_deck(1);
    currentDeck.length = 0;
    currentDeck.push(...freshDeck);
  }

  const playerCard1 = { ...currentDeck.pop()!, isFaceUp: true };
  const dealerCard1 = { ...currentDeck.pop()!, isFaceUp: true };
  const playerCard2 = { ...currentDeck.pop()!, isFaceUp: true };
  const dealerCard2 = { ...currentDeck.pop()!, isFaceUp: false }; // Hole card (face down)

  return {
    playerHand: [playerCard1, playerCard2],
    dealerHand: [dealerCard1, dealerCard2],
    remainingDeck: currentDeck,
  };
}

/**
 * 4. player_hit(deck, player_hand):
 * Deals a single card face up to the player and computes new hand value.
 */
export function player_hit(deck: Card[], playerHand: Card[]): {
  newPlayerHand: Card[];
  remainingDeck: Card[];
  evaluation: HandEvaluation;
} {
  const currentDeck = [...deck];
  if (currentDeck.length === 0) {
    currentDeck.push(...create_deck(1));
  }

  const newCard = { ...currentDeck.pop()!, isFaceUp: true };
  const newPlayerHand = [...playerHand, newCard];
  const evaluation = calculate_hand_value(newPlayerHand);

  return {
    newPlayerHand,
    remainingDeck: currentDeck,
    evaluation,
  };
}

/**
 * 5. dealer_turn(dealer_hand):
 * Executes dealer logic following strict casino rules:
 * - Reveal hole card
 * - Standard rule: Always hit on 16 or less, stand on 17 or more.
 * - Optional hitOnSoft17: If true (H17 rule), dealer hits on Soft 17. Default is Stand on all 17s (S17).
 */
export function dealer_turn_step(
  deck: Card[],
  dealerHand: Card[],
  hitOnSoft17 = false
): {
  newDealerHand: Card[];
  remainingDeck: Card[];
  evaluation: HandEvaluation;
  shouldHitAgain: boolean;
} {
  const currentDeck = [...deck];
  // Ensure all dealer cards are face up
  const revealedHand = dealerHand.map(card => ({ ...card, isFaceUp: true }));
  let evaluation = calculate_hand_value(revealedHand);

  const shouldHit = () => {
    if (evaluation.total < 17) return true;
    if (hitOnSoft17 && evaluation.total === 17 && evaluation.isSoft) return true;
    return false;
  };

  if (!shouldHit()) {
    return {
      newDealerHand: revealedHand,
      remainingDeck: currentDeck,
      evaluation,
      shouldHitAgain: false,
    };
  }

  if (currentDeck.length === 0) {
    currentDeck.push(...create_deck(1));
  }

  const drawnCard = { ...currentDeck.pop()!, isFaceUp: true };
  const updatedHand = [...revealedHand, drawnCard];
  const updatedEvaluation = calculate_hand_value(updatedHand);

  const willHitAgain = (() => {
    if (updatedEvaluation.total < 17) return true;
    if (hitOnSoft17 && updatedEvaluation.total === 17 && updatedEvaluation.isSoft) return true;
    return false;
  })();

  return {
    newDealerHand: updatedHand,
    remainingDeck: currentDeck,
    evaluation: updatedEvaluation,
    shouldHitAgain: willHitAgain,
  };
}

/**
 * 6. determine_winner(player_hand, dealer_hand, bet):
 * Compares final hands and determines winner, payouts, and net bankroll change according to official Blackjack rules:
 * - Natural Blackjack: 3:2 payout (e.g. $100 bet returns $250, net +$150)
 * - Both have Blackjack: Push (net $0)
 * - Player Bust (> 21): Dealer wins regardless of dealer score
 * - Dealer Bust (> 21): Player wins (1:1 payout)
 * - Higher Score wins: (1:1 payout)
 * - Equal score: Push (return bet)
 */
export function determine_winner(
  playerHand: Card[],
  dealerHand: Card[],
  bet: number,
  isSurrender = false
): GameResult {
  if (isSurrender) {
    return {
      outcome: 'surrender',
      title: 'Surrender',
      message: 'You forfeited half your bet.',
      payout: Math.floor(bet * 0.5),
      netChange: -Math.ceil(bet * 0.5),
    };
  }

  // Ensure all cards are evaluated face up
  const playerEval = calculate_hand_value(playerHand.map(c => ({ ...c, isFaceUp: true })));
  const dealerEval = calculate_hand_value(dealerHand.map(c => ({ ...c, isFaceUp: true })));

  // 1. Check Player Bust
  if (playerEval.isBust) {
    return {
      outcome: 'player_bust',
      title: 'Bust!',
      message: `You went over 21 with a total of ${playerEval.total}.`,
      payout: 0,
      netChange: -bet,
    };
  }

  // 2. Check Blackjacks
  if (playerEval.isBlackjack) {
    if (dealerEval.isBlackjack) {
      return {
        outcome: 'push',
        title: 'Push (Both Blackjack)',
        message: 'Both player and dealer have natural Blackjack!',
        payout: bet,
        netChange: 0,
      };
    }
    // Blackjack pays 3:2
    const profit = Math.floor(bet * 1.5);
    return {
      outcome: 'player_blackjack',
      title: 'Blackjack! 🎰',
      message: `Natural 21! Payout 3:2 (+ $${profit})`,
      payout: bet + profit,
      netChange: profit,
    };
  }

  if (dealerEval.isBlackjack) {
    return {
      outcome: 'dealer_won',
      title: 'Dealer Blackjack',
      message: 'Dealer has a natural Blackjack.',
      payout: 0,
      netChange: -bet,
    };
  }

  // 3. Check Dealer Bust
  if (dealerEval.isBust) {
    return {
      outcome: 'dealer_bust',
      title: 'Dealer Busts! 🎉',
      message: `Dealer busted with ${dealerEval.total}. You win!`,
      payout: bet * 2,
      netChange: bet,
    };
  }

  // 4. Compare Totals
  if (playerEval.total > dealerEval.total) {
    return {
      outcome: 'player_won',
      title: 'You Win! 🏆',
      message: `Your ${playerEval.total} beats dealer's ${dealerEval.total}.`,
      payout: bet * 2,
      netChange: bet,
    };
  } else if (playerEval.total < dealerEval.total) {
    return {
      outcome: 'dealer_won',
      title: 'Dealer Wins',
      message: `Dealer's ${dealerEval.total} beats your ${playerEval.total}.`,
      payout: 0,
      netChange: -bet,
    };
  } else {
    return {
      outcome: 'push',
      title: 'Push 🤝',
      message: `Tied at ${playerEval.total}. Bet returned.`,
      payout: bet,
      netChange: 0,
    };
  }
}

/**
 * Mathematical Basic Strategy Advisor:
 * Recommends statistically optimal play (HIT, STAND, DOUBLE) based on player's cards and dealer upcard.
 */
export function get_strategy_advice(playerCards: Card[], dealerUpcard: Card | null): StrategyAdvice {
  if (!dealerUpcard || playerCards.length === 0) {
    return { action: 'HIT', explanation: 'Awaiting round start.', riskLevel: 'safe' };
  }

  const playerEval = calculate_hand_value(playerCards);
  const upcardVal = get_card_base_value(dealerUpcard.rank);
  const canDouble = playerCards.length === 2;

  // Soft hands (hands containing an Ace counted as 11)
  if (playerEval.isSoft && playerCards.length === 2) {
    const nonAceCard = playerCards.find(c => c.rank !== 'A') || playerCards[0];
    const otherVal = nonAceCard.rank === 'A' ? 1 : get_card_base_value(nonAceCard.rank);

    if (playerEval.total >= 20) {
      return { action: 'STAND', explanation: 'Soft 20/21 is a powerhouse hand.', riskLevel: 'safe' };
    }
    if (playerEval.total === 19) {
      if (upcardVal === 6 && canDouble) {
        return { action: 'DOUBLE', explanation: 'Double vs dealer 6 to maximize edge.', riskLevel: 'optimal' };
      }
      return { action: 'STAND', explanation: 'Soft 19 is strong; stand against dealer.', riskLevel: 'safe' };
    }
    if (playerEval.total === 18) {
      if (canDouble && upcardVal >= 2 && upcardVal <= 6) {
        return { action: 'DOUBLE', explanation: 'Double soft 18 against dealer weak cards (2-6).', riskLevel: 'optimal' };
      }
      if (upcardVal === 9 || upcardVal === 10 || upcardVal === 11) {
        return { action: 'HIT', explanation: 'Hit soft 18 vs high dealer cards (9, 10, A).', riskLevel: 'risky' };
      }
      return { action: 'STAND', explanation: 'Stand soft 18 vs dealer 7 or 8.', riskLevel: 'safe' };
    }
    if (playerEval.total === 17) {
      if (canDouble && upcardVal >= 3 && upcardVal <= 6) {
        return { action: 'DOUBLE', explanation: 'Double soft 17 vs dealer 3-6.', riskLevel: 'optimal' };
      }
      return { action: 'HIT', explanation: 'Always hit soft 17 (cannot bust).', riskLevel: 'safe' };
    }
    // Soft 13-16
    if (canDouble && (upcardVal === 5 || upcardVal === 6)) {
      return { action: 'DOUBLE', explanation: `Double soft ${playerEval.total} vs dealer ${upcardVal}.`, riskLevel: 'optimal' };
    }
    return { action: 'HIT', explanation: `Hit soft ${playerEval.total} safely.`, riskLevel: 'safe' };
  }

  // Hard hands
  const total = playerEval.total;

  if (total >= 17) {
    return { action: 'STAND', explanation: `Stand on hard ${total}; high risk of busting.`, riskLevel: 'safe' };
  }
  if (total >= 13 && total <= 16) {
    if (upcardVal >= 2 && upcardVal <= 6) {
      return { action: 'STAND', explanation: `Dealer shows weak card (${upcardVal}); let dealer bust.`, riskLevel: 'optimal' };
    }
    return { action: 'HIT', explanation: `Dealer shows strong card (${upcardVal}); must hit.`, riskLevel: 'risky' };
  }
  if (total === 12) {
    if (upcardVal >= 4 && upcardVal <= 6) {
      return { action: 'STAND', explanation: 'Stand 12 vs dealer 4, 5, or 6.', riskLevel: 'optimal' };
    }
    return { action: 'HIT', explanation: 'Hit 12 vs dealer 2, 3, 7-A.', riskLevel: 'risky' };
  }
  if (total === 11) {
    if (canDouble) {
      return { action: 'DOUBLE', explanation: 'Double down on 11 for massive edge.', riskLevel: 'optimal' };
    }
    return { action: 'HIT', explanation: 'Hit 11 to aim for 21.', riskLevel: 'safe' };
  }
  if (total === 10) {
    if (canDouble && upcardVal >= 2 && upcardVal <= 9) {
      return { action: 'DOUBLE', explanation: 'Double 10 vs dealer 2-9.', riskLevel: 'optimal' };
    }
    return { action: 'HIT', explanation: 'Hit 10 to draw a 10 or Ace.', riskLevel: 'safe' };
  }
  if (total === 9) {
    if (canDouble && upcardVal >= 3 && upcardVal <= 6) {
      return { action: 'DOUBLE', explanation: 'Double 9 vs dealer 3-6.', riskLevel: 'optimal' };
    }
    return { action: 'HIT', explanation: 'Hit 9.', riskLevel: 'safe' };
  }

  return { action: 'HIT', explanation: `Always hit ${total}; you cannot bust.`, riskLevel: 'safe' };
}
