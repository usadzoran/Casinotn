import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { casinoEngine } from '../lib/supabase';
import { Bet } from '../types/database';
import { Trophy, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const MyBets: React.FC = () => {
  const { user, role } = useAuth();
  const [filter, setFilter] = useState<'all' | 'pending' | 'won' | 'lost'>('all');

  const allBets = user ? casinoEngine.getBets(user.id, role || 'player') : [];

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
      {filteredBets.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-[#121218] border border-zinc-800/80">
          <Trophy className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">لا توجد رهانات في هذا القسم</h3>
          <p className="text-xs text-zinc-400">
            تصفح المباريات المفتوحة واختر فريقك لتسجيل أول رهان افتراضي!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBets.map((bet) => {
            const formattedDate = new Date(bet.created_at).toLocaleDateString('ar-EG', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={bet.id}
                className="p-5 rounded-3xl bg-[#121218] border border-amber-500/20 hover:border-amber-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Match and Choice */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {bet.match ? `${bet.match.team_a} ضد ${bet.match.team_b}` : 'مباراة رياضية'}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">({bet.match?.league})</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span>اختيارك:</span>
                    <span className="font-bold text-amber-300">
                      {bet.selected_team === 'team_a'
                        ? bet.match?.team_a
                        : bet.selected_team === 'team_b'
                        ? bet.match?.team_b
                        : 'التعادل'}
                    </span>
                    <span>•</span>
                    <span>معامل الرهان:</span>
                    <span className="font-mono font-bold text-white">{bet.odds}</span>
                  </div>
                </div>

                {/* Amounts */}
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <span className="text-[11px] text-zinc-400 block">قيمة الرهان</span>
                    <span className="text-sm font-bold text-white font-mono">
                      ${bet.bet_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-zinc-400 block">الربح المتوقع</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      ${bet.potential_win.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {bet.status === 'pending' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5" />
                        قيد الانتظار
                      </span>
                    )}
                    {bet.status === 'won' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        فوز رابح (+${bet.potential_win})
                      </span>
                    )}
                    {bet.status === 'lost' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <XCircle className="w-3.5 h-3.5" />
                        خسارة
                      </span>
                    )}
                    {bet.status === 'cancelled' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400">
                        ملغي (تم الاسترداد)
                      </span>
                    )}
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
