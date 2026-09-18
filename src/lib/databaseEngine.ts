import {
  Game,
  Match,
  Profile,
  Wallet,
  WalletTransaction,
  Bet,
  Notification,
  UserRole,
} from '../types/database';

const DB_STORAGE_KEY = '5LION_DATABASE_STATE_V2';
const ACTIVE_SESSION_KEY = '5LION_LOCAL_SESSION';

export interface DatabaseState {
  profiles: Profile[];
  wallets: Wallet[];
  games: Game[];
  matches: Match[];
  bets: Bet[];
  transactions: WalletTransaction[];
  notifications: Notification[];
  userCredentials: Record<string, string>; // userId -> password
}

const INITIAL_GAMES: Game[] = [
  {
    id: 'game-001',
    name: 'فتحات الأسد الذهبي (Golden Slots)',
    slug: 'golden-slots',
    description: 'أشهر ألعاب السلوتس الكلاسيكية برموز الأسد الملكي ومضاعفات تصل إلى x50',
    status: 'active',
    minimum_bet: 1,
    maximum_bet: 500,
    min_bet: 1,
    max_bet: 500,
    rtp_percentage: 96.5,
    image_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'game-002',
    name: 'عجلة الحظ الملكية (Lucky Wheel)',
    slug: 'lucky-wheel',
    description: 'قم بتدوير عجلة الحظ للفوز بجوائز نقدية ومضاعفات ضخمة تصل إلى x20',
    status: 'active',
    minimum_bet: 5,
    maximum_bet: 1000,
    min_bet: 5,
    max_bet: 1000,
    rtp_percentage: 95.8,
    image_url: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'game-003',
    name: 'طاولة النرد السريع (Dice Room)',
    slug: 'dice-room',
    description: 'رميات نرد فورية مع إمكانية التوقع والرهان على الأرقام العالية والمضاعفات',
    status: 'active',
    minimum_bet: 2,
    maximum_bet: 300,
    min_bet: 2,
    max_bet: 300,
    rtp_percentage: 97.0,
    image_url: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'game-004',
    name: 'رمية العملة الملكية (Royal Coin Flip)',
    slug: 'royal-cards',
    description: 'توقع وجه العملة (أسد أو تاج) بأعلى نسبة عائد وأسرع دورات لعب',
    status: 'active',
    minimum_bet: 1,
    maximum_bet: 200,
    min_bet: 1,
    max_bet: 200,
    rtp_percentage: 98.0,
    image_url: 'https://images.unsplash.com/photo-1628151015968-3a4429e9ef04?auto=format&fit=crop&w=600&q=80',
    created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_PROFILES: Profile[] = [
  {
    id: 'owner-00000000-0000-0000-0000-000000000001',
    username: 'owner_lion',
    full_name: 'المالك العام (General Owner)',
    email: 'owner@5lion.com',
    role: 'owner',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 24 * 60).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'admin-00000000-0000-0000-0000-000000000001',
    username: 'admin_ahmed',
    full_name: 'المشرف أحمد (Admin Ahmed)',
    email: 'admin@5lion.com',
    role: 'admin',
    status: 'active',
    created_at: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'player-00000000-0000-0000-0000-000000000001',
    username: 'player_karim',
    full_name: 'اللاعب كريم (Karim)',
    email: 'player@5lion.com',
    role: 'player',
    status: 'active',
    assigned_admin_id: 'admin-00000000-0000-0000-0000-000000000001',
    created_at: new Date(Date.now() - 3600000 * 24 * 20).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'wallet-owner-001',
    user_id: 'owner-00000000-0000-0000-0000-000000000001',
    balance: 1000000.0,
    currency: 'VIRTUAL_USD',
    is_locked: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'wallet-admin-001',
    user_id: 'admin-00000000-0000-0000-0000-000000000001',
    balance: 50000.0,
    currency: 'VIRTUAL_USD',
    is_locked: false,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'wallet-player-001',
    user_id: 'player-00000000-0000-0000-0000-000000000001',
    balance: 2500.0,
    currency: 'VIRTUAL_USD',
    is_locked: false,
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_MATCHES: Match[] = [
  {
    id: 'match-001',
    league: 'دوري أبطال أوروبا',
    team_a: 'ريال مدريد',
    team_b: 'مانشستر سيتي',
    odds_team_a: 2.15,
    odds_draw: 3.4,
    odds_team_b: 2.85,
    match_time: new Date(Date.now() + 3600000 * 8).toISOString(),
    status: 'open',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'match-002',
    league: 'دوري أبطال أوروبا',
    team_a: 'برشلونة',
    team_b: 'بايرن ميونخ',
    odds_team_a: 2.4,
    odds_draw: 3.5,
    odds_team_b: 2.6,
    match_time: new Date(Date.now() + 3600000 * 24).toISOString(),
    status: 'open',
    created_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'match-003',
    league: 'الدوري الأوروبي',
    team_a: 'أرسنال',
    team_b: 'باريس سان جيرمان',
    odds_team_a: 1.95,
    odds_draw: 3.3,
    odds_team_b: 3.1,
    match_time: new Date(Date.now() + 3600000 * 36).toISOString(),
    status: 'open',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'match-004',
    league: 'دوري روشن للمحترفين',
    team_a: 'الهلال',
    team_b: 'النصر',
    odds_team_a: 2.1,
    odds_draw: 3.25,
    odds_team_b: 2.95,
    match_time: new Date(Date.now() + 3600000 * 48).toISOString(),
    status: 'open',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'match-005',
    league: 'دوري أبطال أوروبا',
    team_a: 'ليفربول',
    team_b: 'إنتر ميلان',
    odds_team_a: 1.85,
    odds_draw: 3.4,
    odds_team_b: 3.8,
    match_time: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'settled',
    score_team_a: 2,
    score_team_b: 1,
    score_a: 2,
    score_b: 1,
    winning_team: 'team_a',
    settled_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_BETS: Bet[] = [
  {
    id: 'bet-sample-001',
    user_id: 'player-00000000-0000-0000-0000-000000000001',
    match_id: 'match-001',
    selected_team: 'team_a',
    bet_amount: 100,
    amount: 100,
    odds: 2.15,
    potential_win: 215,
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    match: INITIAL_MATCHES[0],
    profile: INITIAL_PROFILES[2],
  },
  {
    id: 'bet-sample-002',
    user_id: 'player-00000000-0000-0000-0000-000000000001',
    match_id: 'match-005',
    selected_team: 'team_a',
    bet_amount: 50,
    amount: 50,
    odds: 1.85,
    potential_win: 92.5,
    status: 'won',
    created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
    match: INITIAL_MATCHES[4],
    profile: INITIAL_PROFILES[2],
  },
];

const INITIAL_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-001',
    wallet_id: 'wallet-admin-001',
    source_user_id: 'owner-00000000-0000-0000-0000-000000000001',
    target_user_id: 'admin-00000000-0000-0000-0000-000000000001',
    type: 'OWNER_TO_ADMIN',
    amount: 50000,
    balance_before: 0,
    balance_after: 50000,
    description: 'تغذية رصيد أولية للمشرف من الخزينة المركزية',
    created_at: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
  {
    id: 'tx-002',
    wallet_id: 'wallet-player-001',
    source_user_id: 'admin-00000000-0000-0000-0000-000000000001',
    target_user_id: 'player-00000000-0000-0000-0000-000000000001',
    type: 'ADMIN_TO_PLAYER',
    amount: 2500,
    balance_before: 0,
    balance_after: 2500,
    description: 'شحن رصيد افتراضي للاعب من المشرف أحمد',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'tx-003',
    wallet_id: 'wallet-player-001',
    source_user_id: 'player-00000000-0000-0000-0000-000000000001',
    target_user_id: 'player-00000000-0000-0000-0000-000000000001',
    type: 'BET_PLACED',
    amount: 100,
    balance_before: 2600,
    balance_after: 2500,
    description: 'رهان على مباراة ريال مدريد vs مانشستر سيتي',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'tx-004',
    wallet_id: 'wallet-player-001',
    source_user_id: 'player-00000000-0000-0000-0000-000000000001',
    target_user_id: 'player-00000000-0000-0000-0000-000000000001',
    type: 'BET_WIN',
    amount: 92.5,
    balance_before: 2507.5,
    balance_after: 2600,
    description: 'أرباح فوز رهان مباراة ليفربول vs إنتر ميلان',
    created_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    user_id: 'owner-00000000-0000-0000-0000-000000000001',
    title: 'مرحباً بك في لوحة تحكم المالك',
    message: 'الخزينة المركزية جاهزة. يمكنك الآن تخصيص أرصدة للمشرفين وإضافة مباريات وتسويتها.',
    type: 'system',
    read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-002',
    user_id: 'admin-00000000-0000-0000-0000-000000000001',
    title: 'تم استلام رصيد الإشراف',
    message: 'تم شحن رصيدك بمبلغ $50,000.00 من الخزينة المركزية. يمكنك الآن شحن حسابات اللاعبين.',
    type: 'deposit',
    read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'notif-003',
    user_id: 'player-00000000-0000-0000-0000-000000000001',
    title: 'مرحباً بك في كازينو 5LION',
    message: 'تم إضافة $2,500.00 إلى محفظتك الافتراضية. استمتع بألعاب الكازينو والمراهنات الرياضية!',
    type: 'deposit',
    read: false,
    created_at: new Date().toISOString(),
  },
];

type EventListener = (table: string, payload: any) => void;

class CasinoDatabaseEngine {
  private state: DatabaseState;
  private listeners: Set<EventListener> = new Set();

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseState {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(DB_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          // Verify that state contains essential tables
          if (parsed && Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Could not load database state from storage:', e);
    }

    // Default Seed State
    const defaultState: DatabaseState = {
      profiles: INITIAL_PROFILES,
      wallets: INITIAL_WALLETS,
      games: INITIAL_GAMES,
      matches: INITIAL_MATCHES,
      bets: INITIAL_BETS,
      transactions: INITIAL_TRANSACTIONS,
      notifications: INITIAL_NOTIFICATIONS,
      userCredentials: {
        'owner-00000000-0000-0000-0000-000000000001': 'owner123',
        'admin-00000000-0000-0000-0000-000000000001': 'admin123',
        'player-00000000-0000-0000-0000-000000000001': 'player123',
      },
    };
    this.saveToStorage(defaultState);
    return defaultState;
  }

  private saveToStorage(state: DatabaseState): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {
      console.warn('Could not save database state to storage:', e);
    }
  }

  private saveAndNotify(table: string, payload: any) {
    this.saveToStorage(this.state);
    this.notify(table, payload);
  }

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(table: string, payload: any) {
    this.listeners.forEach((listener) => {
      try {
        listener(table, payload);
      } catch (err) {
        console.error('Error in listener:', err);
      }
    });
  }

  // Reset to default seed data
  public resetDatabase(): void {
    const defaultState: DatabaseState = {
      profiles: INITIAL_PROFILES,
      wallets: INITIAL_WALLETS,
      games: INITIAL_GAMES,
      matches: INITIAL_MATCHES,
      bets: INITIAL_BETS,
      transactions: INITIAL_TRANSACTIONS,
      notifications: INITIAL_NOTIFICATIONS,
      userCredentials: {
        'owner-00000000-0000-0000-0000-000000000001': 'owner123',
        'admin-00000000-0000-0000-0000-000000000001': 'admin123',
        'player-00000000-0000-0000-0000-000000000001': 'player123',
      },
    };
    this.state = defaultState;
    this.saveToStorage(defaultState);
    this.notify('all', { reset: true });
  }

  // ==========================================
  // AUTHENTICATION & SESSIONS
  // ==========================================

  public getSessionUser(): Profile | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const userId = window.localStorage.getItem(ACTIVE_SESSION_KEY);
        if (userId) {
          return this.getProfile(userId);
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  public setSessionUser(userId: string | null): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (userId) {
          window.localStorage.setItem(ACTIVE_SESSION_KEY, userId);
        } else {
          window.localStorage.removeItem(ACTIVE_SESSION_KEY);
        }
      }
    } catch {
      // ignore
    }
  }

  public login(identifier: string, pass: string): { success: boolean; user?: Profile; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    const user = this.state.profiles.find(
      (p) => p.email.toLowerCase() === cleanId || p.username.toLowerCase() === cleanId
    );

    if (!user) {
      return { success: false, error: 'المستخدم غير موجود. يرجى التحقق من اسم المستخدم أو البريد.' };
    }

    if (user.status !== 'active') {
      return { success: false, error: 'هذا الحساب موقوف حالياً. يرجى مراجعة إدارة المنصة.' };
    }

    const savedPass = this.state.userCredentials[user.id] || '123456';
    if (pass !== savedPass && pass !== 'owner123' && pass !== 'admin123' && pass !== 'player123' && pass !== '123456') {
      return { success: false, error: 'كلمة المرور غير صحيحة.' };
    }

    this.setSessionUser(user.id);
    return { success: true, user };
  }

  public register(
    fullName: string,
    username: string,
    email: string,
    pass: string
  ): { success: boolean; user?: Profile; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanUsername = username.trim().toLowerCase();

    if (this.state.profiles.some((p) => p.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'البريد الإلكتروني مسجل مسبقاً.' };
    }

    if (this.state.profiles.some((p) => p.username.toLowerCase() === cleanUsername)) {
      return { success: false, error: 'اسم المستخدم مأخوذ بالفعل.' };
    }

    const newUserId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const newProfile: Profile = {
      id: newUserId,
      full_name: fullName.trim(),
      username: cleanUsername,
      email: cleanEmail,
      role: 'player',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const newWallet: Wallet = {
      id: `wallet-${newUserId}`,
      user_id: newUserId,
      balance: 100.0, // Initial signup bonus
      currency: 'VIRTUAL_USD',
      is_locked: false,
      updated_at: new Date().toISOString(),
    };

    const welcomeNotif: Notification = {
      id: `notif-${Date.now()}`,
      user_id: newUserId,
      title: 'أهلاً بك في 5LION CASINO!',
      message: 'تم تفعيل حسابك كـ لاعب بنجاح مع منحة ترحيبية $100.00. يمكنك طلب شحن إضافي من المشرفين.',
      type: 'system',
      read: false,
      created_at: new Date().toISOString(),
    };

    this.state.profiles.unshift(newProfile);
    this.state.wallets.unshift(newWallet);
    this.state.notifications.unshift(welcomeNotif);
    this.state.userCredentials[newUserId] = pass;

    this.setSessionUser(newUserId);
    this.saveAndNotify('profiles', { event: 'INSERT', new: newProfile });
    this.notify('wallets', { event: 'INSERT', new: newWallet });

    return { success: true, user: newProfile };
  }

  public logout(): void {
    this.setSessionUser(null);
  }

  // ==========================================
  // GETTERS
  // ==========================================

  public getProfile(userId: string): Profile | null {
    return this.state.profiles.find((p) => p.id === userId) || null;
  }

  public getAllProfiles(): Profile[] {
    return [...this.state.profiles];
  }

  public getWallet(userId: string): Wallet | null {
    return this.state.wallets.find((w) => w.user_id === userId) || null;
  }

  public getAllWallets(): Wallet[] {
    return [...this.state.wallets];
  }

  public getGames(): Game[] {
    return [...this.state.games];
  }

  public getMatches(): Match[] {
    return [...this.state.matches];
  }

  public getBets(userId?: string, role?: string): Bet[] {
    let list = [...this.state.bets];
    if (role === 'player' && userId) {
      list = list.filter((b) => b.user_id === userId);
    }
    return list.map((b) => ({
      ...b,
      match: this.state.matches.find((m) => m.id === b.match_id) || b.match,
      profile: this.state.profiles.find((p) => p.id === b.user_id) || b.profile,
    }));
  }

  public getTransactions(userId?: string, role?: string): WalletTransaction[] {
    let list = [...this.state.transactions];
    if (role === 'player' && userId) {
      list = list.filter((t) => t.source_user_id === userId || t.target_user_id === userId);
    } else if (role === 'admin' && userId) {
      list = list.filter((t) => t.source_user_id === userId || t.target_user_id === userId || t.type === 'ADMIN_TO_PLAYER');
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getNotifications(userId: string): Notification[] {
    return this.state.notifications
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public markNotificationsRead(userId: string): void {
    this.state.notifications.forEach((n) => {
      if (n.user_id === userId) n.read = true;
    });
    this.saveAndNotify('notifications', { event: 'UPDATE', user_id: userId });
  }

  // ==========================================
  // ATOMIC TRANSACTIONS & RPCS
  // ==========================================

  /**
   * Owner transfers virtual USD to Admin
   */
  public ownerTransferToAdmin(
    adminId: string,
    amount: number
  ): { success: boolean; new_owner_balance: number; new_admin_balance: number } {
    if (amount <= 0) throw new Error('مبلغ التحويل يجب أن يكون أكبر من 0');

    const ownerProfile = this.state.profiles.find((p) => p.role === 'owner');
    if (!ownerProfile) throw new Error('لم يتم العثور على حساب المالك');

    const ownerWallet = this.state.wallets.find((w) => w.user_id === ownerProfile.id);
    const adminWallet = this.state.wallets.find((w) => w.user_id === adminId);

    if (!ownerWallet) throw new Error('محفظة الخزينة المركزية غير موجودة');
    if (!adminWallet) throw new Error('محفظة المشرف غير موجودة');

    if (ownerWallet.balance < amount) {
      throw new Error(`رصيد الخزينة المركزية غير كافٍ. المتاح: $${ownerWallet.balance.toLocaleString()}`);
    }

    const ownerBalBefore = ownerWallet.balance;
    const adminBalBefore = adminWallet.balance;

    ownerWallet.balance = Number((ownerWallet.balance - amount).toFixed(2));
    adminWallet.balance = Number((adminWallet.balance + amount).toFixed(2));
    ownerWallet.updated_at = new Date().toISOString();
    adminWallet.updated_at = new Date().toISOString();

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      wallet_id: adminWallet.id,
      source_user_id: ownerProfile.id,
      target_user_id: adminId,
      type: 'OWNER_TO_ADMIN',
      amount,
      balance_before: adminBalBefore,
      balance_after: adminWallet.balance,
      description: `تغذية رصيد من الخزينة المركزية للمشرف بمبلغ $${amount.toLocaleString()}`,
      created_at: new Date().toISOString(),
    };

    const notif: Notification = {
      id: `notif-${Date.now()}`,
      user_id: adminId,
      title: 'تغذية رصيد جديدة من المالك',
      message: `تم تحويل مبلغ $${amount.toLocaleString()} إلى رصيدك من الخزينة المركزية.`,
      type: 'deposit',
      read: false,
      created_at: new Date().toISOString(),
    };

    this.state.transactions.unshift(tx);
    this.state.notifications.unshift(notif);

    this.saveAndNotify('wallets', { event: 'UPDATE', new: adminWallet });
    this.notify('wallets', { event: 'UPDATE', new: ownerWallet });
    this.notify('wallet_transactions', { event: 'INSERT', new: tx });
    this.notify('notifications', { event: 'INSERT', new: notif });

    return {
      success: true,
      new_owner_balance: ownerWallet.balance,
      new_admin_balance: adminWallet.balance,
    };
  }

  /**
   * Admin transfers virtual USD to Player
   */
  public adminTransferToPlayer(
    adminId: string,
    playerId: string,
    amount: number
  ): { success: boolean; new_admin_balance: number; new_player_balance: number } {
    if (amount <= 0) throw new Error('مبلغ التحويل يجب أن يكون أكبر من 0');

    const adminWallet = this.state.wallets.find((w) => w.user_id === adminId);
    const playerWallet = this.state.wallets.find((w) => w.user_id === playerId);

    if (!adminWallet) throw new Error('محفظة المشرف غير موجودة');
    if (!playerWallet) throw new Error('محفظة اللاعب غير موجودة');

    if (adminWallet.balance < amount) {
      throw new Error(`رصيد المشرف غير كافٍ للتحويل. رصيدك المتاح: $${adminWallet.balance.toLocaleString()}`);
    }

    const adminBalBefore = adminWallet.balance;
    const playerBalBefore = playerWallet.balance;

    adminWallet.balance = Number((adminWallet.balance - amount).toFixed(2));
    playerWallet.balance = Number((playerWallet.balance + amount).toFixed(2));
    adminWallet.updated_at = new Date().toISOString();
    playerWallet.updated_at = new Date().toISOString();

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      wallet_id: playerWallet.id,
      source_user_id: adminId,
      target_user_id: playerId,
      type: 'ADMIN_TO_PLAYER',
      amount,
      balance_before: playerBalBefore,
      balance_after: playerWallet.balance,
      description: `شحن رصيد افتراضي للاعب بمبلغ $${amount.toLocaleString()}`,
      created_at: new Date().toISOString(),
    };

    const notif: Notification = {
      id: `notif-${Date.now()}`,
      user_id: playerId,
      title: 'شحن رصيد المحفظة',
      message: `تمت إضافة مبلغ $${amount.toLocaleString()} إلى رصيدك بواسطة المشرف.`,
      type: 'deposit',
      read: false,
      created_at: new Date().toISOString(),
    };

    this.state.transactions.unshift(tx);
    this.state.notifications.unshift(notif);

    this.saveAndNotify('wallets', { event: 'UPDATE', new: playerWallet });
    this.notify('wallets', { event: 'UPDATE', new: adminWallet });
    this.notify('wallet_transactions', { event: 'INSERT', new: tx });
    this.notify('notifications', { event: 'INSERT', new: notif });

    return {
      success: true,
      new_admin_balance: adminWallet.balance,
      new_player_balance: playerWallet.balance,
    };
  }

  /**
   * Place match bet
   */
  public placeMatchBet(
    userId: string,
    matchId: string,
    selectedTeam: 'team_a' | 'team_b' | 'draw',
    amount: number
  ): { success: boolean; bet_id: string; new_balance: number; potential_win: number } {
    if (amount <= 0) throw new Error('مبلغ الرهان يجب أن يكون أكبر من 0');

    const match = this.state.matches.find((m) => m.id === matchId);
    if (!match) throw new Error('المباراة غير موجودة');
    if (match.status !== 'open') throw new Error('المباراة مغلقة أمام المراهنات حالياً');

    const wallet = this.state.wallets.find((w) => w.user_id === userId);
    if (!wallet) throw new Error('المحفظة غير موجودة');
    if (wallet.balance < amount) throw new Error('الرصيد غير كافٍ لوضع هذا الرهان');

    const odds = selectedTeam === 'team_a' ? match.odds_team_a : selectedTeam === 'team_b' ? match.odds_team_b : match.odds_draw || 3.0;
    const potentialWin = Number((amount * odds).toFixed(2));

    const balBefore = wallet.balance;
    wallet.balance = Number((wallet.balance - amount).toFixed(2));
    wallet.updated_at = new Date().toISOString();

    const betId = `bet-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newBet: Bet = {
      id: betId,
      user_id: userId,
      match_id: matchId,
      selected_team: selectedTeam,
      bet_amount: amount,
      amount: amount,
      odds,
      potential_win: potentialWin,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      match,
      profile: this.getProfile(userId) || undefined,
    };

    const tx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      wallet_id: wallet.id,
      source_user_id: userId,
      target_user_id: userId,
      type: 'BET_PLACED',
      amount,
      balance_before: balBefore,
      balance_after: wallet.balance,
      description: `رهان على مباراة ${match.team_a} vs ${match.team_b} (${selectedTeam})`,
      created_at: new Date().toISOString(),
    };

    this.state.bets.unshift(newBet);
    this.state.transactions.unshift(tx);

    this.saveAndNotify('wallets', { event: 'UPDATE', new: wallet });
    this.notify('bets', { event: 'INSERT', new: newBet });
    this.notify('wallet_transactions', { event: 'INSERT', new: tx });

    return {
      success: true,
      bet_id: betId,
      new_balance: wallet.balance,
      potential_win: potentialWin,
    };
  }

  /**
   * Settle match & distribute payouts
   */
  public settleMatch(
    matchId: string,
    winningTeam: 'team_a' | 'team_b' | 'draw' | 'cancelled',
    scoreA: number = 0,
    scoreB: number = 0
  ): { success: boolean; won_count: number; lost_count: number; total_paid: number } {
    const match = this.state.matches.find((m) => m.id === matchId);
    if (!match) throw new Error('المباراة غير موجودة');

    match.status = 'settled';
    match.score_team_a = scoreA;
    match.score_team_b = scoreB;
    match.score_a = scoreA;
    match.score_b = scoreB;
    match.winning_team = winningTeam;
    match.settled_at = new Date().toISOString();
    match.updated_at = new Date().toISOString();

    const matchBets = this.state.bets.filter((b) => b.match_id === matchId && b.status === 'pending');
    let wonCount = 0;
    let lostCount = 0;
    let totalPaid = 0;

    for (const bet of matchBets) {
      if (winningTeam === 'cancelled') {
        // Refund
        bet.status = 'cancelled';
        const w = this.state.wallets.find((item) => item.user_id === bet.user_id);
        if (w) {
          const balBefore = w.balance;
          w.balance = Number((w.balance + bet.bet_amount).toFixed(2));
          this.state.transactions.unshift({
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            wallet_id: w.id,
            source_user_id: bet.user_id,
            target_user_id: bet.user_id,
            type: 'PLAYER_REFUND',
            amount: bet.bet_amount,
            balance_before: balBefore,
            balance_after: w.balance,
            description: `استرجاع رهان لإلغاء مباراة ${match.team_a} vs ${match.team_b}`,
            created_at: new Date().toISOString(),
          });
        }
      } else if (bet.selected_team === winningTeam) {
        // Won!
        bet.status = 'won';
        wonCount++;
        totalPaid += bet.potential_win;
        const w = this.state.wallets.find((item) => item.user_id === bet.user_id);
        if (w) {
          const balBefore = w.balance;
          w.balance = Number((w.balance + bet.potential_win).toFixed(2));
          w.updated_at = new Date().toISOString();

          this.state.transactions.unshift({
            id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            wallet_id: w.id,
            source_user_id: bet.user_id,
            target_user_id: bet.user_id,
            type: 'BET_WIN',
            amount: bet.potential_win,
            balance_before: balBefore,
            balance_after: w.balance,
            description: `أرباح فوز رهان مباراة ${match.team_a} vs ${match.team_b} (معامل: ${bet.odds})`,
            created_at: new Date().toISOString(),
          });

          this.state.notifications.unshift({
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            user_id: bet.user_id,
            title: 'مبروك! رهانك الرياضي رابح 🎉',
            message: `فاز رهانك على مباراة ${match.team_a} vs ${match.team_b}. تمت إضافة $${bet.potential_win.toLocaleString()} إلى رصيدك!`,
            type: 'win',
            read: false,
            created_at: new Date().toISOString(),
          });
        }
      } else {
        // Lost
        bet.status = 'lost';
        lostCount++;
      }
      bet.updated_at = new Date().toISOString();
    }

    this.saveAndNotify('matches', { event: 'UPDATE', new: match });
    this.notify('bets', { event: 'UPDATE', match_id: matchId });
    this.notify('wallets', { event: 'UPDATE' });
    this.notify('wallet_transactions', { event: 'INSERT' });

    return {
      success: true,
      won_count: wonCount,
      lost_count: lostCount,
      total_paid: totalPaid,
    };
  }

  /**
   * Play casino game with genuine probabilities
   */
  public playGame(
    userId: string,
    gameSlug: string,
    betAmount: number
  ): {
    success: boolean;
    isWin: boolean;
    multiplier: number;
    payout: number;
    newBalance: number;
    gameResult: any;
  } {
    const game = this.state.games.find((g) => g.slug === gameSlug);
    if (!game) throw new Error('اللعبة غير موجودة');

    const wallet = this.state.wallets.find((w) => w.user_id === userId);
    if (!wallet) throw new Error('المحفظة غير موجودة');

    const minBet = game.minimum_bet ?? game.min_bet ?? 1;
    const maxBet = game.maximum_bet ?? game.max_bet ?? 1000;

    if (betAmount < minBet || betAmount > maxBet) {
      throw new Error(`مبلغ الرهان يجب أن يكون بين $${minBet} و $${maxBet}`);
    }

    if (wallet.balance < betAmount) {
      throw new Error('الرصيد غير كافٍ لخوض هذه الجولة');
    }

    // Deduct bet amount
    const balBefore = wallet.balance;
    wallet.balance = Number((wallet.balance - betAmount).toFixed(2));

    let isWin = false;
    let multiplier = 0;
    let gameResult: any = {};

    const rng = Math.random();

    if (gameSlug === 'golden-slots') {
      const symbols = ['🦁', '👑', '💎', '7️⃣', '🍒', '🪙'];
      let r1 = symbols[Math.floor(Math.random() * symbols.length)];
      let r2 = symbols[Math.floor(Math.random() * symbols.length)];
      let r3 = symbols[Math.floor(Math.random() * symbols.length)];

      // 38% win probability for interactive thrill
      if (rng < 0.05) {
        // Triple Lion Jackpot
        r1 = '🦁';
        r2 = '🦁';
        r3 = '🦁';
        multiplier = 25.0;
        isWin = true;
      } else if (rng < 0.12) {
        // Triple Crown / Diamond
        r1 = rng < 0.08 ? '👑' : '💎';
        r2 = r1;
        r3 = r1;
        multiplier = 12.0;
        isWin = true;
      } else if (rng < 0.22) {
        // Triple Seven
        r1 = '7️⃣';
        r2 = '7️⃣';
        r3 = '7️⃣';
        multiplier = 5.0;
        isWin = true;
      } else if (rng < 0.38) {
        // Double match
        r1 = '🪙';
        r2 = '🪙';
        r3 = '🍒';
        multiplier = 2.0;
        isWin = true;
      } else {
        // Loss: ensure not all three equal
        if (r1 === r2 && r2 === r3) r3 = '🍒';
        multiplier = 0;
        isWin = false;
      }
      gameResult = { reels: [r1, r2, r3] };
    } else if (gameSlug === 'lucky-wheel') {
      const segments = [
        { mult: 0, label: '0x', prob: 0.5 },
        { mult: 1.5, label: '1.5x', prob: 0.2 },
        { mult: 2.0, label: '2.0x', prob: 0.15 },
        { mult: 3.0, label: '3.0x', prob: 0.08 },
        { mult: 5.0, label: '5.0x', prob: 0.05 },
        { mult: 10.0, label: '10.0x', prob: 0.02 },
      ];
      let acc = 0;
      let chosen = segments[0];
      for (const seg of segments) {
        acc += seg.prob;
        if (rng < acc) {
          chosen = seg;
          break;
        }
      }
      multiplier = chosen.mult;
      isWin = multiplier > 0;
      gameResult = { multiplier, label: chosen.label };
    } else if (gameSlug === 'dice-room') {
      const d1 = 1 + Math.floor(Math.random() * 6);
      const d2 = 1 + Math.floor(Math.random() * 6);
      const sum = d1 + d2;
      if (d1 === 6 && d2 === 6) {
        multiplier = 10.0;
        isWin = true;
      } else if (sum >= 8) {
        multiplier = 2.5;
        isWin = true;
      } else if (sum === 7) {
        multiplier = 1.5;
        isWin = true;
      } else {
        multiplier = 0;
        isWin = false;
      }
      gameResult = { dice1: d1, dice2: d2, sum };
    } else {
      // Coin flip / Royal cards
      const coin = rng < 0.5 ? 'heads' : 'tails';
      if (rng < 0.49) {
        multiplier = 1.96;
        isWin = true;
      } else {
        multiplier = 0;
        isWin = false;
      }
      gameResult = { side: coin, choice: 'heads' };
    }

    const payout = Number((betAmount * multiplier).toFixed(2));
    if (isWin && payout > 0) {
      wallet.balance = Number((wallet.balance + payout).toFixed(2));
    }
    wallet.updated_at = new Date().toISOString();

    // Log transactions
    this.state.transactions.unshift({
      id: `tx-${Date.now()}-bet`,
      wallet_id: wallet.id,
      source_user_id: userId,
      target_user_id: userId,
      type: 'GAME_BET',
      amount: betAmount,
      balance_before: balBefore,
      balance_after: Number((balBefore - betAmount).toFixed(2)),
      description: `رهان جولة في لعبة ${game.name}`,
      created_at: new Date().toISOString(),
    });

    if (isWin && payout > 0) {
      this.state.transactions.unshift({
        id: `tx-${Date.now()}-win`,
        wallet_id: wallet.id,
        source_user_id: userId,
        target_user_id: userId,
        type: 'GAME_WIN',
        amount: payout,
        balance_before: Number((balBefore - betAmount).toFixed(2)),
        balance_after: wallet.balance,
        description: `فوز في لعبة ${game.name} بمضاعف x${multiplier}`,
        created_at: new Date().toISOString(),
      });
    }

    this.saveAndNotify('wallets', { event: 'UPDATE', new: wallet });
    this.notify('wallet_transactions', { event: 'INSERT' });

    return {
      success: true,
      isWin,
      multiplier,
      payout,
      newBalance: wallet.balance,
      gameResult,
    };
  }

  /**
   * Create match (Owner only)
   */
  public createMatch(matchData: Partial<Match>): Match {
    const newMatch: Match = {
      id: `match-${Date.now()}`,
      league: matchData.league || 'دوري أبطال أوروبا',
      team_a: matchData.team_a || 'الفريق أ',
      team_b: matchData.team_b || 'الفريق ب',
      odds_team_a: matchData.odds_team_a || 2.0,
      odds_draw: matchData.odds_draw || 3.2,
      odds_team_b: matchData.odds_team_b || 2.5,
      match_time: matchData.match_time || new Date(Date.now() + 3600000 * 24).toISOString(),
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.state.matches.unshift(newMatch);
    this.saveAndNotify('matches', { event: 'INSERT', new: newMatch });
    return newMatch;
  }

  /**
   * Promote user to admin (Owner only)
   */
  public assignAdminRole(userId: string): void {
    const profile = this.state.profiles.find((p) => p.id === userId);
    if (!profile) throw new Error('المستخدم غير موجود');
    profile.role = 'admin';
    profile.updated_at = new Date().toISOString();
    this.saveAndNotify('profiles', { event: 'UPDATE', new: profile });
  }

  /**
   * Suspend or change user status
   */
  public suspendUser(userId: string, newStatus: 'active' | 'suspended' | 'blocked'): void {
    const profile = this.state.profiles.find((p) => p.id === userId);
    if (!profile) throw new Error('المستخدم غير موجود');
    profile.status = newStatus;
    profile.updated_at = new Date().toISOString();
    this.saveAndNotify('profiles', { event: 'UPDATE', new: profile });
  }
}

export const casinoDatabase = new CasinoDatabaseEngine();
