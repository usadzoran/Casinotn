import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/database';
import {
  Crown,
  Shield,
  User,
  Wallet as WalletIcon,
  Bell,
  LogOut,
  LogIn,
  UserPlus,
  Database,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openLoginModal: () => void;
  openRegisterModal: () => void;
  openConfigModal: () => void;
  openNotifModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  openLoginModal,
  openRegisterModal,
  openConfigModal,
  openNotifModal,
}) => {
  const { user, wallet, role, logout, switchDemoRole, unreadNotificationsCount, isSupabaseConnected } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0c0c10]/95 backdrop-blur-md border-b border-amber-500/20 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div
          onClick={() => {
            setActiveTab('home');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform duration-300">
            <span className="text-2xl font-bold">🦁</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-cinzel text-xl md:text-2xl font-black tracking-wider text-white">
                5<span className="gold-gradient-text">LION</span>
              </span>
              <span className="font-cinzel text-xs md:text-sm tracking-widest text-amber-400/90 font-semibold">
                CASINO
              </span>
            </div>
            <span className="text-[10px] text-amber-500/70 font-medium tracking-wide">VIRTUAL GAMING PLATFORM</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'home'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            الرئيسية
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'games'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            الألعاب
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'matches'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
            }`}
          >
            المباريات والرهان
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('my-bets')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'my-bets'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              رهاناتي
            </button>
          )}

          {user && (
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'transactions'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40'
              }`}
            >
              سجل المعاملات
            </button>
          )}

          {role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin-dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'admin-dashboard'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-emerald-950/30'
              }`}
            >
              <Shield className="w-4 h-4" />
              لوحة المشرف
            </button>
          )}

          {role === 'owner' && (
            <button
              onClick={() => setActiveTab('owner-dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeTab === 'owner-dashboard'
                  ? 'bg-amber-500/25 text-amber-200 border border-amber-400'
                  : 'text-amber-300 hover:text-amber-200 hover:bg-amber-950/40'
              }`}
            >
              <Crown className="w-4 h-4 text-amber-400" />
              لوحة المالك (Owner)
            </button>
          )}
        </nav>

        {/* Right Section: Balance, Demo Switcher, Notifications, Auth */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Quick Role Switcher for Testing (Owner / Admin / Player) */}
          <div className="hidden xl:flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1 rounded-xl text-xs">
            <span className="text-[11px] text-zinc-400 px-2">تجربة الدور:</span>
            <button
              onClick={() => switchDemoRole('owner')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                role === 'owner'
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-amber-300'
              }`}
            >
              👑 Owner
            </button>
            <button
              onClick={() => switchDemoRole('admin')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                role === 'admin'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'text-zinc-400 hover:text-emerald-300'
              }`}
            >
              🛡️ Admin
            </button>
            <button
              onClick={() => switchDemoRole('player')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                role === 'player'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'text-zinc-400 hover:text-amber-200'
              }`}
            >
              👤 Player
            </button>
          </div>

          {/* Supabase Connection Status Button */}
          <button
            onClick={openConfigModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-zinc-900/80 border-zinc-700/60 hover:border-amber-500/40 text-zinc-300"
            title="إعدادات Supabase والترحيل"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Supabase:</span>
            {isSupabaseConnected ? (
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                متصل
              </span>
            ) : (
              <span className="text-amber-300 font-medium">SQL & Config</span>
            )}
          </button>

          {/* User Logged In: Balance & Profile */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Virtual Balance Badge */}
              <div
                onClick={() => setActiveTab('transactions')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/40 cursor-pointer hover:border-amber-400 transition-all group"
                title="الرصيد الافتراضي الحالي"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <WalletIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-amber-400/80 font-semibold tracking-wide">الرصيد الافتراضي</span>
                  <span className="text-sm md:text-base font-bold text-amber-300 font-mono tracking-tight">
                    ${wallet ? wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
                  </span>
                </div>
              </div>

              {/* Notifications Button */}
              <button
                onClick={openNotifModal}
                className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
                title="الإشعارات"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* User Dropdown / Info */}
              <div className="flex items-center gap-2 pr-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 p-0.5 shadow-md">
                  <div className="w-full h-full rounded-full bg-[#121218] flex items-center justify-center text-amber-300 text-xs font-bold">
                    {user.full_name.charAt(0)}
                  </div>
                </div>
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-white leading-tight">{user.full_name}</span>
                  <span className="text-[10px] text-amber-400 uppercase tracking-wide flex items-center gap-1">
                    {role === 'owner' && <Crown className="w-2.5 h-2.5 text-amber-400 inline" />}
                    {role === 'admin' && <Shield className="w-2.5 h-2.5 text-emerald-400 inline" />}
                    {role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={openLoginModal}
                className="px-3 py-1.5 rounded-xl text-sm font-medium text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400 bg-amber-500/10 transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>دخول</span>
              </button>
              <button
                onClick={openRegisterModal}
                className="px-3.5 py-1.5 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>إنشاء حساب</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-zinc-800 flex flex-col gap-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-2 bg-zinc-900/80 rounded-xl mb-1 text-xs">
            <span className="text-zinc-400">تبديل الحساب التجريبي:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  switchDemoRole('owner');
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1 rounded text-xs ${role === 'owner' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400'}`}
              >
                Owner
              </button>
              <button
                onClick={() => {
                  switchDemoRole('admin');
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1 rounded text-xs ${role === 'admin' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400'}`}
              >
                Admin
              </button>
              <button
                onClick={() => {
                  switchDemoRole('player');
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-1 rounded text-xs ${role === 'player' ? 'bg-amber-400/30 text-amber-200 font-bold' : 'text-zinc-400'}`}
              >
                Player
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setActiveTab('home');
              setMobileMenuOpen(false);
            }}
            className="text-right px-4 py-2.5 rounded-xl bg-zinc-900/60 text-sm font-medium text-white"
          >
            الرئيسية
          </button>
          <button
            onClick={() => {
              setActiveTab('games');
              setMobileMenuOpen(false);
            }}
            className="text-right px-4 py-2.5 rounded-xl bg-zinc-900/60 text-sm font-medium text-white"
          >
            الألعاب الفاخرة
          </button>
          <button
            onClick={() => {
              setActiveTab('matches');
              setMobileMenuOpen(false);
            }}
            className="text-right px-4 py-2.5 rounded-xl bg-zinc-900/60 text-sm font-medium text-white"
          >
            المباريات والرهان الافتراضي
          </button>
          {user && (
            <button
              onClick={() => {
                setActiveTab('my-bets');
                setMobileMenuOpen(false);
              }}
              className="text-right px-4 py-2.5 rounded-xl bg-zinc-900/60 text-sm font-medium text-white"
            >
              سجل رهاناتي
            </button>
          )}
          {user && (
            <button
              onClick={() => {
                setActiveTab('transactions');
                setMobileMenuOpen(false);
              }}
              className="text-right px-4 py-2.5 rounded-xl bg-zinc-900/60 text-sm font-medium text-white"
            >
              سجل المعاملات الافتراضية
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={() => {
                setActiveTab('admin-dashboard');
                setMobileMenuOpen(false);
              }}
              className="text-right px-4 py-2.5 rounded-xl bg-emerald-950/40 text-emerald-300 text-sm font-bold border border-emerald-500/30 flex items-center justify-between"
            >
              <span>لوحة المشرف</span>
              <Shield className="w-4 h-4" />
            </button>
          )}
          {role === 'owner' && (
            <button
              onClick={() => {
                setActiveTab('owner-dashboard');
                setMobileMenuOpen(false);
              }}
              className="text-right px-4 py-2.5 rounded-xl bg-amber-950/40 text-amber-300 text-sm font-bold border border-amber-500/40 flex items-center justify-between"
            >
              <span>لوحة المالك (Owner)</span>
              <Crown className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </header>
  );
};
