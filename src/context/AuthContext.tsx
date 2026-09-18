import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole, Wallet, Notification } from '../types/database';
import { casinoEngine, supabase, getSavedSupabaseConfig } from '../lib/supabase';

interface AuthContextType {
  user: Profile | null;
  wallet: Wallet | null;
  role: UserRole | null;
  notifications: Notification[];
  unreadNotificationsCount: number;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  switchDemoRole: (role: UserRole) => void;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, username: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUserData: () => void;
  markNotificationsAsRead: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const config = getSavedSupabaseConfig();
  const isSupabaseConnected = config.isConfigured;

  // Current active user (defaults to Player VIP for instant player experience, with easy 1-click switch to Owner/Admin)
  const [currentUserId, setCurrentUserId] = useState<string>('00000000-0000-0000-0000-000000000001'); // Start as Owner by default so owner can oversee
  const [user, setUser] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync state
  const syncState = () => {
    try {
      if (!currentUserId) {
        setUser(null);
        setWallet(null);
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      const p = casinoEngine?.getProfile ? casinoEngine.getProfile(currentUserId) : null;
      const w = casinoEngine?.getWallet ? casinoEngine.getWallet(currentUserId) : null;
      const notifs = casinoEngine?.getNotifications ? casinoEngine.getNotifications(currentUserId) : [];

      setUser(p);
      setWallet(w ? { ...w } : null);
      setNotifications(Array.isArray(notifs) ? notifs : []);
      setIsLoading(false);
    } catch (err) {
      console.warn('Error in syncState:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncState();
    try {
      const unsubscribe = casinoEngine?.subscribe?.(() => {
        syncState();
      });
      return () => unsubscribe?.();
    } catch (err) {
      console.warn('Error subscribing to engine:', err);
    }
  }, [currentUserId]);

  // If real Supabase Auth is active
  useEffect(() => {
    if (supabase) {
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          if (session?.user) {
            // If live Supabase session exists
            const p = casinoEngine?.getProfile ? casinoEngine.getProfile(session.user.id) : null;
            if (p) setCurrentUserId(p.id);
          }
        })
        .catch((err) => {
          console.warn('Supabase getSession error ignored:', err);
        });

      try {
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
          if (session?.user) {
            const p = casinoEngine?.getProfile ? casinoEngine.getProfile(session.user.id) : null;
            if (p) setCurrentUserId(p.id);
          }
        });

        return () => {
          authListener?.subscription?.unsubscribe?.();
        };
      } catch (err) {
        console.warn('Supabase onAuthStateChange error ignored:', err);
      }
    }
  }, []);

  const switchDemoRole = (role: UserRole) => {
    const profiles = casinoEngine.getProfiles();
    const target = profiles.find((p) => p.role === role);
    if (target) {
      setCurrentUserId(target.id);
    }
  };

  const login = async (email: string, _pass: string) => {
    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: _pass });
        if (error) throw error;
        if (data.user) {
          setCurrentUserId(data.user.id);
          return { success: true };
        }
      }

      // In-engine auth fallback
      const profiles = casinoEngine.getProfiles();
      const match = profiles.find((p) => p.email.toLowerCase() === email.toLowerCase() || p.username.toLowerCase() === email.toLowerCase());
      if (!match) {
        setIsLoading(false);
        return { success: false, error: 'البريد الإلكتروني أو اسم المستخدم غير موجود' };
      }
      if (match.status !== 'active') {
        setIsLoading(false);
        return { success: false, error: 'هذا الحساب معلق أو محظور' };
      }

      setCurrentUserId(match.id);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'فشل تسجيل الدخول' };
    }
  };

  const register = async (fullName: string, username: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: {
            data: { full_name: fullName, username },
          },
        });
        if (error) throw error;
        if (data.user) {
          setCurrentUserId(data.user.id);
          return { success: true };
        }
      }

      // In-engine registration (ALWAYS PLAYER)
      const profiles = casinoEngine.getProfiles();
      const exists = profiles.some((p) => p.email.toLowerCase() === email.toLowerCase() || p.username.toLowerCase() === username.toLowerCase());
      if (exists) {
        setIsLoading(false);
        return { success: false, error: 'البريد الإلكتروني أو اسم المستخدم مسجل مسبقاً' };
      }

      const newId = `usr-${Date.now()}`;
      const newPlayer: Profile = {
        id: newId,
        full_name: fullName,
        username,
        email,
        role: 'player', // strictly player for public signups!
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // Register into engine
      profiles.push(newPlayer);
      casinoEngine.getWallet(newId); // auto creates 0 balance wallet
      setCurrentUserId(newId);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err?.message || 'فشل إنشاء الحساب' };
    }
  };

  const logout = () => {
    if (supabase) {
      supabase.auth.signOut().catch(console.error);
    }
    // Set to Player by default or null
    setCurrentUserId('');
  };

  const refreshUserData = () => {
    syncState();
  };

  const markNotificationsAsRead = () => {
    if (user) {
      casinoEngine.markNotificationsRead(user.id);
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
        switchDemoRole,
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
