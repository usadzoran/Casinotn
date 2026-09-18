import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, X, AlertCircle, CheckCircle2, RefreshCw, Crown, Shield, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToLogin?: () => void;
}

export const LoginModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSwitchToRegister }) => {
  const { login, switchDemoRole } = useAuth();
  const [email, setEmail] = useState('player@5lion.casino');
  const [password, setPassword] = useState('password123');
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

  const handleQuickRole = (role: 'owner' | 'admin' | 'player') => {
    switchDemoRole(role);
    onClose();
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

        {/* Quick Demo Switcher */}
        <div className="my-4 p-3 bg-zinc-900/90 rounded-2xl border border-zinc-800 text-xs">
          <span className="text-zinc-400 block mb-2 font-medium">تجربة سريعة بنقرة واحدة (دخول فوري):</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickRole('owner')}
              className="py-1.5 px-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold hover:bg-amber-500 hover:text-black transition-all flex items-center justify-center gap-1"
            >
              <Crown className="w-3 h-3" />
              <span>المالك (Owner)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('admin')}
              className="py-1.5 px-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center gap-1"
            >
              <Shield className="w-3 h-3" />
              <span>مشرف (Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickRole('player')}
              className="py-1.5 px-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 font-bold hover:bg-zinc-700 transition-all flex items-center justify-center gap-1"
            >
              <User className="w-3 h-3" />
              <span>لاعب (Player)</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              البريد الإلكتروني أو اسم المستخدم:
            </label>
            <input
              type="text"
              required
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
          * التسجيل العام يمنحك دور <strong>لاعب (Player)</strong> برصيد افتراضي أولي $0.00. يتم شحن الرصيد من قِبل المشرفين فقط.
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
