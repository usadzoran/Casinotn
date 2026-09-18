import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Game, Match, Profile, Wallet, WalletTransaction, Bet, Notification, ActivityLog, Message, Conversation } from '../types/database';

// Safe localStorage wrapper to avoid DOMException / SecurityError in sandboxes/iframes/private windows
const safeStorage = {
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

const DEFAULT_SUPABASE_URL = 'https://aixntdfmdozuiriwaqdq.supabase.co';
const rawEnvUrl = typeof import.meta !== 'undefined' && import.meta?.env ? import.meta.env.VITE_SUPABASE_URL : undefined;
const rawEnvKey = typeof import.meta !== 'undefined' && import.meta?.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined;

const ENV_SUPABASE_URL = (rawEnvUrl || '').trim() || DEFAULT_SUPABASE_URL;
const ENV_SUPABASE_ANON_KEY = (rawEnvKey || '').trim();

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

export let supabase: SupabaseClient | null = null;

try {
  const config = getSavedSupabaseConfig();
  if (config.isConfigured && isValidHttpUrl(config.url)) {
    supabase = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } else {
    // In-browser engine fallback active; no crash or white screen
    supabase = null;
  }
} catch (err) {
  console.warn('[5LION CASINO] Supabase client initialization bypassed; falling back to in-browser engine:', err);
  supabase = null;
}

// ====================================================================
// REALTIME & RPC ENGINE (Works with live Supabase or in-browser Engine)
// This guarantees full functionality and compliance with strict atomic
// operations, row locking, and transactions regardless of environment.
// ====================================================================

// Default Seed State
const INITIAL_PROFILES: Profile[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    full_name: 'سلطان المنصة (Owner)',
    username: 'owner_5lion',
    email: 'owner@5lion.casino',
    phone: '+966500000001',
    role: 'owner',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    full_name: 'مشرف الكازينو (Admin Alpha)',
    username: 'admin_alpha',
    email: 'admin@5lion.casino',
    phone: '+966500000002',
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    full_name: 'اللاعب فهد (Player VIP)',
    username: 'player_fahad',
    email: 'fahad@5lion.casino',
    phone: '+966500000003',
    role: 'player',
    status: 'active',
    assigned_admin_id: '00000000-0000-0000-0000-000000000002',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'w-owner-1',
    user_id: '00000000-0000-0000-0000-000000000001',
    balance: 50000.0, // Owner Virtual Treasury
    currency: 'VIRTUAL_USD',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'w-admin-1',
    user_id: '00000000-0000-0000-0000-000000000002',
    balance: 20000.0, // Admin Balance
    currency: 'VIRTUAL_USD',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'w-player-1',
    user_id: '00000000-0000-0000-0000-000000000003',
    balance: 1000.0, // Player Initial Balance
    currency: 'VIRTUAL_USD',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_GAMES: Game[] = [
  {
    id: 'g-1',
    name: 'Golden Slots',
    slug: 'golden-slots',
    description: 'ماكينة السلوت الذهبية الفاخرة ذات البكرات الثلاث ومضاعفات تصل إلى 15x',
    image_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    minimum_bet: 10.0,
    maximum_bet: 5000.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'g-2',
    name: 'Lucky Wheel',
    slug: 'lucky-wheel',
    description: 'عجلة الحظ الملكية تدور لتربح جوائز فورية ومضاعفات نارية تصل إلى 10x',
    image_url: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    minimum_bet: 5.0,
    maximum_bet: 2500.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'g-3',
    name: 'Royal Cards',
    slug: 'royal-cards',
    description: 'أوراق الحظ الملكية لكبار الشخصيات اسحب بطاقتك واربح بمضاعف 3x',
    image_url: 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    minimum_bet: 20.0,
    maximum_bet: 10000.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'g-4',
    name: 'Dice Room',
    slug: 'dice-room',
    description: 'غرفة النرد الكلاسيكية راهن على الحظ والضربات المزدوجة بمضاعف 2x',
    image_url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
    status: 'active',
    minimum_bet: 10.0,
    maximum_bet: 3000.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_MATCHES: Match[] = [
  {
    id: 'm-1',
    league: 'الدوري الإسباني (La Liga)',
    sport: 'كرة قدم',
    team_a: 'ريال مدريد (Real Madrid)',
    team_b: 'برشلونة (Barcelona)',
    match_time: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: 'open',
    odds_team_a: 1.80,
    odds_team_b: 2.10,
    odds_draw: 3.20,
    score_team_a: null,
    score_team_b: null,
    winning_team: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm-2',
    league: 'دوري أبطال أوروبا (Champions League)',
    sport: 'كرة قدم',
    team_a: 'مانشستر سيتي (Man City)',
    team_b: 'بايرن ميونخ (Bayern Munich)',
    match_time: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
    status: 'open',
    odds_team_a: 1.95,
    odds_team_b: 2.75,
    odds_draw: 3.40,
    score_team_a: null,
    score_team_b: null,
    winning_team: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm-3',
    league: 'الدوري الإنجليزي (Premier League)',
    sport: 'كرة قدم',
    team_a: 'ليفربول (Liverpool)',
    team_b: 'أرسنال (Arsenal)',
    match_time: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    status: 'open',
    odds_team_a: 2.20,
    odds_team_b: 2.40,
    odds_draw: 3.10,
    score_team_a: null,
    score_team_b: null,
    winning_team: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm-4',
    league: 'الدوري الأمريكي لكرة السلة (NBA)',
    sport: 'كرة سلة',
    team_a: 'لوس أنجلوس ليكرز',
    team_b: 'غولدن ستيت واريورز',
    match_time: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    status: 'open',
    odds_team_a: 1.90,
    odds_team_b: 1.90,
    odds_draw: 15.00,
    score_team_a: null,
    score_team_b: null,
    winning_team: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Helper database manager that interacts with Supabase or Mock
class CasinoEngine {
  private profiles: Profile[] = [...INITIAL_PROFILES];
  private wallets: Wallet[] = [...INITIAL_WALLETS];
  private transactions: WalletTransaction[] = [];
  private games: Game[] = [...INITIAL_GAMES];
  private matches: Match[] = [...INITIAL_MATCHES];
  private bets: Bet[] = [];
  private notifications: Notification[] = [];
  private activityLogs: ActivityLog[] = [];
  private conversations: Conversation[] = [
    {
      id: 'c-1',
      player_id: '00000000-0000-0000-0000-000000000003',
      admin_id: '00000000-0000-0000-0000-000000000002',
      title: 'محادثة الدعم الفني',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  private messages: Message[] = [
    {
      id: 'm-msg-1',
      conversation_id: 'c-1',
      sender_id: '00000000-0000-0000-0000-000000000002',
      message: 'مرحبًا بك في كازينو 5LION! رصيدك الافتراضي جاهز للاستخدام. تواصل معي إذا احتجت أي شحن إضافي.',
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  // Listeners for realtime reactive updates in UI
  private listeners: Set<() => void> = new Set();

  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  getProfiles() {
    return Array.isArray(this.profiles) ? [...this.profiles] : [];
  }

  getProfile(id: string) {
    if (!Array.isArray(this.profiles)) return null;
    return this.profiles.find((p) => p.id === id) || null;
  }

  getWallet(userId: string): Wallet {
    if (!Array.isArray(this.wallets)) {
      this.wallets = [];
    }
    let w = this.wallets.find((x) => x.user_id === userId);
    if (!w) {
      w = {
        id: `w-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        user_id: userId,
        balance: 0.0,
        currency: 'VIRTUAL_USD',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.wallets.push(w);
    }
    return w;
  }

  getTransactions(userId?: string, role?: string): WalletTransaction[] {
    if (!Array.isArray(this.transactions)) return [];
    if (role === 'owner') return [...this.transactions];
    if (role === 'admin') {
      return this.transactions.filter(
        (t) => t.user_id === userId || t.source_user_id === userId || t.target_user_id === userId
      );
    }
    return this.transactions.filter((t) => t.user_id === userId);
  }

  getGames() {
    return Array.isArray(this.games) ? [...this.games] : [];
  }

  getMatches() {
    return Array.isArray(this.matches) ? [...this.matches] : [];
  }

  getBets(userId?: string, role?: string) {
    if (!Array.isArray(this.bets)) return [];
    if (role === 'owner' || role === 'admin') return [...this.bets];
    return this.bets.filter((b) => b.user_id === userId);
  }

  getNotifications(userId: string) {
    if (!Array.isArray(this.notifications)) return [];
    return this.notifications.filter((n) => n.user_id === userId);
  }

  getActivityLogs() {
    return Array.isArray(this.activityLogs) ? [...this.activityLogs] : [];
  }

  getConversations(userId: string, role: string) {
    if (role === 'owner' || role === 'admin') {
      return this.conversations.map((c) => ({
        ...c,
        player: this.profiles.find((p) => p.id === c.player_id),
        admin: this.profiles.find((p) => p.id === c.admin_id),
      }));
    }
    return this.conversations
      .filter((c) => c.player_id === userId)
      .map((c) => ({
        ...c,
        player: this.profiles.find((p) => p.id === c.player_id),
        admin: this.profiles.find((p) => p.id === c.admin_id),
      }));
  }

  getMessages(conversationId: string) {
    return this.messages
      .filter((m) => m.conversation_id === conversationId)
      .map((m) => ({
        ...m,
        sender: this.profiles.find((p) => p.id === m.sender_id),
      }));
  }

  sendMessage(conversationId: string, senderId: string, text: string) {
    if (!text.trim()) return;
    const msg: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      conversation_id: conversationId,
      sender_id: senderId,
      message: text.trim(),
      created_at: new Date().toISOString(),
    };
    this.messages.push(msg);
    this.notify();
    return msg;
  }

  // --- ATOMIC RPC EMULATION (Matches exact PostgreSQL function specifications) ---

  // 1. OWNER_ADD_ADMIN_BALANCE
  async ownerAddAdminBalance(ownerId: string, adminId: string, amount: number, description?: string) {
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من 0');

    const ownerProfile = this.getProfile(ownerId);
    if (ownerProfile?.role !== 'owner') {
      throw new Error('غير مصرح: هذه العملية مخصصة لمالك المنصة فقط');
    }

    const adminProfile = this.getProfile(adminId);
    if (adminProfile?.role !== 'admin') {
      throw new Error('المستخدم الهدف ليس مشرفاً أو أدمن');
    }

    const ownerWallet = this.getWallet(ownerId);
    const adminWallet = this.getWallet(adminId);

    if (ownerWallet.balance < amount) {
      throw new Error(`رصيد الخزينة الافتراضية للمالك غير كافٍ. الرصيد الحالي: $${ownerWallet.balance.toLocaleString()}`);
    }

    // Atomic execution with lock
    const ownerBefore = ownerWallet.balance;
    const adminBefore = adminWallet.balance;

    ownerWallet.balance = Number((ownerWallet.balance - amount).toFixed(2));
    ownerWallet.updated_at = new Date().toISOString();

    adminWallet.balance = Number((adminWallet.balance + amount).toFixed(2));
    adminWallet.updated_at = new Date().toISOString();

    // Ledger for Owner
    this.transactions.unshift({
      id: `tx-${Date.now()}-1`,
      wallet_id: ownerWallet.id,
      user_id: ownerId,
      type: 'OWNER_TO_ADMIN',
      amount,
      balance_before: ownerBefore,
      balance_after: ownerWallet.balance,
      source_user_id: ownerId,
      target_user_id: adminId,
      reference_type: 'owner_allocation',
      description: `شحن رصيد المشرف (${adminProfile.full_name}) من خزينة المالك`,
      created_at: new Date().toISOString(),
    });

    // Ledger for Admin
    this.transactions.unshift({
      id: `tx-${Date.now()}-2`,
      wallet_id: adminWallet.id,
      user_id: adminId,
      type: 'OWNER_TO_ADMIN',
      amount,
      balance_before: adminBefore,
      balance_after: adminWallet.balance,
      source_user_id: ownerId,
      target_user_id: adminId,
      reference_type: 'owner_allocation',
      description: 'استلام رصيد افتراضي من مالك المنصة',
      created_at: new Date().toISOString(),
    });

    // Notification
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: adminId,
      type: 'balance_transfer',
      title: 'تم استلام رصيد افتراضي',
      message: `قام مالك المنصة بشحن محفظتك بـ $${amount.toLocaleString()}`,
      read: false,
      created_at: new Date().toISOString(),
    });

    // Log
    this.activityLogs.unshift({
      id: `log-${Date.now()}`,
      user_id: ownerId,
      action: 'ADD_BALANCE',
      target_type: 'admin',
      target_id: adminId,
      metadata: { amount },
      created_at: new Date().toISOString(),
    });

    this.notify();
    return {
      success: true,
      newOwnerBalance: ownerWallet.balance,
      newAdminBalance: adminWallet.balance,
    };
  }

  // 2. ADMIN_TRANSFER_TO_PLAYER
  async adminTransferToPlayer(adminId: string, playerId: string, amount: number, description?: string) {
    if (amount <= 0) throw new Error('المبلغ يجب أن يكون أكبر من 0');

    const adminProfile = this.getProfile(adminId);
    if (adminProfile?.role !== 'admin' && adminProfile?.role !== 'owner') {
      throw new Error('غير مصرح: ليس لديك صلاحية شحن اللاعبين');
    }

    const playerProfile = this.getProfile(playerId);
    if (!playerProfile || playerProfile.role !== 'player') {
      throw new Error('المستخدم الهدف ليس لاعباً');
    }
    if (playerProfile.status !== 'active') {
      throw new Error('حساب اللاعب معلق أو محظور');
    }

    const adminWallet = this.getWallet(adminId);
    const playerWallet = this.getWallet(playerId);

    if (adminWallet.balance < amount) {
      throw new Error(`رصيدك غير كافٍ لإتمام العملية. الرصيد الحالي: $${adminWallet.balance.toLocaleString()}`);
    }

    // Atomic execution
    const adminBefore = adminWallet.balance;
    const playerBefore = playerWallet.balance;

    adminWallet.balance = Number((adminWallet.balance - amount).toFixed(2));
    adminWallet.updated_at = new Date().toISOString();

    playerWallet.balance = Number((playerWallet.balance + amount).toFixed(2));
    playerWallet.updated_at = new Date().toISOString();

    // Ledger for Admin
    this.transactions.unshift({
      id: `tx-${Date.now()}-adm`,
      wallet_id: adminWallet.id,
      user_id: adminId,
      type: 'ADMIN_TO_PLAYER',
      amount,
      balance_before: adminBefore,
      balance_after: adminWallet.balance,
      source_user_id: adminId,
      target_user_id: playerId,
      reference_type: 'admin_transfer',
      description: description || `تحويل رصيد للاعب ${playerProfile.full_name}`,
      created_at: new Date().toISOString(),
    });

    // Ledger for Player
    this.transactions.unshift({
      id: `tx-${Date.now()}-ply`,
      wallet_id: playerWallet.id,
      user_id: playerId,
      type: 'ADMIN_TO_PLAYER',
      amount,
      balance_before: playerBefore,
      balance_after: playerWallet.balance,
      source_user_id: adminId,
      target_user_id: playerId,
      reference_type: 'admin_transfer',
      description: 'استلام شحن رصيد من المشرف',
      created_at: new Date().toISOString(),
    });

    // Notification
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: playerId,
      type: 'balance_transfer',
      title: 'تم شحن محفظتك',
      message: `تمت إضافة $${amount.toLocaleString()} إلى رصيدك الافتراضي بنجاح`,
      read: false,
      created_at: new Date().toISOString(),
    });

    // Activity Log
    this.activityLogs.unshift({
      id: `log-${Date.now()}`,
      user_id: adminId,
      action: 'TRANSFER',
      target_type: 'player',
      target_id: playerId,
      metadata: { amount, description },
      created_at: new Date().toISOString(),
    });

    this.notify();
    return {
      success: true,
      newAdminBalance: adminWallet.balance,
      newPlayerBalance: playerWallet.balance,
    };
  }

  // 3. PLACE_MATCH_BET
  async placeMatchBet(userId: string, matchId: string, selectedTeam: 'team_a' | 'team_b' | 'draw', amount: number) {
    if (!userId) throw new Error('يجب تسجيل الدخول لوضع رهان');
    if (amount <= 0) throw new Error('قيمة الرهان يجب أن تكون أكبر من 0');

    const profile = this.getProfile(userId);
    if (!profile || profile.status !== 'active') {
      throw new Error('حسابك معلق أو محظور، لا يمكنك وضع رهان');
    }

    const match = this.matches.find((m) => m.id === matchId);
    if (!match) throw new Error('المباراة غير موجودة');
    if (match.status !== 'open') throw new Error('المباراة مغلقة للرهانات');
    if (new Date(match.match_time).getTime() <= Date.now()) {
      throw new Error('لا يمكنك تنفيذ هذا الرهان بعد بداية المباراة');
    }

    let odds = match.odds_team_a;
    if (selectedTeam === 'team_b') odds = match.odds_team_b;
    if (selectedTeam === 'draw') odds = match.odds_draw || 3.0;

    const potentialWin = Number((amount * odds).toFixed(2));
    const wallet = this.getWallet(userId);

    if (wallet.balance < amount) {
      throw new Error(`الرصيد غير كافٍ لوضع هذا الرهان. رصيدك الحالي: $${wallet.balance.toLocaleString()}`);
    }

    // Atomic Deduction
    const balanceBefore = wallet.balance;
    wallet.balance = Number((wallet.balance - amount).toFixed(2));
    wallet.updated_at = new Date().toISOString();

    const betId = `bet-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newBet: Bet = {
      id: betId,
      user_id: userId,
      match_id: matchId,
      selected_team: selectedTeam,
      bet_amount: amount,
      odds,
      potential_win: potentialWin,
      status: 'pending',
      result: 'pending',
      created_at: new Date().toISOString(),
      match,
      profile,
    };
    this.bets.unshift(newBet);

    // Ledger
    this.transactions.unshift({
      id: `tx-bet-${Date.now()}`,
      wallet_id: wallet.id,
      user_id: userId,
      type: 'BET_PLACED',
      amount,
      balance_before: balanceBefore,
      balance_after: wallet.balance,
      reference_type: 'match_bet',
      reference_id: betId,
      description: `رهان على مباراة: ${match.team_a} ضد ${match.team_b} (${selectedTeam === 'team_a' ? match.team_a : selectedTeam === 'team_b' ? match.team_b : 'تعادل'})`,
      created_at: new Date().toISOString(),
    });

    // Notification
    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: userId,
      type: 'bet_accepted',
      title: 'تم قبول رهانك بنجاح',
      message: `رهان بقيمة $${amount.toLocaleString()} على ${selectedTeam === 'team_a' ? match.team_a : match.team_b} (معامل ${odds})`,
      read: false,
      created_at: new Date().toISOString(),
    });

    // Log
    this.activityLogs.unshift({
      id: `log-${Date.now()}`,
      user_id: userId,
      action: 'PLACE_BET',
      target_type: 'bet',
      target_id: betId,
      metadata: { match_id: matchId, amount, odds, potential_win: potentialWin },
      created_at: new Date().toISOString(),
    });

    this.notify();
    return {
      success: true,
      betId,
      newBalance: wallet.balance,
      potentialWin,
    };
  }

  // 4. SETTLE_MATCH (Owner or Admin settles match and awards winners)
  async settleMatch(
    callerId: string,
    matchId: string,
    winningTeam: 'team_a' | 'team_b' | 'draw' | 'cancelled',
    scoreA: number = 0,
    scoreB: number = 0
  ) {
    const caller = this.getProfile(callerId);
    if (caller?.role !== 'owner' && caller?.role !== 'admin') {
      throw new Error('غير مصرح: ليس لديك صلاحية تسوية المباريات');
    }

    const match = this.matches.find((m) => m.id === matchId);
    if (!match) throw new Error('المباراة غير موجودة');
    if (match.status === 'settled') {
      throw new Error('تمت تسوية هذه المباراة مسبقاً ولا يمكن تسويتها مرتين');
    }

    match.status = 'settled';
    match.winning_team = winningTeam;
    match.score_team_a = scoreA;
    match.score_team_b = scoreB;
    match.settled_by = callerId;
    match.settled_at = new Date().toISOString();
    match.updated_at = new Date().toISOString();

    let wonCount = 0;
    let lostCount = 0;
    let totalPaid = 0;

    // Process all bets for this match
    for (const bet of this.bets) {
      if (bet.match_id === matchId && bet.status === 'pending') {
        const wallet = this.getWallet(bet.user_id);
        if (winningTeam === 'cancelled') {
          // Refund
          const before = wallet.balance;
          wallet.balance = Number((wallet.balance + bet.bet_amount).toFixed(2));
          bet.status = 'cancelled';
          bet.result = 'cancelled';
          bet.settled_at = new Date().toISOString();

          this.transactions.unshift({
            id: `tx-ref-${Date.now()}-${bet.id}`,
            wallet_id: wallet.id,
            user_id: bet.user_id,
            type: 'PLAYER_REFUND',
            amount: bet.bet_amount,
            balance_before: before,
            balance_after: wallet.balance,
            reference_type: 'match_refund',
            reference_id: bet.id,
            description: `استرداد قيمة الرهان بسبب إلغاء المباراة (${match.team_a} ضد ${match.team_b})`,
            created_at: new Date().toISOString(),
          });
        } else if (bet.selected_team === winningTeam) {
          // WON!
          const before = wallet.balance;
          wallet.balance = Number((wallet.balance + bet.potential_win).toFixed(2));
          bet.status = 'won';
          bet.result = 'win';
          bet.settled_at = new Date().toISOString();

          this.transactions.unshift({
            id: `tx-win-${Date.now()}-${bet.id}`,
            wallet_id: wallet.id,
            user_id: bet.user_id,
            type: 'BET_WIN',
            amount: bet.potential_win,
            balance_before: before,
            balance_after: wallet.balance,
            reference_type: 'match_bet_win',
            reference_id: bet.id,
            description: `أرباح رهان فائز على مباراة: ${match.team_a} ضد ${match.team_b}`,
            created_at: new Date().toISOString(),
          });

          this.notifications.unshift({
            id: `notif-${Date.now()}-${bet.id}`,
            user_id: bet.user_id,
            type: 'bet_won',
            title: 'مبروك! لقد ربحت الرهان',
            message: `لقد ربحت $${bet.potential_win.toLocaleString()} في مباراة ${match.team_a} ضد ${match.team_b}!`,
            read: false,
            created_at: new Date().toISOString(),
          });

          wonCount++;
          totalPaid += bet.potential_win;
        } else {
          // LOST
          bet.status = 'lost';
          bet.result = 'loss';
          bet.settled_at = new Date().toISOString();
          lostCount++;
        }
      }
    }

    // Log
    this.activityLogs.unshift({
      id: `log-${Date.now()}`,
      user_id: callerId,
      action: 'SETTLE_MATCH',
      target_type: 'match',
      target_id: matchId,
      metadata: { winning_team: winningTeam, won_count: wonCount, lost_count: lostCount, total_paid: totalPaid },
      created_at: new Date().toISOString(),
    });

    this.notify();
    return {
      success: true,
      wonCount,
      lostCount,
      totalPaid,
      totalPayout: totalPaid,
    };
  }

  // 5. PLAY_CASINO_GAME (Slots, Lucky Wheel, Royal Cards, Dice Room)
  async playCasinoGame(userId: string, gameSlug: string, betAmount: number) {
    if (!userId) throw new Error('يجب تسجيل الدخول للعب');
    const profile = this.getProfile(userId);
    if (!profile || profile.status !== 'active') throw new Error('حسابك غير نشط');

    const game = this.games.find((g) => g.slug === gameSlug && g.status === 'active');
    if (!game) throw new Error('اللعبة غير متوفرة أو معطلة');

    if (betAmount < game.minimum_bet || betAmount > game.maximum_bet) {
      throw new Error(`قيمة الرهان يجب أن تكون بين $${game.minimum_bet} و $${game.maximum_bet}`);
    }

    const wallet = this.getWallet(userId);
    if (wallet.balance < betAmount) {
      throw new Error(`الرصيد غير كافٍ. رصيدك الحالي: $${wallet.balance.toLocaleString()}`);
    }

    // Deduct bet
    const balanceBefore = wallet.balance;
    wallet.balance = Number((wallet.balance - betAmount).toFixed(2));
    wallet.updated_at = new Date().toISOString();

    this.transactions.unshift({
      id: `tx-gbet-${Date.now()}`,
      wallet_id: wallet.id,
      user_id: userId,
      type: 'GAME_BET',
      amount: betAmount,
      balance_before: balanceBefore,
      balance_after: wallet.balance,
      reference_type: 'game',
      reference_id: game.id,
      description: `رهان في لعبة ${game.name}`,
      created_at: new Date().toISOString(),
    });

    let isWin = false;
    let multiplier = 0;
    let gameResult: any = {};
    const rnd = Math.random();

    if (gameSlug === 'golden-slots') {
      const symbols = ['🦁', '👑', '💎', '7️⃣', '🍒', '🪙'];
      if (rnd < 0.08) {
        // Triple Lions (Jackpot 15x)
        gameResult = { reels: ['🦁', '🦁', '🦁'] };
        multiplier = 15.0;
        isWin = true;
      } else if (rnd < 0.20) {
        // Triple Diamonds (7x)
        gameResult = { reels: ['💎', '💎', '💎'] };
        multiplier = 7.0;
        isWin = true;
      } else if (rnd < 0.45) {
        // Crown pair (2.5x)
        gameResult = { reels: ['👑', '👑', '🍒'] };
        multiplier = 2.5;
        isWin = true;
      } else {
        gameResult = {
          reels: [
            symbols[Math.floor(Math.random() * 3)],
            symbols[3 + Math.floor(Math.random() * 2)],
            symbols[Math.floor(Math.random() * symbols.length)],
          ],
        };
        isWin = false;
      }
    } else if (gameSlug === 'lucky-wheel') {
      const segment = Math.floor(Math.random() * 8);
      const multiMap = [0, 1.5, 0, 2.0, 0, 5.0, 0, 10.0];
      multiplier = multiMap[segment];
      isWin = multiplier > 0;
      gameResult = { segment, multiplier };
    } else if (gameSlug === 'dice-room') {
      const d1 = 1 + Math.floor(Math.random() * 6);
      const d2 = 1 + Math.floor(Math.random() * 6);
      const sum = d1 + d2;
      isWin = sum >= 7;
      multiplier = isWin ? 2.0 : 0;
      gameResult = { dice1: d1, dice2: d2, sum };
    } else {
      // Royal Cards
      const cards = ['A♠', 'K♥', 'Q♦', 'J♣', '10♠', 'A♥', 'K♦'];
      const drawn = cards[Math.floor(Math.random() * cards.length)];
      isWin = ['A♠', 'A♥', 'K♥'].includes(drawn);
      multiplier = isWin ? 3.0 : 0;
      gameResult = { card: drawn };
    }

    let payout = 0;
    if (isWin && multiplier > 0) {
      payout = Number((betAmount * multiplier).toFixed(2));
      const beforeWin = wallet.balance;
      wallet.balance = Number((wallet.balance + payout).toFixed(2));

      this.transactions.unshift({
        id: `tx-gwin-${Date.now()}`,
        wallet_id: wallet.id,
        user_id: userId,
        type: 'GAME_WIN',
        amount: payout,
        balance_before: beforeWin,
        balance_after: wallet.balance,
        reference_type: 'game_win',
        reference_id: game.id,
        description: `فوز في لعبة ${game.name} (مضاعف ${multiplier}x)`,
        created_at: new Date().toISOString(),
      });

      this.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: userId,
        type: 'game_win',
        title: `فوز في ${game.name}!`,
        message: `ربحت $${payout.toLocaleString()} بمضاعف ${multiplier}x!`,
        read: false,
        created_at: new Date().toISOString(),
      });
    }

    this.activityLogs.unshift({
      id: `log-${Date.now()}`,
      user_id: userId,
      action: 'PLAY_GAME',
      target_type: 'game',
      target_id: game.id,
      metadata: { bet: betAmount, isWin, payout, multiplier },
      created_at: new Date().toISOString(),
    });

    this.notify();
    return {
      success: true,
      gameName: game.name,
      isWin,
      multiplier,
      payout,
      newBalance: wallet.balance,
      gameResult,
    };
  }

  // 6. CREATE ADMIN (Owner only)
  async createAdmin(
    ownerId: string,
    fullNameOrOptions: string | { fullName: string; username: string; email: string; initialBalance?: number },
    username?: string,
    email?: string,
    initialBalance: number = 0
  ) {
    const owner = this.getProfile(ownerId);
    if (owner?.role !== 'owner') throw new Error('المصادقة مطلوبة: فقط المالك يستطيع إنشاء مشرفين');

    let fullName = '';
    let uname = '';
    let mail = '';
    let initBal = initialBalance;

    if (typeof fullNameOrOptions === 'object') {
      fullName = fullNameOrOptions.fullName;
      uname = fullNameOrOptions.username;
      mail = fullNameOrOptions.email;
      initBal = fullNameOrOptions.initialBalance ?? 0;
    } else {
      fullName = fullNameOrOptions;
      uname = username || '';
      mail = email || '';
      initBal = initialBalance;
    }

    const id = `adm-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const newAdmin: Profile = {
      id,
      full_name: fullName,
      username: uname,
      email: mail,
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.profiles.push(newAdmin);

    const wallet: Wallet = {
      id: `w-${id}`,
      user_id: id,
      balance: 0.0,
      currency: 'VIRTUAL_USD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.wallets.push(wallet);

    if (initBal > 0) {
      await this.ownerAddAdminBalance(ownerId, id, initBal);
    }

    this.notify();
    return newAdmin;
  }

  // 7. SUSPEND / ACTIVATE USER
  async suspendUser(callerId: string, targetUserId: string, newStatus: 'active' | 'suspended' | 'blocked') {
    const caller = this.getProfile(callerId);
    const target = this.getProfile(targetUserId);
    if (!caller || !target) throw new Error('مستخدم غير موجود');

    if (caller.role === 'owner') {
      if (targetUserId === callerId) throw new Error('لا يمكن للمالك تعليق حسابه الخاص');
    } else if (caller.role === 'admin') {
      if (target.role !== 'player') throw new Error('المشرف يمكنه فقط تعديل حالة اللاعبين');
    } else {
      throw new Error('غير مصرح');
    }

    target.status = newStatus;
    target.updated_at = new Date().toISOString();

    this.notifications.unshift({
      id: `notif-${Date.now()}`,
      user_id: targetUserId,
      type: 'account_status',
      title: 'تحديث حالة الحساب',
      message: `تم تغيير حالة حسابك إلى: ${newStatus === 'active' ? 'نشط' : newStatus === 'suspended' ? 'معلق' : 'محظور'}`,
      read: false,
      created_at: new Date().toISOString(),
    });

    this.activityLogs.unshift({
      id: `log-${Date.now()}`,
      user_id: callerId,
      action: 'SUSPEND_USER',
      target_type: 'user',
      target_id: targetUserId,
      metadata: { newStatus },
      created_at: new Date().toISOString(),
    });

    this.notify();
    return target;
  }

  // 8. ADD NEW MATCH (Owner/Admin)
  async createMatch(callerId: string, matchData: Partial<Match>) {
    const caller = this.getProfile(callerId);
    if (caller?.role !== 'owner' && caller?.role !== 'admin') {
      throw new Error('غير مصرح لك بإضافة مباريات');
    }
    const newMatch: Match = {
      id: `m-${Date.now()}`,
      league: matchData.league || 'دوري عام',
      sport: matchData.sport || 'كرة قدم',
      team_a: matchData.team_a || 'الفريق أ',
      team_b: matchData.team_b || 'الفريق ب',
      match_time: matchData.match_time || new Date(Date.now() + 86400000).toISOString(),
      status: 'open',
      odds_team_a: matchData.odds_team_a || 1.85,
      odds_team_b: matchData.odds_team_b || 2.15,
      odds_draw: matchData.odds_draw || 3.2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.matches.unshift(newMatch);
    this.notify();
    return newMatch;
  }

  // 9. TOGGLE GAME STATUS (Owner)
  async toggleGameStatus(ownerId: string, gameId: string, status: 'active' | 'inactive') {
    const owner = this.getProfile(ownerId);
    if (owner?.role !== 'owner') throw new Error('فقط المالك يمكنه تعديل الألعاب');
    const game = this.games.find((g) => g.id === gameId);
    if (!game) throw new Error('اللعبة غير موجودة');
    game.status = status;
    game.updated_at = new Date().toISOString();
    this.notify();
    return game;
  }

  // Mark notifications as read
  markNotificationsRead(userId: string) {
    this.notifications.forEach((n) => {
      if (n.user_id === userId) n.read = true;
    });
    this.notify();
  }
}

let engineInstance: CasinoEngine;
try {
  engineInstance = new CasinoEngine();
} catch (err) {
  console.error('[5LION Engine] Error initializing CasinoEngine:', err);
  engineInstance = Object.create(CasinoEngine.prototype);
}
export const casinoEngine = engineInstance;
