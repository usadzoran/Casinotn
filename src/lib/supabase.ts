import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Game,
  Match,
  Profile,
  Wallet,
  WalletTransaction,
  Bet,
  Notification,
} from '../types/database';
import { casinoDatabase } from './databaseEngine';

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
  const isKeyValid = Boolean(activeKey && activeKey.length > 25 && !activeKey.includes('placeholder') && !activeKey.includes('your-anon'));

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
  }
};

export const clearSupabaseConfig = () => {
  safeStorage.removeItem('5LION_SUPABASE_URL');
  safeStorage.removeItem('5LION_SUPABASE_ANON_KEY');
};

const activeConfig = getSavedSupabaseConfig();
const clientUrl = isValidHttpUrl(activeConfig.url) ? activeConfig.url : DEFAULT_SUPABASE_URL;
const clientKey = activeConfig.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase: SupabaseClient = createClient(clientUrl, clientKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: safeStorage,
  },
});

/**
 * Real-time connection tester to verify whether the Supabase database is reachable and tables exist
 */
export async function testSupabaseConnection(
  testUrl: string,
  testKey: string
): Promise<{ success: boolean; message: string; details?: any }> {
  if (!isValidHttpUrl(testUrl)) {
    return { success: false, message: 'عنوان Project URL غير صالح' };
  }
  if (!testKey || testKey.length < 20) {
    return { success: false, message: 'مفتاح Anon Key غير صالح أو قصير جداً' };
  }

  try {
    const testClient = createClient(testUrl, testKey, {
      auth: { persistSession: false },
    });

    const { error: matchErr } = await testClient.from('matches').select('id').limit(1);
    if (matchErr) {
      if (matchErr.message.includes('relation') && matchErr.message.includes('does not exist')) {
        return {
          success: false,
          message: 'تم الاتصال بـ Supabase، ولكن الجداول غير موجودة بعد. يرجى تشغيل كود SQL أولاً.',
        };
      }
      return { success: false, message: `خطأ في الاتصال: ${matchErr.message}` };
    }

    return {
      success: true,
      message: 'تم الاتصال بنجاح بقاعدة بيانات Supabase وجداول كازينو 5LION جاهزة!',
    };
  } catch (err: any) {
    return { success: false, message: `تعذر الاتصال بـ Supabase: ${err.message || err}` };
  }
}

// ====================================================================
// UNIFIED CASINO API (Hybrid Cloud Supabase + Autonomous Local Engine)
// If Supabase is configured and reachable, it uses Supabase.
// Otherwise, it seamlessly runs on the local persistent database engine.
// ====================================================================

const isSupabaseReady = () => getSavedSupabaseConfig().isConfigured;

