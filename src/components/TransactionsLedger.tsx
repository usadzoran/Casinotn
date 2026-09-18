import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { casinoApi, supabase } from '../lib/supabase';
import { WalletTransaction } from '../types/database';
import { ArrowDownLeft, ArrowUpRight, History, Shield, Wallet as WalletIcon, Filter, RefreshCw } from 'lucide-react';

export const TransactionsLedger: React.FC = () => {
  const { user, wallet, role } = useAuth();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTransactions = useCallback(async () => {
    if (!user?.id) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    try {
      const data = await casinoApi.getTransactions(user.id, role || 'player');
      setTransactions(data);
    } catch (err) {
      console.warn('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, role]);

  useEffect(() => {
    loadTransactions();

    if (!user?.id) return;

    // Realtime channel for wallet transactions
    const channel = supabase
      .channel(`transactions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_transactions',
        },
        () => {
          loadTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadTransactions]);

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
              ${wallet ? Number(wallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
            </h2>
            <p className="text-xs text-zinc-400 mt-2">
              رصيد افتراضي مسجل في قاعدة بيانات Supabase ومحمي ضد التعديل المباشر.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-400">حالة الحساب:</span>
              <span className="font-bold text-emerald-400">نشط (Active)</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-zinc-400">إجمالي الحركات:</span>
              <span className="font-mono text-white font-bold">{transactions.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-400" />
          <h3 className="text-xl font-bold text-white font-cinzel">دفتر الأستاذ والحركات المالية (Ledger)</h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 text-xs">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'ALL' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setFilterType('ADMIN_TO_PLAYER')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'ADMIN_TO_PLAYER' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            شحن المشرفين
          </button>
          <button
            onClick={() => setFilterType('BET_WIN')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'BET_WIN' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            أرباح الرهان
          </button>
          <button
            onClick={() => setFilterType('GAME_BET')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filterType === 'GAME_BET' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            الألعاب
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#121218] border border-zinc-800/80">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">جاري تحميل دفتر الحركات من Supabase...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#121218] border border-zinc-800/80">
          <History className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">لا توجد حركات مسجلة</h4>
          <p className="text-xs text-zinc-400">ستظهر هنا كل العمليات المالية وشحنات الرصيد والرهانات.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => {
            const { label, isCredit } = getTypeLabel(tx.type);
            const formattedDate = new Date(tx.created_at).toLocaleString('ar-TN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            });

            return (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-[#121218] border border-zinc-800/80 hover:border-zinc-700 transition-all flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCredit
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }`}
                  >
                    {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{label}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">#{tx.id.slice(0, 8)}</span>
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span>{formattedDate}</span>
                      {tx.description && (
                        <>
                          <span>•</span>
                          <span>{tx.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-left">
                  <div
                    className={`font-bold font-mono text-base ${
                      isCredit ? 'text-emerald-400' : 'text-zinc-300'
                    }`}
                  >
                    {isCredit ? '+' : '-'}${Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-zinc-500 block">VIRTUAL_USD</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
