import React, { useState } from 'react';
import { getSavedSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';
import { Database, CheckCircle2, Copy, AlertCircle, RefreshCw, X, FileCode, Key } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url.trim(), anonKey.trim());
    setStatusMsg('تم حفظ الإعدادات! سيتم إعادة تحميل الصفحة للاتصال بمشروعك...');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
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
            <h3 className="font-bold text-lg">إعدادات الاتصال بـ Supabase و كود SQL</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="my-4 overflow-y-auto flex-1 space-y-6 pr-1">
          {/* Status Alert */}
          <div className="p-4 rounded-2xl bg-[#1a1924] border border-amber-500/20 text-xs text-zinc-300 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>حالة النظام: منصة 5LION متصلة بـ Supabase كمصدر وحيد للحقيقة!</span>
            </div>
            <p>
              جميع العمليات المالية (التحويلات، الرهانات، تسوية المباريات، الألعاب) تُنفذ عبر دوال PostgreSQL الذرية (RPC) مع حماية RLS وقفل الصفوف FOR UPDATE.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-4 h-4 text-amber-400" />
              <span>مفاتيح الاتصال بمشروع Supabase</span>
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
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400 text-left ltr"
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
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400 text-left ltr"
              />
            </div>

            {statusMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{statusMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <span>حفظ والاتصال بـ Supabase</span>
            </button>
          </form>

          {/* SQL Script Section */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-amber-400" />
                <span>ملف الترحيل الكامل (20260918_init_5lion_casino.sql)</span>
              </h4>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-amber-300 text-xs font-semibold hover:border-amber-400 transition-all flex items-center gap-1"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'تم النسخ!' : 'نسخ الكود'}</span>
              </button>
            </div>

            <div className="bg-black/90 border border-zinc-800 rounded-2xl p-4 text-[11px] font-mono text-zinc-300 max-h-56 overflow-y-auto text-left ltr">
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

-- 3. Atomic Functions with FOR UPDATE
CREATE OR REPLACE FUNCTION public.owner_add_admin_balance(
  p_owner_id UUID,
  p_admin_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Allocation from Owner Treasury'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
...
$$;
`;
