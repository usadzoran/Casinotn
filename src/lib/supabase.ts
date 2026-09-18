import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Game,
  Match,
  Profile,
  Wallet,
  WalletTransaction,
  Bet,
  Notification,
  ActivityLog,
  GameHistory,
} from '../types/database';

// Safe localStorage wrapper to avoid DOMException / SecurityError in sandboxes/iframes/private windows
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Storage access blocked or unavailable
    }
    return null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Storage access blocked or unavailable
    }
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Storage access blocked or unavailable
    }
  },
};

export const DEFAULT_SUPABASE_URL = 'https://aixntdfmdozuiriwaqdq.supabase.co';
const rawEnvUrl = typeof import.meta !== 'undefined' && import.meta?.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
const rawEnvKey = typeof import.meta !== 'undefined' && import.meta?.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;

export const ENV_SUPABASE_URL = (rawEnvUrl || '').trim() || DEFAULT_SUPABASE_URL;
export const ENV_SUPABASE_ANON_KEY = (rawEnvKey || '').trim();

function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl || typeof stringUrl !== 'string') return false;
  try {
    const parsed = new URL(stringUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const getSavedSupabaseConfig = () => {
  const customUrl = (safeStorage.getItem('5LION_SUPABASE_URL') || '').trim();
  const customKey = (safeStorage.getItem('5LION_SUPABASE_ANON_KEY') || '').trim();

  const activeUrl = customUrl || ENV_SUPABASE_URL;
  const activeKey = customKey || ENV_SUPABASE_ANON_KEY;

  const isUrlValid = isValidHttpUrl(activeUrl) && !activeUrl.includes('your-project-id');
  const isKeyValid = Boolean(activeKey && activeKey.length > 20 && !activeKey.includes('your-anon'));

  return {
    url: activeUrl,
    anonKey: activeKey,
    isCustom: Boolean(customUrl && customKey),
    isConfigured: Boolean(isUrlValid && isKeyValid),
  };
};

export const saveSupabaseConfig = (url: string, anonKey: string) => {
  if (url && anonKey) {
    safeStorage.setItem('5LION_SUPABASE_URL', url.trim());
    safeStorage.setItem('5LION_SUPABASE_ANON_KEY', anonKey.trim());
    try {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch {
      // ignore
    }
  }
};

export const clearSupabaseConfig = () => {
  safeStorage.removeItem('5LION_SUPABASE_URL');
  safeStorage.removeItem('5LION_SUPABASE_ANON_KEY');
  try {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  } catch {
    // ignore
  }
};

const activeConfig = getSavedSupabaseConfig();
const clientUrl = isValidHttpUrl(activeConfig.url) ? activeConfig.url : DEFAULT_SUPABASE_URL;
// Use configured key, or a placeholder if missing so createClient does not throw on startup
const clientKey = activeConfig.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase: SupabaseClient = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: safeStorage,
  },
});

// ====================================================================
// PURE SUPABASE SERVICE LAYER (Single Source of Truth)
// All balances, transactions, bets, and settlements execute via PostgreSQL RPCs
// ====================================================================

