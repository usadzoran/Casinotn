import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, UserRole, Wallet, Notification } from '../types/database';
import { supabase, casinoApi, getSavedSupabaseConfig } from '../lib/supabase';
import { casinoDatabase } from '../lib/databaseEngine';

interface AuthContextType {
  user: Profile | null;
  wallet: Wallet | null;
  role: UserRole | null;
  notifications: Notification[];
  unreadNotificationsCount: number;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, username: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  quickLoginAsRole: (role: 'owner' | 'admin' | 'player') => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = getSavedSupabaseConfig();
  const isSupabaseConnected = config.isConfigured;

  const [user, setUser] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch user profile, wallet, and notifications
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const [profileData, walletData, notifsData] = await Promise.all([
        casinoApi.getProfile(userId),
        casinoApi.getWallet(userId),
        casinoApi.getNotifications(userId),
      ]);

      if (profileData) {
        setUser(profileData);
      }
      if (walletData) {
        setWallet(walletData);
      }
      setNotifications(notifsData || []);
    } catch (err) {
      console.warn('[5LION CASINO] Error loading user data:', err);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (user?.id) {
      await loadUserData(user.id);
    }
  }, [user?.id, loadUserData]);

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      // 1. Check local engine session first
      const localUser = casinoDatabase.getSessionUser();
      if (localUser) {
        await loadUserData(localUser.id);
        if (isMounted) setIsLoading(false);
        return;
      }

      // 2. If Supabase is configured, check Supabase auth
      if (isSupabaseConnected) {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user?.id && isMounted) {
            await loadUserData(data.session.user.id);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Supabase session check failed:', err);
        }
      }

      // Default: auto-login as Player if first visit so the site is instantly interactive
      // or check if there's any user in local storage
      const defaultUser = casinoDatabase.getProfile('player-00000000-0000-0000-0000-000000000001');
      if (defaultUser) {
        casinoDatabase.setSessionUser(defaultUser.id);
        await loadUserData(defaultUser.id);
      }

      if (isMounted) setIsLoading(false);
    };

    initAuth();

    // 3. Supabase Auth State Change Listener
    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      if (session?.user?.id) {
        await loadUserData(session.user.id);
      }
    });

    // 4. Local Database Subscription
    const unsubscribeDb = casinoDatabase.subscribe((table, payload) => {
      if (!isMounted) return;
      if (table === 'wallets' || table === 'all') {
        const currentUser = casinoDatabase.getSessionUser();
        if (currentUser?.id) {
          const w = casinoDatabase.getWallet(currentUser.id);
          if (w) setWallet({ ...w });
        }
      }
      if (table === 'profiles' || table === 'all') {
        const currentUser = casinoDatabase.getSessionUser();
        if (currentUser?.id) {
          const p = casinoDatabase.getProfile(currentUser.id);
          if (p) setUser({ ...p });
        }
      }
      if (table === 'notifications' || table === 'all') {
        const currentUser = casinoDatabase.getSessionUser();
        if (currentUser?.id) {
          setNotifications(casinoDatabase.getNotifications(currentUser.id));
        }
      }
    });

    return () => {
      isMounted = false;
      authListener?.unsubscribe();
      unsubscribeDb();
    };
  }, [isSupabaseConnected, loadUserData]);

  // Login via Supabase Auth or Local Engine
  const login = async (emailOrUsername: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // Try Supabase first if configured
    if (isSupabaseConnected && emailOrUsername.includes('@')) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailOrUsername.trim(),
          password: pass,
        });

        if (!error && data.user?.id) {
          await loadUserData(data.user.id);
          setIsLoading(false);
          return { success: true };
        }
      } catch {
        // Fallback to local
      }
    }

    // Local Database Engine Authentication
    const localRes = casinoDatabase.login(emailOrUsername, pass);
    if (localRes.success && localRes.user) {
      await loadUserData(localRes.user.id);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: localRes.error || 'فشل تسجيل الدخول. يرجى التأكد من البيانات.' };
  };

  // Quick Login directly as Role (for instant testing of Owner, Admin, Player)
  const quickLoginAsRole = async (roleType: 'owner' | 'admin' | 'player'): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    let targetEmail = 'player@5lion.com';
    let targetPass = 'player123';
    if (roleType === 'owner') {
      targetEmail = 'owner@5lion.com';
      targetPass = 'owner123';
    } else if (roleType === 'admin') {
      targetEmail = 'admin@5lion.com';
      targetPass = 'admin123';
    }

    const res = await login(targetEmail, targetPass);
    setIsLoading(false);
    return res;
  };

  // Public Player Registration
  const register = async (
    fullName: string,
    username: string,
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (isSupabaseConnected) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: {
            data: {
              full_name: fullName.trim(),
              username: username.trim().toLowerCase(),
              role: 'player',
            },
          },
        });

        if (!error && data.user?.id) {
          await new Promise((r) => setTimeout(r, 600));
          await loadUserData(data.user.id);
          setIsLoading(false);
          return { success: true };
        }
      } catch {
        // Fallback to local
      }
    }

    // Local Engine Registration
    const localRes = casinoDatabase.register(fullName, username, email, pass);
    if (localRes.success && localRes.user) {
      await loadUserData(localRes.user.id);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, error: localRes.error || 'فشل إنشاء الحساب' };
  };

  // Logout
  const logout = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConnected) {
        await supabase.auth.signOut();
      }
    } catch {
      // ignore
    }
    casinoDatabase.logout();
    setUser(null);
    setWallet(null);
    setNotifications([]);
    setIsLoading(false);
  };

  const markNotificationsAsRead = async () => {
    if (user?.id) {
      await casinoApi.markNotificationsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        role: user?.role || null,
        notifications,
        unreadNotificationsCount,
        isLoading,
        isSupabaseConnected,
        login,
        register,
        logout,
        refreshUserData,
        markNotificationsAsRead,
        quickLoginAsRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
