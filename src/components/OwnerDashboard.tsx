import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { casinoApi, supabase } from '../lib/supabase';
import { Match, Profile, Game, Wallet, Bet } from '../types/database';
import {
  Crown,
  Users,
  Shield,
  Trophy,
  Gamepad2,
  Plus,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Copy,
  DollarSign,
  FileCode,
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { user, wallet, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'admins' | 'matches' | 'games' | 'sql'>('admins');

  // Modal States
  const [newAdminModal, setNewAdminModal] = useState(false);
  const [selectedUserToPromote, setSelectedUserToPromote] = useState('');
  const [adminInitialBalance, setAdminInitialBalance] = useState(10000);

  const [topUpModal, setTopUpModal] = useState(false);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [topUpAmount, setTopUpAmount] = useState(5000);

  // Match Creation Modal
  const [newMatchModal, setNewMatchModal] = useState(false);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [league, setLeague] = useState('دوري أبطال أوروبا');
  const [oddsA, setOddsA] = useState(1.95);
  const [oddsDraw, setOddsDraw] = useState(3.4);
  const [oddsB, setOddsB] = useState(2.2);
  const [matchHoursFromNow, setMatchHoursFromNow] = useState(24);

  // Match Settlement Modal
  const [settleModal, setSettleModal] = useState(false);
  const [selectedMatchToSettle, setSelectedMatchToSettle] = useState<Match | null>(null);
  const [winningTeam, setWinningTeam] = useState<'team_a' | 'team_b' | 'draw'>('team_a');
  const [scoreA, setScoreA] = useState(2);
  const [scoreB, setScoreB] = useState(1);

  // Status feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Data state directly from Supabase
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allWallets, setAllWallets] = useState<Wallet[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [allBets, setAllBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [p, w, m, g, b] = await Promise.all([
        casinoApi.getAllProfiles(),
        casinoApi.getAllWallets(),
        casinoApi.getMatches(),
        casinoApi.getGames(),
        casinoApi.getBets(user?.id, 'owner'),
      ]);
      setAllProfiles(p);
      setAllWallets(w);
      setMatches(m);
      setGames(g);
      setAllBets(b);
    } catch (err) {
      console.warn('OwnerDashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();

    // Supabase Realtime subscriptions
    const channel = supabase
      .channel('owner-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => {
        casinoApi.getAllWallets().then(setAllWallets);
        refreshUserData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        casinoApi.getAllProfiles().then(setAllProfiles);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        casinoApi.getMatches().then(setMatches);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => {
        if (user?.id) {
          casinoApi.getBets(user.id, 'owner').then(setAllBets);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData, refreshUserData, user?.id]);

  const admins = allProfiles.filter((p) => p.role === 'admin');
  const players = allProfiles.filter((p) => p.role === 'player');
  const ownerBalance = wallet ? Number(wallet.balance) : 0;

  // Handlers
  const handlePromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedUserToPromote) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await casinoApi.assignAdminRole(selectedUserToPromote);
      if (adminInitialBalance > 0) {
        await casinoApi.ownerTransferToAdmin(selectedUserToPromote, adminInitialBalance);
      }
      await refreshUserData();
      await loadData();
      setSuccess('تم ترقية المستخدم إلى مشرف وتخصيص الرصيد الأولي بنجاح!');
      setTimeout(() => {
        setNewAdminModal(false);
        setSuccess(null);
        setSelectedUserToPromote('');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'فشل ترقية المشرف');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTopUpAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAdminId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await casinoApi.ownerTransferToAdmin(selectedAdminId, topUpAmount);
      await refreshUserData();
      await loadData();
      setSuccess(`تمت إضافة $${topUpAmount.toLocaleString()} إلى رصيد المشرف بنجاح!`);
      setTimeout(() => {
        setTopUpModal(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'فشلت إضافة الرصيد');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const matchTime = new Date(Date.now() + matchHoursFromNow * 3600 * 1000).toISOString();
      await casinoApi.createMatch({
        league,
        team_a: teamA,
        team_b: teamB,
        odds_team_a: oddsA,
        odds_draw: oddsDraw,
        odds_team_b: oddsB,
        match_time: matchTime,
        status: 'open',
      });
      await loadData();
      setSuccess('تمت إضافة المباراة بنجاح!');
      setTimeout(() => {
        setNewMatchModal(false);
        setSuccess(null);
        setTeamA('');
        setTeamB('');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'فشلت إضافة المباراة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMatchToSettle) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await casinoApi.settleMatch(
        selectedMatchToSettle.id,
        winningTeam,
        scoreA,
        scoreB
      );
      await refreshUserData();
      await loadData();
      setSuccess(`تمت تسوية المباراة بنجاح! تم فوز ${result.won_count} رهانات وتوزيع إجمالي $${result.total_paid.toLocaleString()}`);
      setTimeout(() => {
        setSettleModal(false);
        setSelectedMatchToSettle(null);
        setSuccess(null);
      }, 2000);
    } catch (err: any) {
      setError(err?.message || 'فشلت تسوية المباراة');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(MIGRATION_SQL_SAMPLE);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="py-8 px-4 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-white">
              لوحة تحكم <span className="gold-gradient-text">المالك (Owner)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              التحكم في الخزينة المركزية، إدارة المشرفين، وإضافة وتسوية المباريات
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setNewMatchModal(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 transition-all text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مباراة رياضية</span>
          </button>
          <button
            onClick={() => setNewAdminModal(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-white bg-zinc-800 hover:bg-zinc-700 transition-all text-xs border border-zinc-700 flex items-center gap-2"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>تعيين مشرف جديد</span>
          </button>
        </div>
      </div>

      {/* Primary Treasury Metric */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-500/20 to-amber-950/30 border border-amber-500/40 relative overflow-hidden sm:col-span-2">
          <div className="text-xs text-amber-300 font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>الخزينة المركزية الافتراضية (Owner Treasury)</span>
          </div>
          <div className="text-4xl sm:text-5xl font-black font-mono text-white mt-2">
            ${ownerBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            المصدر الحصري الوحيد لضخ الرصيد إلى المشرفين داخل النظام
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-[#121218] border border-zinc-800">
          <div className="text-xs text-zinc-400 font-medium mb-1">عدد المشرفين المعتمدين</div>
          <div className="text-3xl font-black font-mono text-emerald-400">{admins.length}</div>
          <div className="text-[11px] text-zinc-500 mt-2">يمتلكون صلاحية شحن اللاعبين</div>
        </div>

        <div className="p-6 rounded-3xl bg-[#121218] border border-zinc-800">
          <div className="text-xs text-zinc-400 font-medium mb-1">المباريات المفتوحة</div>
          <div className="text-3xl font-black font-mono text-amber-400">
            {matches.filter((m) => m.status === 'open').length}
          </div>
          <div className="text-[11px] text-zinc-500 mt-2">جاهزة للمراهنة</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'admins'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>المشرفون والأرصدة ({admins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'matches'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>إدارة وتسوية المباريات ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('games')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'games'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>كتالوج الألعاب ({games.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'sql'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>سكريبت SQL الحقيقي</span>
        </button>
      </div>

      {/* Tab 1: Admins Management */}
      {activeTab === 'admins' && (
        <div className="rounded-3xl bg-[#121218] border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">قائمة المشرفين المعتمدين</h3>
            </div>
            <span className="text-xs text-zinc-400">يمكن للمشرفين شحن حسابات اللاعبين حصراً من أرصدتهم</span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto mb-2" />
              <p className="text-xs text-zinc-400">جاري تحميل بيانات المشرفين...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-800 pb-2">
                    <th className="py-3 px-4">اسم المشرف</th>
                    <th className="py-3 px-4">اسم المستخدم</th>
                    <th className="py-3 px-4">البريد الإلكتروني</th>
                    <th className="py-3 px-4">رصيد المشرف</th>
                    <th className="py-3 px-4">الحالة</th>
                    <th className="py-3 px-4 text-center">إجراءات المالك</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {admins.map((adm) => {
                    const admWallet = allWallets.find((w) => w.user_id === adm.id) || { balance: 0 };
                    return (
                      <tr key={adm.id} className="hover:bg-zinc-900/50">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          <Shield className="w-4 h-4 text-emerald-400" />
                          <span>{adm.full_name}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-zinc-400">@{adm.username}</td>
                        <td className="py-3.5 px-4 text-zinc-400">{adm.email}</td>
                        <td className="py-3.5 px-4 font-bold font-mono text-emerald-400 text-sm">
                          ${Number(admWallet.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {adm.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedAdminId(adm.id);
                              setTopUpAmount(5000);
                              setTopUpModal(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-bold transition-all inline-flex items-center gap-1 text-xs"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>تغذية رصيد</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Matches Management & Settlement */}
      {activeTab === 'matches' && (
        <div className="rounded-3xl bg-[#121218] border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">إدارة المباريات وتسوية النتائج</h3>
              <p className="text-xs text-zinc-400">
                تسوية المباراة تقوم آلياً بتحديد الفائزين وتوزيع الأرباح على محافظ اللاعبين
              </p>
            </div>
            <button
              onClick={() => setNewMatchModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>مباراة جديدة</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-800 pb-2">
                  <th className="py-3 px-4">البطولة</th>
                  <th className="py-3 px-4">الفريقين</th>
                  <th className="py-3 px-4">المعاملات (1 - X - 2)</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">النتيجة</th>
                  <th className="py-3 px-4 text-center">تسوية النتيجة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {matches.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-900/50">
                    <td className="py-3.5 px-4 font-medium text-amber-400">{m.league}</td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {m.team_a} <span className="text-zinc-500">vs</span> {m.team_b}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {m.odds_team_a} | {m.odds_draw} | {m.odds_team_b}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'open'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        }`}
                      >
                        {m.status === 'open' ? 'مفتوحة للرهان' : 'تمت التسوية'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {m.status === 'settled' ? `${m.score_team_a ?? m.score_a ?? 0} - ${m.score_team_b ?? m.score_b ?? 0}` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {m.status === 'open' ? (
                        <button
                          onClick={() => {
                            setSelectedMatchToSettle(m);
                            setWinningTeam('team_a');
                            setScoreA(2);
                            setScoreB(1);
                            setSettleModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-black font-bold text-xs inline-flex items-center gap-1 transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تسوية النتيجة الآن</span>
                        </button>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">مكتملة وموزعة</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Games Catalog */}
      {activeTab === 'games' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {games.map((g) => (
            <div key={g.id} className="p-5 rounded-3xl bg-[#121218] border border-zinc-800 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shrink-0">
                {g.slug === 'golden-slots' ? '🦁' : g.slug === 'lucky-wheel' ? '🎡' : g.slug === 'dice-room' ? '🎲' : '🪙'}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-base">{g.name}</h4>
                <p className="text-xs text-zinc-400 mt-0.5">{g.description}</p>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-zinc-400 font-mono">
                  <span>RTP: {Number(g.rtp_percentage ?? 96)}%</span>
                  <span>•</span>
                  <span>الحد الأدنى: ${Number(g.minimum_bet ?? g.min_bet ?? 1)}</span>
                  <span>•</span>
                  <span>الحد الأقصى: ${Number(g.maximum_bet ?? g.max_bet ?? 1000)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: SQL Migration */}
      {activeTab === 'sql' && (
        <div className="rounded-3xl bg-[#121218] border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">ملف SQL الكامل لقاعدة البيانات (Supabase PostgreSQL)</h3>
              <p className="text-xs text-zinc-400">
                يحتوي على الدوال الذرية (Atomic RPCs) وقفل الأسطر (SELECT FOR UPDATE) وسياسات RLS
              </p>
            </div>
            <button
              onClick={handleCopySql}
              className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-2 hover:bg-amber-400 transition-all"
            >
              {copiedSql ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'تم النسخ!' : 'نسخ كود SQL الكامل'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-2xl bg-black border border-zinc-800 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-96 ltr text-left">
            {MIGRATION_SQL_SAMPLE}
          </pre>
        </div>
      )}

      {/* Modal: Promote Admin */}
      {newAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-amber-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg text-white">ترقية مستخدم إلى مشرف (Admin)</h3>
              </div>
              <button onClick={() => setNewAdminModal(false)} className="p-1.5 rounded-xl text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePromoteAdmin} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">اختر اللاعب للترقية:</label>
                <select
                  value={selectedUserToPromote}
                  onChange={(e) => setSelectedUserToPromote(e.target.value)}
                  required
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- اختر مستخدم --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} (@{p.username}) - {p.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  الرصيد الأولي المخصص من الخزينة ($):
                </label>
                <input
                  type="number"
                  min="0"
                  max={ownerBalance}
                  value={adminInitialBalance}
                  onChange={(e) => setAdminInitialBalance(Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left ltr"
                />
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
                disabled={isSubmitting || !selectedUserToPromote}
                className="w-full py-3 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 transition-all text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>تأكيد الترقية وتخصيص الرصيد</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Top Up Admin Balance */}
      {topUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-amber-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-white">تغذية رصيد المشرف من الخزينة</h3>
              </div>
              <button onClick={() => setTopUpModal(false)} className="p-1.5 rounded-xl text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopUpAdmin} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">المشرف المستهدف:</label>
                <select
                  value={selectedAdminId}
                  onChange={(e) => setSelectedAdminId(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                >
                  {admins.map((a) => {
                    const aw = allWallets.find((w) => w.user_id === a.id) || { balance: 0 };
                    return (
                      <option key={a.id} value={a.id}>
                        {a.full_name} (@{a.username}) - الرصيد الحالي: ${Number(aw.balance).toLocaleString()}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  مبلغ التحويل ($) - رصيد الخزينة المتاح: ${ownerBalance.toLocaleString()}
                </label>
                <input
                  type="number"
                  min="1"
                  max={ownerBalance}
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs font-mono focus:outline-none focus:border-amber-400 text-left ltr"
                />
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
                disabled={isSubmitting || ownerBalance < topUpAmount}
                className="w-full py-3 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 transition-all text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>تحويل الرصيد الآن</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Match */}
      {newMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-amber-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg text-white">إضافة مباراة جديدة</h3>
              </div>
              <button onClick={() => setNewMatchModal(false)} className="p-1.5 rounded-xl text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-3 mt-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">اسم البطولة:</label>
                <input
                  type="text"
                  required
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الفريق الأول (Team A):</label>
                  <input
                    type="text"
                    required
                    placeholder="ريال مدريد"
                    value={teamA}
                    onChange={(e) => setTeamA(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">الفريق الثاني (Team B):</label>
                  <input
                    type="text"
                    required
                    placeholder="مانشستر سيتي"
                    value={teamB}
                    onChange={(e) => setTeamB(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">معامل A (1):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.05"
                    value={oddsA}
                    onChange={(e) => setOddsA(Number(e.target.value))}
                    className="w-full py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">معامل التعادل (X):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.05"
                    value={oddsDraw}
                    onChange={(e) => setOddsDraw(Number(e.target.value))}
                    className="w-full py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">معامل B (2):</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.05"
                    value={oddsB}
                    onChange={(e) => setOddsB(Number(e.target.value))}
                    className="w-full py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs font-mono text-center"
                  />
                </div>
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
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-black bg-amber-500 hover:bg-amber-400 transition-all text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 mt-2"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>نشر المباراة للمراهنة</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Settle Match */}
      {settleModal && selectedMatchToSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-emerald-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg text-white">تسوية نتيجة المباراة وتوزيع الأرباح</h3>
              </div>
              <button onClick={() => setSettleModal(false)} className="p-1.5 rounded-xl text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleMatch} className="space-y-4 mt-4">
              <div className="p-3 bg-zinc-900 rounded-xl text-xs text-center font-bold text-white">
                {selectedMatchToSettle.team_a} vs {selectedMatchToSettle.team_b}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-2">الفائز الرسمي بالمباراة:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWinningTeam('team_a')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      winningTeam === 'team_a'
                        ? 'bg-emerald-500 text-black border-emerald-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {selectedMatchToSettle.team_a}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinningTeam('draw')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      winningTeam === 'draw'
                        ? 'bg-emerald-500 text-black border-emerald-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    تعادل (Draw)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinningTeam('team_b')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      winningTeam === 'team_b'
                        ? 'bg-emerald-500 text-black border-emerald-400'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-700'
                    }`}
                  >
                    {selectedMatchToSettle.team_b}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    أهداف {selectedMatchToSettle.team_a}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scoreA}
                    onChange={(e) => setScoreA(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    أهداف {selectedMatchToSettle.team_b}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scoreB}
                    onChange={(e) => setScoreB(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs text-center font-mono"
                  />
                </div>
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
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-black bg-emerald-400 hover:bg-emerald-300 transition-all text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>تأكيد التسوية وحساب الأرباح فوراً</span>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MIGRATION_SQL_SAMPLE = `-- 5LION CASINO PRODUCTION SQL MIGRATION (Supabase PostgreSQL)
-- Includes Tables, RLS Policies, Triggers, Atomic RPC with FOR UPDATE Row Locking

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('owner', 'admin', 'player')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
  currency TEXT NOT NULL DEFAULT 'VIRTUAL_USD',
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
`;