export const casinoApi = {
  // Profiles & Wallets
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) {
      console.warn('Error fetching profile:', error.message);
      return null;
    }
    return data;
  },

  async getWallet(userId: string): Promise<Wallet | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      console.warn('Error fetching wallet:', error.message);
      return null;
    }
    return data;
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching all profiles:', error.message);
      return [];
    }
    return data || [];
  },

  async getAllWallets(): Promise<Wallet[]> {
    const { data, error } = await supabase
      .from('wallets')
      .select('*');
    if (error) {
      console.warn('Error fetching all wallets:', error.message);
      return [];
    }
    return data || [];
  },

  // Games & Catalog
  async getGames(): Promise<Game[]> {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('Error fetching games:', error.message);
      return [];
    }
    return data || [];
  },

  // Matches & Betting
  async getMatches(): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('match_time', { ascending: true });
    if (error) {
      console.warn('Error fetching matches:', error.message);
      return [];
    }
    return data || [];
  },

  async getBets(userId?: string, role?: string): Promise<Bet[]> {
    let query = supabase
      .from('bets')
      .select('*, match:matches(*), profile:profiles(*)');

    if (role === 'player' && userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching bets:', error.message);
      return [];
    }
    return data || [];
  },

  // Transactions Ledger
  async getTransactions(userId?: string, role?: string): Promise<WalletTransaction[]> {
    let query = supabase
      .from('wallet_transactions')
      .select('*, source_profile:profiles!source_user_id(*), target_profile:profiles!target_user_id(*)');

    if (role === 'player' && userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching transactions:', error.message);
      return [];
    }
    return data || [];
  },

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('Error fetching notifications:', error.message);
      return [];
    }
    return data || [];
  },

  async markNotificationsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) {
      console.warn('Error marking notifications read:', error.message);
    }
  },

  // ====================================================================
  // STRICT ATOMIC RPC WRAPPERS
  // ====================================================================

  /**
   * Owner adds/transfers virtual balance to Admin from main treasury
   */
  async ownerTransferToAdmin(adminId: string, amount: number): Promise<{ success: boolean; new_owner_balance?: number; new_admin_balance?: number }> {
    // Try primary RPC name, fallback to owner_add_admin_balance
    let { data, error } = await supabase.rpc('owner_transfer_to_admin', {
      admin_id: adminId,
      amount: amount,
    });

    if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
      const fallback = await supabase.rpc('owner_add_admin_balance', {
        p_admin_id: adminId,
        p_amount: amount,
      });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      throw new Error(error.message || 'فشل تحويل الرصيد من المالك إلى المشرف');
    }
    return data;
  },

  /**
   * Admin transfers virtual balance to Player
   */
  async adminTransferToPlayer(playerId: string, amount: number): Promise<{ success: boolean; new_admin_balance?: number; new_player_balance?: number }> {
    let { data, error } = await supabase.rpc('admin_transfer_to_player', {
      player_id: playerId,
      amount: amount,
    });

    if (error && error.message?.includes('p_player_id')) {
      const fallback = await supabase.rpc('admin_transfer_to_player', {
        p_player_id: playerId,
        p_amount: amount,
      });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      throw new Error(error.message || 'فشل تحويل الرصيد للاعب');
    }
    return data;
  },

  /**
   * Place match bet via atomic RPC
   */
  async placeMatchBet(matchId: string, selectedTeam: 'team_a' | 'team_b' | 'draw', amount: number): Promise<{
    success: boolean;
    bet_id: string;
    new_balance: number;
    potential_win: number;
  }> {
    let { data, error } = await supabase.rpc('place_match_bet', {
      match_id: matchId,
      selected_team: selectedTeam,
      amount: amount,
    });

    if (error && error.message?.includes('p_match_id')) {
      const fallback = await supabase.rpc('place_match_bet', {
        p_match_id: matchId,
        p_selected_team: selectedTeam,
        p_bet_amount: amount,
      });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      throw new Error(error.message || 'فشل تسجيل الرهان');
    }

    return {
      success: true,
      bet_id: data?.bet_id || data?.betId,
      new_balance: data?.new_balance ?? data?.newBalance,
      potential_win: data?.potential_win ?? data?.potentialWin,
    };
  },

  /**
   * Settle match (Owner or Admin only)
   */
  async settleMatch(
    matchId: string,
    winningTeam: 'team_a' | 'team_b' | 'draw' | 'cancelled',
    scoreA: number = 0,
    scoreB: number = 0
  ): Promise<{
    success: boolean;
    won_count: number;
    lost_count: number;
    total_paid: number;
  }> {
    let { data, error } = await supabase.rpc('settle_match', {
      match_id: matchId,
      winning_team: winningTeam,
      score_a: scoreA,
      score_b: scoreB,
    });

    if (error && error.message?.includes('p_match_id')) {
      const fallback = await supabase.rpc('settle_match', {
        p_match_id: matchId,
        p_winning_team: winningTeam,
        p_score_a: scoreA,
        p_score_b: scoreB,
      });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      throw new Error(error.message || 'فشلت تسوية المباراة');
    }

    return {
      success: true,
      won_count: data?.won_count ?? data?.wonCount ?? 0,
      lost_count: data?.lost_count ?? data?.lostCount ?? 0,
      total_paid: data?.total_paid ?? data?.totalPayout ?? 0,
    };
  },

  /**
   * Play casino game via atomic RPC
   */
  async playGame(
    gameSlug: string,
    betAmount: number,
    gameAction: string = 'spin',
    choice?: string
  ): Promise<{
    success: boolean;
    isWin: boolean;
    multiplier: number;
    payout: number;
    newBalance: number;
    gameResult: any;
  }> {
    let { data, error } = await supabase.rpc('play_game', {
      game_slug: gameSlug,
      bet_amount: betAmount,
      game_action: gameAction,
      choice: choice || null,
    });

    if (error && (error.message?.includes('does not exist') || error.message?.includes('function'))) {
      const fallback = await supabase.rpc('play_casino_game', {
        p_game_slug: gameSlug,
        p_bet_amount: betAmount,
        p_game_action: gameAction,
        p_choice: choice || null,
      });
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      throw new Error(error.message || 'فشلت عملية اللعبة');
    }

    return {
      success: true,
      isWin: data?.is_win ?? data?.isWin ?? false,
      multiplier: Number(data?.multiplier || 0),
      payout: Number(data?.payout || 0),
      newBalance: Number(data?.new_balance ?? data?.newBalance ?? 0),
      gameResult: data?.game_result ?? data?.gameResult ?? {},
    };
  },

  /**
   * Suspend or toggle status of user
   */
  async suspendUser(targetUserId: string, newStatus: 'active' | 'suspended' | 'blocked'): Promise<void> {
    let { error } = await supabase.rpc('suspend_user', {
      target_user_id: targetUserId,
      new_status: newStatus,
    });

    if (error && error.message?.includes('p_target_user_id')) {
      const fallback = await supabase.rpc('suspend_user', {
        p_target_user_id: targetUserId,
        p_new_status: newStatus,
      });
      error = fallback.error;
    }

    if (error) {
      throw new Error(error.message || 'تعذر تعديل حالة المستخدم');
    }
  },

  /**
   * Create new match (Owner only)
   */
  async createMatch(matchData: Partial<Match>): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .insert([matchData])
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'فشل إنشاء المباراة');
    }
    return data;
  },

  /**
   * Assign or promote a user to admin role (Owner only)
   */
  async assignAdminRole(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message || 'فشل تعيين دور المشرف');
    }
  },
};
