import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Profile, UserRole, Wallet, Notification } from '../types/database';
import { supabase, casinoApi, getSavedSupabaseConfig } from '../lib/supabase';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = getSavedSupabaseConfig();
  const isSupabaseConnected = config.isConfigured;

  const [user, setUser] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch user profile, wallet, and notifications from Supabase
  const loadUserData = useCallback(async (userId: string) => {
    try {
      const [profileData, walletData, notifsData] = await Promise.all([
        casinoApi.getProfile(userId),
        casinoApi.getWallet(userId),
        casinoApi.getNotifications(userId),
      ]);

      setUser(profileData);
      setWallet(walletData);
      setNotifications(notifsData);
    } catch (err) {
      console.warn('[5LION CASINO] Error loading user data from Supabase:', err);
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (user?.id) {
      await loadUserData(user.id);
    }
  }, [user?.id, loadUserData]);

  // Handle Supabase Auth lifecycle
  useEffect(() => {
    let isMounted = true;

    // 1. Initial Session Check
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!isMounted) return;
        if (session?.user?.id) {
          await loadUserData(session.user.id);
        } else {
          setUser(null);
          setWallet(null);
          setNotifications([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('[5LION CASINO] Session check failed:', err);
        if (isMounted) setIsLoading(false);
      });

    // 2. Auth State Change Listener
    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (session?.user?.id) {
        await loadUserData(session.user.id);
      } else {
        setUser(null);
        setWallet(null);
        setNotifications([]);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      authListener?.unsubscribe();
    };
  }, [loadUserData]);

  // 3. Realtime Subscription for active user's Wallet & Notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`user-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setWallet(payload.new as Wallet);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setUser(payload.new as Profile);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Login via Supabase Auth
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user?.id) {
        await loadUserData(data.user.id);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'فشل تسجيل الدخول' };
    }
  };

  // Public Player Registration via Supabase Auth
  const register = async (
    fullName: string,
    username: string,
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: {
            full_name: fullName.trim(),
            username: username.trim().toLowerCase(),
            role: 'player', // strictly player for public signups!
          },
        },
      });

      if (error) {
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      if (data.user?.id) {
        // Wait briefly for triggers to complete insertion
        await new Promise((r) => setTimeout(r, 600));
        await loadUserData(data.user.id);
      }

      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'فشل إنشاء الحساب' };
    }
  };

  // Logout via Supabase Auth
  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setUser(null);
      setWallet(null);
      setNotifications([]);
      setIsLoading(false);
    }
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
