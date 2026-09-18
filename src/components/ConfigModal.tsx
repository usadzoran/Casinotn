import React, { useState } from 'react';
import { getSavedSupabaseConfig, saveSupabaseConfig, testSupabaseConnection } from '../lib/supabase';
import { casinoDatabase } from '../lib/databaseEngine';
import { Database, CheckCircle2, Copy, AlertCircle, RefreshCw, X, FileCode, Key, RotateCcw, Activity } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getSavedSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    saveSupabaseConfig(url.trim(), anonKey.trim());
    setStatusMsg('تم حفظ مفاتيح Supabase بنجاح! سيتم تحديث الصفحة لتطبيق الإعدادات...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleTestConnection = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    setTesting(true);
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTesting(false);
    if (res.success) {
      setStatusMsg(res.message);
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleResetData = () => {
    if (window.confirm('هل أنت متأكد من إعادة ضبط البيانات الافتراضية لقاعدة البيانات؟ سيتم استعادة الأرصدة والمباريات الأصلية.')) {
      casinoDatabase.resetDatabase();
      setResetSuccess(true);
      setTimeout(() => {
        setResetSuccess(false);
        window.location.reload();
      }, 1000);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(FULL_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#121218] border border-amber-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-white">
            <Database className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-lg">حالة قاعدة البيانات وإعدادات الربط</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="my-4 overflow-y-auto flex-1 space-y-5 pr-1">
          {/* Active Database Mode Banner */}
          <div className="p-4 rounded-2xl bg-[#1a1924] border border-amber-500/20 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-white">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>حالة المحرك:</span>
              </div>
              {currentConfig.isConfigured ? (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  متصل بـ Supabase السحابي المباشر
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  قاعدة بيانات 5LION نشطة محلياً (الموقع يعمل 100%)
                </span>
              )}
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              الموقع مجهز بقاعدة بيانات ذرية مدمجة تضمن تشغيل المنصة فوراً (الأرصدة، التحويلات، رهانات المباريات، ألعاب الكازينو، سجل المعاملات). يمكنك أيضاً ربط مشروع Supabase الخاص بك في أي وقت عبر إدخال المفاتيح أدناه.
            </p>
          </div>

          {/* Form for Supabase Credentials */}
          <form onSubmit={handleSave} className="space-y-3 bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Key className="w-4 h-4 text-amber-400" />
              <span>ربط مشروع Supabase الخارجي</span>
            </h4>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Project URL (VITE_SUPABASE_URL):
              </label>
              <input
                type="text"
                placeholder="https://your-project.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400 text-left ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Anon Public Key (VITE_SUPABASE_ANON_KEY):
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400 text-left ltr"
              />
            </div>

            {statusMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
              >
                <span>حفظ والاتصال</span>
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-all flex items-center gap-1.5"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5 text-amber-400" />}
                <span>اختبار الاتصال بـ Supabase</span>
              </button>
            </div>
          </form>

          {/* Quick Database Actions */}
          <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800 flex items-center justify-between">
            <div>
              <h5 className="text-xs font-bold text-white mb-0.5">إعادة ضبط البيانات المحلية</h5>
              <p className="text-[11px] text-zinc-400">استعادة الأرصدة التجريبية ($1M للمالك، $50k للمشرف، $2.5k للاعب).</p>
            </div>
            <button
              type="button"
              onClick={handleResetData}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950/50 hover:text-rose-300 hover:border-rose-500/40 border border-zinc-700 text-zinc-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{resetSuccess ? 'تمت الاستعادة!' : 'إعادة ضبط'}</span>
            </button>
          </div>

          {/* SQL Script Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>كود الترحيل الكامل لـ Supabase SQL Editor</span>
              </h4>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-amber-300 text-xs font-semibold hover:border-amber-400 transition-all flex items-center gap-1"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ كود SQL'}</span>
              </button>
            </div>

            <div className="bg-black/90 border border-zinc-800 rounded-2xl p-4 text-[11px] font-mono text-zinc-300 max-h-52 overflow-y-auto text-left ltr">
              <pre>{FULL_SQL}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

const FULL_SQL = `-- ========================================================
-- 5LION CASINO COMPLETE PRODUCTION SCHEMA
-- Run this in your Supabase Project -> SQL Editor
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('owner', 'admin', 'player')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Wallets
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
  currency TEXT NOT NULL DEFAULT 'VIRTUAL_USD',
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Matches
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league TEXT NOT NULL,
  team_a TEXT NOT NULL,
  team_b TEXT NOT NULL,
  odds_team_a NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
  odds_draw NUMERIC(5, 2) NOT NULL DEFAULT 3.00,
  odds_team_b NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
  match_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'live', 'settled', 'cancelled')),
  score_team_a INT DEFAULT 0,
  score_team_b INT DEFAULT 0,
  winning_team TEXT,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Games Catalog
CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  minimum_bet NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
  maximum_bet NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
  rtp_percentage NUMERIC(5, 2) NOT NULL DEFAULT 96.00,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bets
CREATE TABLE IF NOT EXISTS public.bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  selected_team TEXT NOT NULL CHECK (selected_team IN ('team_a', 'team_b', 'draw')),
  bet_amount NUMERIC(15, 2) NOT NULL CHECK (bet_amount > 0),
  odds NUMERIC(5, 2) NOT NULL,
  potential_win NUMERIC(15, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Transactions
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  source_user_id UUID REFERENCES public.profiles(id),
  target_user_id UUID REFERENCES public.profiles(id),
  type TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  balance_before NUMERIC(15, 2) NOT NULL,
  balance_after NUMERIC(15, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;