export const casinoApi = {
  // Profiles & Wallets
  async getProfile(userId: string): Promise<Profile | null> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (!error && data) return data;
      } catch {
        // Fallback to local
      }
    }
    return casinoDatabase.getProfile(userId);
  },

  async getWallet(userId: string): Promise<Wallet | null> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (!error && data) return data;
      } catch {
        // Fallback to local
      }
    }
    return casinoDatabase.getWallet(userId);
  },

  async getAllProfiles(): Promise<Profile[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch {
        // Fallback to local
      }
    }
    return casinoDatabase.getAllProfiles();
  },

  async getAllWallets(): Promise<Wallet[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase.from('wallets').select('*');
        if (!error && data && data.length > 0) return data;
      } catch {
        // Fallback to local
      }
    }
    return casinoDatabase.getAllWallets();
  },

  // Games & Catalog
  async getGames(): Promise<Game[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase
          .from('games')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch {
        // Fallback to local
      }
    }
    return casinoDatabase.getGames();
  },

  // Matches & Betting
  async getMatches(): Promise<Match[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase
          .from('matches')
          .select('*')
          .order('match_time', { ascending: true });
        if (!error && data && data.length > 0) return data;
      } catch {
        // Fallback to local
      }
    }
    return casinoDatabase.getMatches();
  },

  async getBets(userId?: string, role?: string): Promise<Bet[]> {
    if (isSupabaseReady()) {
      try {
        let query = supabase
          .from('bets')
          .select('*, match:matches(*), profile:profiles(*)');

        if (role === 'player' && userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch {
        // Fallback to local
      }
    }
    return casinoDatabase.getBets(userId, role);
  },

  // Transactions Ledger
  async getTransactions(userId?: string, role?: string): Promise<WalletTransaction[]> {
    if (isSupabaseReady()) {
      try {
        let query = supabase
          .from('wallet_transactions')
          .select('*, source_profile:profiles!source_user_id(*), target_profile:profiles!target_user_id(*)');

        if (role === 'player' && userId) {
          query = query.eq('user_id', userId);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch {
        // Fallback to local
      }
    }
    return casinoDatabase.getTransactions(userId, role);
  },

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data;
      } catch {
        // Fallback to local
      }
    }
    return casinoDatabase.getNotifications(userId);
  },

  async markNotificationsRead(userId: string): Promise<void> {
    if (isSupabaseReady()) {
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('read', false);
      } catch {
        // ignore
      }
    }
    casinoDatabase.markNotificationsRead(userId);
  },

  // ====================================================================
  // ATOMIC TRANSACTIONS & RPCS
  // ====================================================================

  /**
   * Owner transfers virtual balance to Admin from main treasury
   */
  async ownerTransferToAdmin(
    adminId: string,
    amount: number
  ): Promise<{ success: boolean; new_owner_balance?: number; new_admin_balance?: number }> {
    if (isSupabaseReady()) {
      try {
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

        if (!error) return data;
        console.warn('Supabase ownerTransferToAdmin failed, using local engine:', error.message);
      } catch (err: any) {
        console.warn('Supabase RPC call failed, using local engine:', err.message);
      }
    }

    return casinoDatabase.ownerTransferToAdmin(adminId, amount);
  },

  /**
   * Admin transfers virtual balance to Player
   */
  async adminTransferToPlayer(
    playerId: string,
    amount: number
  ): Promise<{ success: boolean; new_admin_balance?: number; new_player_balance?: number }> {
    if (isSupabaseReady()) {
      try {
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

        if (!error) return data;
        console.warn('Supabase adminTransferToPlayer failed, using local engine:', error.message);
      } catch (err: any) {
        console.warn('Supabase RPC call failed, using local engine:', err.message);
      }
    }

    const currentSession = casinoDatabase.getSessionUser();
    const adminId = currentSession?.id || 'admin-00000000-0000-0000-0000-000000000001';
    return casinoDatabase.adminTransferToPlayer(adminId, playerId, amount);
  },

  /**
   * Place match bet
   */
  async placeMatchBet(
    matchId: string,
    selectedTeam: 'team_a' | 'team_b' | 'draw',
    amount: number
  ): Promise<{
    success: boolean;
    bet_id: string;
    new_balance: number;
    potential_win: number;
  }> {
    if (isSupabaseReady()) {
      try {
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

        if (!error && data) {
          return {
            success: true,
            bet_id: data?.bet_id || data?.betId,
            new_balance: data?.new_balance ?? data?.newBalance,
            potential_win: data?.potential_win ?? data?.potentialWin,
          };
        }
      } catch (err: any) {
        console.warn('Supabase placeMatchBet failed, using local engine:', err.message);
      }
    }

    const currentSession = casinoDatabase.getSessionUser();
    const userId = currentSession?.id || 'player-00000000-0000-0000-0000-000000000001';
    return casinoDatabase.placeMatchBet(userId, matchId, selectedTeam, amount);
  },

  /**
   * Settle match
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
    if (isSupabaseReady()) {
      try {
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

        if (!error && data) {
          return {
            success: true,
            won_count: data?.won_count ?? data?.wonCount ?? 0,
            lost_count: data?.lost_count ?? data?.lostCount ?? 0,
            total_paid: data?.total_paid ?? data?.totalPayout ?? 0,
          };
        }
      } catch (err: any) {
        console.warn('Supabase settleMatch failed, using local engine:', err.message);
      }
    }

    return casinoDatabase.settleMatch(matchId, winningTeam, scoreA, scoreB);
  },

  /**
   * Play casino game
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
    if (isSupabaseReady()) {
      try {
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

        if (!error && data) {
          return {
            success: true,
            isWin: data?.is_win ?? data?.isWin ?? false,
            multiplier: Number(data?.multiplier || 0),
            payout: Number(data?.payout || 0),
            newBalance: Number(data?.new_balance ?? data?.newBalance ?? 0),
            gameResult: data?.game_result ?? data?.gameResult ?? {},
          };
        }
      } catch (err: any) {
        console.warn('Supabase playGame failed, using local engine:', err.message);
      }
    }

    const currentSession = casinoDatabase.getSessionUser();
    const userId = currentSession?.id || 'player-00000000-0000-0000-0000-000000000001';
    return casinoDatabase.playGame(userId, gameSlug, betAmount);
  },

  /**
   * Suspend or toggle status of user
   */
  async suspendUser(targetUserId: string, newStatus: 'active' | 'suspended' | 'blocked'): Promise<void> {
    if (isSupabaseReady()) {
      try {
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

        if (!error) return;
      } catch {
        // Fallback
      }
    }
    casinoDatabase.suspendUser(targetUserId, newStatus);
  },

  /**
   * Create new match (Owner only)
   */
  async createMatch(matchData: Partial<Match>): Promise<Match> {
    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase
          .from('matches')
          .insert([matchData])
          .select()
          .single();

        if (!error && data) return data;
      } catch {
        // Fallback
      }
    }
    return casinoDatabase.createMatch(matchData);
  },

  /**
   * Assign or promote a user to admin role (Owner only)
   */
  async assignAdminRole(userId: string): Promise<void> {
    if (isSupabaseReady()) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', userId);

        if (!error) return;
      } catch {
        // Fallback
      }
    }
    casinoDatabase.assignAdminRole(userId);
  },
};
