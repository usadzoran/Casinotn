import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { casinoEngine } from '../lib/supabase';
import { Profile, Wallet } from '../types/database';
import {
  Shield,
  Users,
  Send,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  PlusCircle,
  Clock,
  Ban,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, wallet, refreshUserData } = useAuth();
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<number>(100);
  const [transferDesc, setTransferDesc] = useState<string>('شحن محفظة لاعب');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const allProfiles = casinoEngine.getProfiles();
  const players = allProfiles.filter((p) => p.role === 'player');
  const activePlayers = players.filter((p) => p.status === 'active');

  const adminBalance = wallet ? wallet.balance : 0;

  // Calculate total distributed by this admin
  const transactions = user ? casinoEngine.getTransactions(user.id, 'admin') : [];
  const totalDistributed = transactions
    .filter((t) => t.type === 'ADMIN_TO_PLAYER' && t.source_user_id === user?.id)
    .reduce((sum, t) => sum + t.amount, 0);

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
      await casinoEngine.adminTransferToPlayer(
        user.id,
        selectedPlayerId,
        transferAmount,
        transferDesc
      );
      refreshUserData();
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
      const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await casinoEngine.suspendUser(user.id, playerId, nextStatus);
      refreshUserData();
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
            <p className="text-xs text-zinc-400">إدارة اللاعبين وشحن المحافظ الافتراضية</p>
          </div>
        </div>

        <button
          onClick={() => handleOpenTransfer()}
          className="px-5 py-3 rounded-2xl font-bold text-black bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 self-start md:self-auto"
        >
          <Send className="w-4 h-4" />
          <span>تحويل رصيد للاعب (TRANSFER BALANCE)</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-3xl bg-[#121218] border border-emerald-500/30 shadow-xl relative overflow-hidden">
          <span className="text-xs font-bold text-emerald-400 block mb-1">رصيد المشرف الافتراضي</span>
          <span className="text-3xl font-black font-mono text-white">
            ${adminBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <p className="text-[11px] text-zinc-500 mt-2">الحد المتاح للتوزيع على اللاعبين</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#121218] border border-zinc-800 shadow-xl">
          <span className="text-xs font-bold text-zinc-400 block mb-1">إجمالي اللاعبين المسجلين</span>
          <span className="text-3xl font-black font-mono text-white">{players.length}</span>
          <p className="text-[11px] text-zinc-500 mt-2">جميع حسابات اللاعبين في النظام</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#121218] border border-zinc-800 shadow-xl">
          <span className="text-xs font-bold text-emerald-400 block mb-1">اللاعبين النشطين</span>
          <span className="text-3xl font-black font-mono text-emerald-300">{activePlayers.length}</span>
          <p className="text-[11px] text-zinc-500 mt-2">حسابات بحالة نشطة (Active)</p>
        </div>

        <div className="p-6 rounded-3xl bg-[#121218] border border-zinc-800 shadow-xl">
          <span className="text-xs font-bold text-amber-400 block mb-1">إجمالي المبالغ الموزعة</span>
          <span className="text-3xl font-black font-mono text-amber-300">
            ${totalDistributed.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <p className="text-[11px] text-zinc-500 mt-2">مجموع شحنات اللاعبين المسجلة</p>
        </div>
      </div>

      {/* Players Management Table */}
      <div className="rounded-3xl bg-[#121218] border border-zinc-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">إدارة اللاعبين (Player Management)</h3>
          </div>
          <span className="text-xs text-zinc-400">{players.length} لاعب مسجل</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="text-zinc-400 border-b border-zinc-800 pb-2 font-semibold">
                <th className="py-3 px-4">الاسم الكامل</th>
                <th className="py-3 px-4">اسم المستخدم</th>
                <th className="py-3 px-4">البريد الإلكتروني</th>
                <th className="py-3 px-4">الحالة</th>
                <th className="py-3 px-4">الرصيد الافتراضي</th>
                <th className="py-3 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {players.map((pl) => {
                const plWallet = casinoEngine.getWallet(pl.id);
                return (
                  <tr key={pl.id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{pl.full_name}</td>
                    <td className="py-3.5 px-4 font-mono text-zinc-400">{pl.username}</td>
                    <td className="py-3.5 px-4 text-zinc-400">{pl.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          pl.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {pl.status === 'active' ? 'نشط' : 'معلق'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-amber-300 text-sm">
                      ${plWallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenTransfer(pl.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black font-bold transition-all flex items-center gap-1"
                          title="شحن محفظة اللاعب"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>شحن</span>
                        </button>
                        <button
                          onClick={() => handleToggleSuspend(pl.id, pl.status)}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            pl.status === 'active'
                              ? 'text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                              : 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                          title={pl.status === 'active' ? 'تعليق الحساب' : 'تفعيل الحساب'}
                        >
                          {pl.status === 'active' ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Balance Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-emerald-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white">
                <Send className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg">تحويل رصيد إلى محفظة لاعب</h3>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 my-4">
              {/* Select Player */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">اختر اللاعب:</label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                >
                  {players.map((pl) => {
                    const plw = casinoEngine.getWallet(pl.id);
                    return (
                      <option key={pl.id} value={pl.id}>
                        {pl.full_name} (@{pl.username}) - الرصيد الحالي: ${plw.balance}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  المبلغ المراد شحنه ($):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-emerald-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={adminBalance}
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(Number(e.target.value))}
                    className="w-full py-2.5 px-4 pl-8 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-sm focus:outline-none focus:border-emerald-400 text-right"
                  />
                </div>
                <span className="text-[11px] text-zinc-400 mt-1 block">
                  رصيدك المتاح: ${adminBalance.toLocaleString()}
                </span>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">بيان العملية:</label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-emerald-400"
                />
              </div>

              {/* Feedback */}
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

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || adminBalance < transferAmount}
                  className="flex-2 py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التحويل...</span>
                    </>
                  ) : (
                    <span>تأكيد التحويل (${transferAmount})</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
