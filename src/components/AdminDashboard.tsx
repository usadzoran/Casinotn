import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { casinoApi, supabase } from '../lib/supabase';
import { Profile, Wallet, WalletTransaction } from '../types/database';
import {
  Shield,
  Users,
  Send,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Clock,
  Ban,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, wallet, refreshUserData } = useAuth();
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [p, w, tx] = await Promise.all([
        casinoApi.getAllProfiles(),
        casinoApi.getAllWallets(),
        casinoApi.getTransactions(user.id, 'admin'),
      ]);
      setProfiles(p);
      setWallets(w);
      setTransactions(tx);
    } catch (err) {
      console.warn('AdminDashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();

    // Realtime subscriptions
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets' },
        () => {
          casinoApi.getAllWallets().then(setWallets);
          refreshUserData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          casinoApi.getAllProfiles().then(setProfiles);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'wallet_transactions' },
        () => {
          if (user?.id) {
            casinoApi.getTransactions(user.id, 'admin').then(setTransactions);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, refreshUserData, user?.id]);

  const players = profiles.filter((p) => p.role === 'player');
  const activePlayers = players.filter((p) => p.status === 'active');
  const adminBalance = wallet ? Number(wallet.balance) : 0;

  // Calculate total distributed by this admin
  const totalDistributed = transactions
    .filter((t) => t.type === 'ADMIN_TO_PLAYER' && t.source_user_id === user?.id)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const handleOpenTransfer = (playerId?: string) => {
    setSelectedPlayerId(playerId || (players[0] ? players[0].id : ''));
    setTransferAmount(100);
    setError(null);
    setSuccess(null);
    setTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!selectedPlayerId) {
      setError('يرجى اختيار اللاعب');
      return;
    }
    if (transferAmount <= 0) {
      setError('يرجى تحديد مبلغ شحن أكبر من 0');
      return;
    }
    if (adminBalance < transferAmount) {
      setError(`الرصيد غير كافٍ. رصيدك الحالي هو $${adminBalance.toLocaleString()}`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await casinoApi.adminTransferToPlayer(selectedPlayerId, transferAmount);
      await refreshUserData();
      await loadData();
      setSuccess(`تم تحويل $${transferAmount.toLocaleString()} إلى اللاعب بنجاح!`);
      setTimeout(() => {
        setTransferModalOpen(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'فشلت عملية التحويل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSuspend = async (playerId: string, currentStatus: string) => {
    if (!user) return;
    try {
      const nextStatus: 'active' | 'suspended' = currentStatus === 'active' ? 'suspended' : 'active';
      await casinoApi.suspendUser(playerId, nextStatus);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'تعذر تغيير حالة المستخدم');
    }
  };

  return (
    <div className="py-8 px-4 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-white">
              لوحة تحكم <span className="text-emerald-400">المشرف (Admin)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              إدارة أرصدة اللاعبين وشحن الحسابات من رصيد المشرف المخصص
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenTransfer()}
            disabled={players.length === 0}
            className="px-4 py-2.5 rounded-xl font-bold text-black bg-emerald-400 hover:bg-emerald-300 transition-all text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>شحن رصيد لاعب</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-6 rounded-3xl bg-[#121218] border border-emerald-500/30 relative overflow-hidden">
          <div className="text-xs text-zinc-400 font-medium mb-1">رصيد المشرف المتاح للشحن</div>
          <div className="text-3xl font-black font-mono text-emerald-400">
            ${adminBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">مخصص من الخزينة الرئيسية للمالك</div>
        </div>

        <div className="p-6 rounded-3xl bg-[#121218] border border-zinc-800">
          <div className="text-xs text-zinc-400 font-medium mb-1">إجمالي اللاعبين المسجلين</div>
          <div className="text-3xl font-black font-mono text-white">{players.length}</div>
          <div className="text-[11px] text-emerald-400 mt-2">{activePlayers.length} حساب نشط</div>
        </div>

        <div className="p-6 rounded-3xl bg-[#121218] border border-zinc-800">
          <div className="text-xs text-zinc-400 font-medium mb-1">إجمالي ما تم توزيعه للاعبين</div>
          <div className="text-3xl font-black font-mono text-amber-400">
            ${totalDistributed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">شحنات منفذة بنجاح</div>
        </div>
      </div>

      {/* Players List Table */}
      <div className="rounded-3xl bg-[#121218] border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">قائمة اللاعبين وحساباتهم</h3>
          </div>
          <span className="text-xs text-zinc-400">تحديث فوري عبر Supabase</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-zinc-400">جاري تحميل بيانات اللاعبين...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs">
            لا يوجد لاعبون مسجلون حالياً.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-800 pb-2">
                  <th className="py-3 px-4">اسم اللاعب</th>
                  <th className="py-3 px-4">اسم المستخدم</th>
                  <th className="py-3 px-4">البريد الإلكتروني</th>
                  <th className="py-3 px-4">الرصيد الافتراضي</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {players.map((player) => {
                  const pWallet = wallets.find((w) => w.user_id === player.id) || { balance: 0 };
                  return (
                    <tr key={player.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{player.full_name}</td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400">@{player.username}</td>
                      <td className="py-3.5 px-4 text-zinc-400">{player.email}</td>
                      <td className="py-3.5 px-4 font-bold font-mono text-amber-400 text-sm">
                        ${Number(pWallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            player.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {player.status === 'active' ? 'نشط' : 'معلق'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenTransfer(player.id)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black font-bold transition-all flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>شحن رصيد</span>
                          </button>
                          <button
                            onClick={() => handleToggleSuspend(player.id, player.status)}
                            className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-rose-400 transition-colors"
                            title={player.status === 'active' ? 'تعليق الحساب' : 'تفعيل الحساب'}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-emerald-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-white">شحن رصيد لاعب</h3>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">اختر اللاعب:</label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                >
                  {players.map((p) => {
                    const pw = wallets.find((w) => w.user_id === p.id) || { balance: 0 };
                    return (
                      <option key={p.id} value={p.id}>
                        {p.full_name} (@{p.username}) - الرصيد الحالي: ${Number(pw.balance).toLocaleString()}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  مبلغ الشحن ($) - رصيدك الحالي: ${adminBalance.toLocaleString()}
                </label>
                <input
                  type="number"
                  min="1"
                  max={adminBalance}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-emerald-400 text-left ltr"
                />
              </div>

              <div className="flex gap-2">
                {[50, 100, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTransferAmount(amt)}
                    className="flex-1 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] hover:border-emerald-400"
                  >
                    +${amt}
                  </button>
                ))}
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || adminBalance < transferAmount}
                className="w-full py-3 rounded-xl font-bold text-black bg-emerald-400 hover:bg-emerald-300 transition-all text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>تأكيد التحويل الآن</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
