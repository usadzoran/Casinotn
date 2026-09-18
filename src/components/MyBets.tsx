import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { casinoApi, supabase } from '../lib/supabase';
import { Bet } from '../types/database';
import { Trophy, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const MyBets: React.FC = () => {
  const { user, role } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBets = useCallback(async () => {
    if (!user?.id) {
      setAllBets([]);
      setLoading(false);
      return;
    }
    try {
      const data = await casinoApi.getBets(user.id, role || 'player');
      setAllBets(data);
    } catch (err) {
      console.warn('Error loading bets:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, role]);

  useEffect(() => {
    loadBets();

    if (!user?.id) return;

    // Realtime updates for user's bets
    const channel = supabase
      .channel(`user-bets-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
          ...(role === 'player' ? { filter: `user_id=eq.${user.id}` } : {}),
        },
        () => {
          loadBets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, loadBets, role]);

  const filteredBets = allBets.filter((bet) => {
    if (filter === 'all') return true;
    return bet.status === filter;
  });

  return (
    <div className="py-8 px-4 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-amber-500/20">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase mb-1">
            <Trophy className="w-4 h-4" />
            <span>سجل الرهانات الشخصي</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-white">
            رهاناتي <span className="gold-gradient-text">المسجلة</span>
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 text-xs font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'all' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            الكل ({allBets.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'pending' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            قيد الانتظار ({allBets.filter((b) => b.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('won')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'won' ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            الرابحة ({allBets.filter((b) => b.status === 'won').length})
          </button>
          <button
            onClick={() => setFilter('lost')}
            className={`px-3 py-1.5 rounded-xl transition-all ${
              filter === 'lost' ? 'bg-rose-500 text-white font-bold' : 'text-zinc-400 hover:text-white'
            }`}
          >
            الخاسرة ({allBets.filter((b) => b.status === 'lost').length})
          </button>
        </div>
      </div>

      {/* Bets List */}
      {loading ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#121218] border border-zinc-800/80">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">جاري تحميل سجل الرهانات من قاعدة البيانات...</p>
        </div>
      ) : filteredBets.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#121218] border border-zinc-800/80">
          <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">لا توجد رهانات في هذا القسم</h3>
          <p className="text-xs text-zinc-400">
            تصفح المباريات المفتوحة واختر فريقك لتسجيل أول رهان افتراضي!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBets.map((bet) => {
            const teamLabel =
              bet.selected_team === 'team_a'
                ? bet.match?.team_a || 'الفريق الأول'
                : bet.selected_team === 'team_b'
                ? bet.match?.team_b || 'الفريق الثاني'
                : 'تعادل';

            return (
              <div
                key={bet.id}
                className="p-5 rounded-2xl bg-[#121218] border border-zinc-800 hover:border-amber-500/30 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                      {bet.match?.league || 'دوري كرة القدم'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                        bet.status === 'won'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : bet.status === 'lost'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {bet.status === 'won' && <CheckCircle2 className="w-3 h-3" />}
                      {bet.status === 'lost' && <XCircle className="w-3 h-3" />}
                      {bet.status === 'pending' && <Clock className="w-3 h-3" />}
                      {bet.status === 'won'
                        ? 'ربح'
                        : bet.status === 'lost'
                        ? 'خسارة'
                        : 'قيد الانتظار'}
                    </span>
                  </div>

                  <div className="font-bold text-white text-base mb-2">
                    {bet.match?.team_a} <span className="text-amber-400 mx-1">VS</span> {bet.match?.team_b}
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs flex items-center justify-between">
                    <span className="text-zinc-400">الاختيار:</span>
                    <span className="font-bold text-amber-300">{teamLabel}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">مبلغ الرهان:</span>
                    <span className="font-bold font-mono text-white text-sm">
                      ${Number(bet.bet_amount ?? bet.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="text-zinc-500 block text-[10px]">المعامل (ODDS):</span>
                    <span className="font-bold font-mono text-amber-400">
                      x{Number(bet.odds).toFixed(2)}
                    </span>
                  </div>

                  <div className="text-left">
                    <span className="text-zinc-500 block text-[10px]">
                      {bet.status === 'won' ? 'الربح المحصل:' : 'الربح المتوقع:'}
                    </span>
                    <span
                      className={`font-bold font-mono text-sm ${
                        bet.status === 'won' ? 'text-emerald-400' : 'text-zinc-300'
                      }`}
                    >
                      ${Number(bet.potential_win).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
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
