import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, X, AlertCircle, RefreshCw, Crown, Shield, User, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToLogin?: () => void;
}

export const LoginModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { login, quickLoginAsRole } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'فشل تسجيل الدخول');
    }
  };

  const handleQuickLogin = async (roleType: 'owner' | 'admin' | 'player') => {
    setError(null);
    setLoading(true);
    const res = await quickLoginAsRole(roleType);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'فشل تسجيل الدخول السريع');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-amber-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <LogIn className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-lg text-white font-cinzel">تسجيل الدخول إلى 5LION</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Role Selection Banner */}
        <div className="my-4 p-3.5 rounded-2xl bg-[#181722] border border-amber-500/20">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تسجيل دخول تجريبي سريع بنقرة واحدة:</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('owner')}
              className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex flex-col items-center gap-1 transition-all"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              <span>المالك (Owner)</span>
              <span className="text-[9px] text-zinc-400 font-normal">$1,000,000</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex flex-col items-center gap-1 transition-all"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>مشرف (Admin)</span>
              <span className="text-[9px] text-zinc-400 font-normal">$50,000</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('player')}
              className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-[11px] font-bold flex flex-col items-center gap-1 transition-all"
            >
              <User className="w-4 h-4 text-blue-400" />
              <span>لاعب (Player)</span>
              <span className="text-[9px] text-zinc-400 font-normal">$2,500</span>
            </button>
          </div>
        </div>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#121218] px-2 text-zinc-500">أو بالبريد وكلمة المرور</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              البريد الإلكتروني أو اسم المستخدم:
            </label>
            <input
              type="text"
              required
              placeholder="owner@5lion.com أو admin أو player"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 text-left ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">كلمة المرور:</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 text-left ltr"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>دخول المنصة</span>}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-zinc-400">
          ليس لديك حساب؟{' '}
          <button
            onClick={() => {
              onClose();
              if (onSwitchToRegister) onSwitchToRegister();
            }}
            className="text-amber-400 font-bold hover:underline"
          >
            إنشاء حساب لاعب جديد
          </button>
        </div>
      </div>
    </div>
  );
};

export const RegisterModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await register(fullName, username, email, password);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'فشل إنشاء الحساب');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-amber-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-lg text-white font-cinzel">إنشاء حساب لاعب جديد</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-200">
          * التسجيل يمنحك دور <strong>لاعب (Player)</strong> برصيد افتراضي أولي ترحيبي $100.00. يمكن شحن رصيد إضافي بواسطة المشرفين.
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">الاسم الكامل:</label>
            <input
              type="text"
              required
              placeholder="سعيد المحمدي"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">اسم المستخدم (Username):</label>
            <input
              type="text"
              required
              placeholder="player_saeed"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 text-left ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">البريد الإلكتروني:</label>
            <input
              type="email"
              required
              placeholder="saeed@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 text-left ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">كلمة المرور:</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 text-left ltr"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>تسجيل الحساب</span>}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-zinc-400">
          لديك حساب بالفعل؟{' '}
          <button
            onClick={() => {
              onClose();
              if (onSwitchToLogin) onSwitchToLogin();
            }}
            className="text-amber-400 font-bold hover:underline"
          >
            تسجيل الدخول
          </button>
        </div>
      </div>
    </div>
  );
};
