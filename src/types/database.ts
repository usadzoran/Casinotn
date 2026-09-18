export type UserRole = 'owner' | 'admin' | 'player';
export type UserStatus = 'active' | 'suspended' | 'blocked';

export type TransactionType =
  | 'OWNER_TO_ADMIN'
  | 'ADMIN_TO_PLAYER'
  | 'PLAYER_REFUND'
  | 'GAME_BET'
  | 'GAME_WIN'
  | 'BET_PLACED'
  | 'BET_WIN'
  | 'BET_LOSS'
  | 'ADMIN_ADJUSTMENT'
  | 'OWNER_ADJUSTMENT';

export type MatchStatus = 'open' | 'live' | 'settled' | 'cancelled';
export type BetStatus = 'pending' | 'won' | 'lost' | 'cancelled';

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  assigned_admin_id?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: 'VIRTUAL_USD';
  is_locked?: boolean;
  created_at?: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id?: string | null;
  type: TransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  source_user_id?: string | null;
  target_user_id?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  description: string;
  created_at: string;
  source_profile?: Profile;
  target_profile?: Profile;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  status: 'active' | 'inactive';
  minimum_bet: number;
  maximum_bet: number;
  min_bet?: number;
  max_bet?: number;
  rtp_percentage?: number;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  league: string;
  sport?: string;
  team_a: string;
  team_b: string;
  team_a_logo?: string;
  team_b_logo?: string;
  match_time: string;
  status: MatchStatus;
  odds_team_a: number;
  odds_team_b: number;
  odds_draw?: number;
  score_team_a?: number | null;
  score_team_b?: number | null;
  score_a?: number | null;
  score_b?: number | null;
  winning_team?: 'team_a' | 'team_b' | 'draw' | 'cancelled' | null;
  settled_by?: string | null;
  settled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  match_id: string;
  selected_team: 'team_a' | 'team_b' | 'draw';
  bet_amount: number;
  amount?: number;
  odds: number;
  potential_win: number;
  status: BetStatus;
  result?: 'pending' | 'win' | 'loss' | 'cancelled';
  created_at: string;
  updated_at?: string;
  settled_at?: string | null;
  match?: Match;
  profile?: Profile;
}

export interface Conversation {
  id: string;
  player_id: string;
  admin_id?: string | null;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  player?: Profile;
  admin?: Profile;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  read_at?: string | null;
  created_at: string;
  sender?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface ActivityLog {
  id: string;
  user_id?: string | null;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  metadata?: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
  user?: Profile;
}

export interface GameHistory {
  id: string;
  user_id: string;
  game_id: string;
  bet_amount: number;
  multiplier: number;
  payout: number;
  result: 'win' | 'loss';
  game_data?: Record<string, any>;
  created_at: string;
  game?: Game;
  profile?: Profile;
}
