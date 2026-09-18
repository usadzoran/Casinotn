import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { casinoEngine } from '../lib/supabase';
import { WalletTransaction } from '../types/database';
import { ArrowDownLeft, ArrowUpRight, History, Shield, Wallet as WalletIcon, Filter } from 'lucide-react';

export const TransactionsLedger: React.FC = () => {
  const { user, wallet, role } = useAuth();
  const [filterType, setFilterType] = useState<string>('ALL');

  const transactions: WalletTransaction[] = user
    ? casinoEngine.getTransactions(user.id, role || 'player')
    : [];

  const filtered = transactions.filter((t) => {
    if (filterType === 'ALL') return true;
    return t.type === filterType;
  });

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'OWNER_TO_ADMIN':
        return { label: 'تخصيص مالك ➔ مشرف', isCredit: true };
      case 'ADMIN_TO_PLAYER':
        return { label: 'شحن مشرف ➔ لاعب', isCredit: true };
      case 'GAME_BET':
        return { label: 'رهان لعبة كازينو', isCredit: false };
      case 'GAME_WIN':
        return { label: 'أرباح لعبة كازينو', isCredit: true };
      case 'BET_PLACED':
        return { label: 'رهان مباراة رياضية', isCredit: false };
      case 'BET_WIN':
        return { label: 'أرباح رهان فائز', isCredit: true };
      case 'PLAYER_REFUND':
        return { label: 'استرداد رصيد', isCredit: true };
      default:
        return { label: type, isCredit: false };
    }
  };

  return (
    <div className="py-8 px-4 lg:px-8 max-w-6xl mx-auto">
      {/* Top Wallet Summary Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#181824] to-[#101016] border border-amber-500/30 p-6 md:p-8 mb-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase mb-2">
              <WalletIcon className="w-4 h-4" />
              <span>محفظة الرصيد الافتراضي (VIRTUAL_USD)</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black font-cinzel text-white tracking-tight">
              ${wallet ? wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </h2>
            <p className="text-xs text-zinc-400 mt-2">
              رصيد افتراضي مسجل في قاعدة بيانات Supabase ومحمي ضد التعديل المباشر.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-right">
              <span className="text-[11px] text-zinc-400 block">إجمالي المعاملات</span>
              <span className="text-lg font-bold text-white font-mono">{transactions.length}</span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-right">
              <span className="text-[11px] text-zinc-400 block">الحالة الأمنية</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" />
                Atomic Ledger
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Filter & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl font-bold font-cinzel text-white">سجل الحركات المالية (Ledger)</h3>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-zinc-900 border border-zinc-700 text-xs font-semibold text-white px-3 py-2 rounded-xl focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">جميع المعاملات</option>
            <option value="ADMIN_TO_PLAYER">شحن المشرفين</option>
            <option value="BET_PLACED">رهانات المباريات</option>
            <option value="BET_WIN">أرباح الرهانات</option>
            <option value="GAME_BET">رهانات الألعاب</option>
            <option value="GAME_WIN">أرباح الألعاب</option>
            <option value="OWNER_TO_ADMIN">تخصيص المالك</option>
          </select>
        </div>
      </div>

      {/* Transactions Table / Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 rounded-3xl bg-[#121218] border border-zinc-800 text-zinc-400 text-sm">
          لا توجد سجلات مالية حتى الآن.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => {
            const { label, isCredit } = getTypeLabel(tx.type);
            const dateStr = new Date(tx.created_at).toLocaleDateString('ar-EG', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-[#121218] border border-zinc-800/80 hover:border-amber-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm"
              >
                {/* Type & Description */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isCredit
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{label}</span>
                      <span className="text-[11px] text-zinc-500 font-mono">#{tx.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{tx.description}</p>
                  </div>
                </div>

                {/* Amount and Balance Snapshot */}
                <div className="flex items-center justify-between md:justify-end gap-6 text-right pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-zinc-400 block">قبل ➔ بعد</span>
                    <span className="text-xs font-mono text-zinc-400">
                      ${tx.balance_before.toLocaleString()} ➔ ${tx.balance_after.toLocaleString()}
                    </span>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-base font-bold font-mono ${
                        isCredit ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {isCredit ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">{dateStr}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
