import React, { useState } from 'react';
import { Match } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { casinoEngine } from '../lib/supabase';
import { Trophy, Clock, AlertCircle, CheckCircle2, X, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';

interface MatchesSectionProps {
  matches: Match[];
  onBetPlaced: () => void;
}

export const MatchesSection: React.FC<MatchesSectionProps> = ({ matches, onBetPlaced }) => {
  const { user, wallet, refreshUserData } = useAuth();
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'team_a' | 'team_b' | 'draw'>('team_a');
  const [betAmount, setBetAmount] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const openBetModal = (match: Match, team: 'team_a' | 'team_b' | 'draw') => {
    setSelectedMatch(match);
    setSelectedTeam(team);
    setBetAmount(50);
    setError(null);
    setSuccessMsg(null);
  };

  const getOdds = (match: Match, team: 'team_a' | 'team_b' | 'draw') => {
    if (team === 'team_a') return match.odds_team_a;
    if (team === 'team_b') return match.odds_team_b;
    return match.odds_draw || 3.0;
  };

  const currentOdds = selectedMatch ? getOdds(selectedMatch, selectedTeam) : 1.0;
  const potentialWin = Number((betAmount * currentOdds).toFixed(2));

  const handleConfirmBet = async () => {
    if (!user) {
      setError('يجب تسجيل الدخول لوضع رهان');
      return;
    }
    if (!selectedMatch) return;

    if (betAmount <= 0) {
      setError('يرجى إدخال قيمة رهان صالحة أكبر من 0');
      return;
    }

    if (!wallet || wallet.balance < betAmount) {
      setError(`الرصيد غير كافٍ. رصيدك الحالي: $${wallet ? wallet.balance.toLocaleString() : '0.00'}`);
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await casinoEngine.placeMatchBet(user.id, selectedMatch.id, selectedTeam, betAmount);
      refreshUserData();
      onBetPlaced();
      setSuccessMsg(`تم تسجيل الرهان بنجاح! الربح المتوقع: $${res.potentialWin.toLocaleString()}`);
      setTimeout(() => {
        setSelectedMatch(null);
        setSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'فشل تسجيل الرهان');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="matches-section" className="py-12 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-amber-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-widest uppercase mb-1">
            <Trophy className="w-4 h-4" />
            <span>المراهنات الرياضية الافتراضية</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-cinzel text-white">
            المباريات <span className="gold-gradient-text">القادمة</span>
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
          اختر مباراتك، حدد الفريق الفائز، وضع رهانك الافتراضي ($). تسوية فورية وتحديث الرصيد عند انتهاء المباراة.
        </p>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matches.map((match) => {
          const isClosed = match.status !== 'open' || new Date(match.match_time).getTime() <= Date.now();
          const matchDate = new Date(match.match_time).toLocaleDateString('ar-EG', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={match.id}
              className="rounded-3xl bg-[#121218] border border-amber-500/20 hover:border-amber-500/40 p-6 shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between"
            >
              {/* Top Details */}
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800 text-xs">
                  <span className="font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    {match.league}
                  </span>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{matchDate}</span>
                  </div>
                </div>

                {/* Teams VS Display */}
                <div className="flex items-center justify-between my-4 px-2">
                  {/* Team A */}
                  <div className="flex-1 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shadow-md mb-2">
                      ⚽
                    </div>
                    <span className="text-sm md:text-base font-bold text-white block">
                      {match.team_a}
                    </span>
                  </div>

                  {/* VS Emblem */}
                  <div className="px-4 text-center">
                    <span className="text-xs font-cinzel font-black text-amber-500/80 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                      VS
                    </span>
                    {match.status === 'settled' && (
                      <span className="block text-[11px] font-bold text-emerald-400 mt-1">
                        منتهية ({match.score_team_a ?? 0} - {match.score_team_b ?? 0})
                      </span>
                    )}
                  </div>

                  {/* Team B */}
                  <div className="flex-1 text-center">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl shadow-md mb-2">
                      🏆
                    </div>
                    <span className="text-sm md:text-base font-bold text-white block">
                      {match.team_b}
                    </span>
                  </div>
                </div>
              </div>

              {/* Odds Selection Buttons */}
              <div className="mt-4 pt-4 border-t border-zinc-800/80">
                {isClosed ? (
                  <div className="py-2.5 text-center bg-zinc-900/80 rounded-2xl text-xs font-semibold text-zinc-400 border border-zinc-800">
                    {match.status === 'settled'
                      ? `تمت تسوية المباراة (الفائز: ${match.winning_team === 'team_a' ? match.team_a : match.winning_team === 'team_b' ? match.team_b : 'تعادل'})`
                      : 'الرهانات مغلقة لهذه المباراة'}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => openBetModal(match, 'team_a')}
                      className="py-2.5 px-2 rounded-2xl bg-zinc-900/90 hover:bg-amber-500/20 hover:border-amber-400 border border-zinc-800 transition-all text-center group"
                    >
                      <span className="text-[11px] text-zinc-400 block group-hover:text-amber-200">
                        فوز 1
                      </span>
                      <span className="text-sm font-bold text-amber-300 font-mono">
                        {match.odds_team_a}
                      </span>
                    </button>

                    <button
                      onClick={() => openBetModal(match, 'draw')}
                      className="py-2.5 px-2 rounded-2xl bg-zinc-900/90 hover:bg-amber-500/20 hover:border-amber-400 border border-zinc-800 transition-all text-center group"
                    >
                      <span className="text-[11px] text-zinc-400 block group-hover:text-amber-200">
                        تعادل X
                      </span>
                      <span className="text-sm font-bold text-amber-300 font-mono">
                        {match.odds_draw || 3.0}
                      </span>
                    </button>

                    <button
                      onClick={() => openBetModal(match, 'team_b')}
                      className="py-2.5 px-2 rounded-2xl bg-zinc-900/90 hover:bg-amber-500/20 hover:border-amber-400 border border-zinc-800 transition-all text-center group"
                    >
                      <span className="text-[11px] text-zinc-400 block group-hover:text-amber-200">
                        فوز 2
                      </span>
                      <span className="text-sm font-bold text-amber-300 font-mono">
                        {match.odds_team_b}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bet Slip Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#111116] border border-amber-500/40 p-6 shadow-2xl shadow-black overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">تأكيد الرهان الرياضي</h3>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Match Summary */}
            <div className="my-4 p-4 rounded-2xl bg-[#181824] border border-amber-500/20 space-y-2">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>المباراة:</span>
                <span className="text-white font-semibold">
                  {selectedMatch.team_a} ضد {selectedMatch.team_b}
                </span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>اختيارك:</span>
                <span className="text-amber-300 font-bold">
                  {selectedTeam === 'team_a'
                    ? selectedMatch.team_a
                    : selectedTeam === 'team_b'
                    ? selectedMatch.team_b
                    : 'التعادل'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-zinc-400">
                <span>معامل الرهان (Odds):</span>
                <span className="text-white font-mono font-bold text-sm bg-zinc-900 px-2 py-0.5 rounded">
                  {currentOdds}
                </span>
              </div>
            </div>

            {/* Bet Amount Input */}
            <div className="space-y-3 mb-4">
              <label className="block text-xs text-zinc-300">
                قيمة الرهان الافتراضية ($):
              </label>
              <div className="flex items-center gap-2">
                {[10, 25, 50, 100, 250, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setBetAmount(val)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      betAmount === val
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-400 font-bold font-mono">
                  $
                </span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={betAmount}
                  onChange={(e) => setBetAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full py-3 px-4 pl-8 rounded-2xl bg-zinc-900 border border-zinc-700 text-white font-mono text-base focus:outline-none focus:border-amber-400 text-right"
                />
              </div>
            </div>

            {/* Potential Win Calculation Display */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/30 mb-5 flex items-center justify-between">
              <div>
                <span className="text-xs text-amber-400/90 block font-semibold">
                  الربح الافتراضي المتوقع (Potential Win):
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  ${betAmount} × {currentOdds}
                </span>
              </div>
              <span className="text-xl font-black text-amber-300 font-mono">
                ${potentialWin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Error / Success Feedback */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedMatch(null)}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmBet}
                disabled={isSubmitting || betAmount <= 0}
                className="flex-2 py-3.5 px-6 rounded-2xl font-bold text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التأكيد...</span>
                  </>
                ) : (
                  <span>تأكيد الرهان (${betAmount})</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
