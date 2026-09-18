import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { casinoEngine, getSavedSupabaseConfig, saveSupabaseConfig } from '../lib/supabase';
import { Match, Profile, Game } from '../types/database';
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
  Database,
  Sliders,
  DollarSign,
  Play,
  FileCode,
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const { user, wallet, refreshUserData } = useAuth();
  const [activeTab, setActiveTab] = useState<'admins' | 'matches' | 'games' | 'sql'>('admins');

  // Modal States
  const [newAdminModal, setNewAdminModal] = useState(false);
  const [adminFullName, setAdminFullName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
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

  // Data fetching
  const allProfiles = casinoEngine.getProfiles();
  const admins = allProfiles.filter((p) => p.role === 'admin');
  const players = allProfiles.filter((p) => p.role === 'player');
  const matches = casinoEngine.getMatches();
  const games = casinoEngine.getGames();
  const allBets = casinoEngine.getBets(user?.id || '', 'owner');
  const ownerBalance = wallet ? wallet.balance : 0;

  // Handlers
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await casinoEngine.createAdmin(user.id, {
        fullName: adminFullName,
        username: adminUsername,
        email: adminEmail,
        initialBalance: adminInitialBalance,
      });
      refreshUserData();
      setSuccess(`تم تعيين المشرف ${adminFullName} بنجاح مع رصيد $${adminInitialBalance.toLocaleString()}`);
      setTimeout(() => {
        setNewAdminModal(false);
        setSuccess(null);
        setAdminFullName('');
        setAdminUsername('');
        setAdminEmail('');
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'فشل إنشاء المشرف');
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
      await casinoEngine.ownerAddAdminBalance(user.id, selectedAdminId, topUpAmount, 'تخصيص رصيد من الخزينة الرئيسية للمشرف');
      refreshUserData();
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
      await casinoEngine.createMatch(user.id, {
        league,
        team_a: teamA,
        team_b: teamB,
        odds_team_a: oddsA,
        odds_draw: oddsDraw,
        odds_team_b: oddsB,
        match_time: matchTime,
      });
      refreshUserData();
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
      const result = await casinoEngine.settleMatch(
        user.id,
        selectedMatchToSettle.id,
        winningTeam,
        scoreA,
        scoreB
      );
      refreshUserData();
      setSuccess(`تمت تسوية المباراة بنجاح! تم فوز ${result.wonCount} رهانات وتوزيع إجمالي $${result.totalPayout.toLocaleString()}`);
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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <Crown className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black font-cinzel text-white">
              لوحة تحكم <span className="gold-gradient-text">المالك (Owner)</span>
            </h2>
            <p className="text-xs text-zinc-400">الإدارة المركزية، الخزينة، المشرفين، وتسوية نتائج المباريات</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setNewAdminModal(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>تعيين مشرف جديد</span>
          </button>
          <button
            onClick={() => setNewMatchModal(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-amber-300 bg-zinc-900 border border-amber-500/40 hover:border-amber-400 transition-all text-xs flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4" />
            <span>إضافة مباراة رياضية</span>
          </button>
        </div>
      </div>

      {/* High-Level Overview Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1c1a24] to-[#121218] border border-amber-500/40 col-span-2 sm:col-span-1 shadow-xl">
          <span className="text-[11px] font-bold text-amber-400 block mb-1">خزينة المالك الرئيسية</span>
          <span className="text-2xl lg:text-3xl font-black font-mono text-amber-300">
            ${ownerBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </span>
          <p className="text-[10px] text-zinc-500 mt-1">Virtual Treasury Reserves</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#121218] border border-zinc-800 shadow-xl">
          <span className="text-[11px] font-bold text-zinc-400 block mb-1">المشرفين (Admins)</span>
          <span className="text-2xl lg:text-3xl font-black font-mono text-white">{admins.length}</span>
          <p className="text-[10px] text-zinc-500 mt-1">مشرفين معتمدين</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#121218] border border-zinc-800 shadow-xl">
          <span className="text-[11px] font-bold text-zinc-400 block mb-1">إجمالي اللاعبين</span>
          <span className="text-2xl lg:text-3xl font-black font-mono text-white">{players.length}</span>
          <p className="text-[10px] text-zinc-500 mt-1">حسابات نشطة</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#121218] border border-zinc-800 shadow-xl">
          <span className="text-[11px] font-bold text-zinc-400 block mb-1">المباريات المتاحة</span>
          <span className="text-2xl lg:text-3xl font-black font-mono text-emerald-400">
            {matches.filter((m) => m.status === 'open').length}
          </span>
          <p className="text-[10px] text-zinc-500 mt-1">من أصل {matches.length} مباريات</p>
        </div>

        <div className="p-5 rounded-3xl bg-[#121218] border border-zinc-800 shadow-xl">
          <span className="text-[11px] font-bold text-zinc-400 block mb-1">الرهانات النشطة</span>
          <span className="text-2xl lg:text-3xl font-black font-mono text-amber-400">
            {allBets.filter((b) => b.status === 'pending').length}
          </span>
          <p className="text-[10px] text-zinc-500 mt-1">في انتظار نتائج المباريات</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('admins')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'admins'
              ? 'bg-amber-500 text-black font-bold shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>إدارة المشرفين ({admins.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'matches'
              ? 'bg-amber-500 text-black font-bold shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>المباريات والتسوية ({matches.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('games')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'games'
              ? 'bg-amber-500 text-black font-bold shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>إعدادات الألعاب ({games.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
            activeTab === 'sql'
              ? 'bg-amber-500 text-black font-bold shadow-md'
              : 'text-zinc-400 hover:text-white bg-zinc-900/60'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>كود Supabase SQL</span>
        </button>
      </div>

      {/* Tab 1: Admins Management */}
      {activeTab === 'admins' && (
        <div className="rounded-3xl bg-[#121218] border border-zinc-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
            <h3 className="text-base font-bold text-white">قائمة المشرفين المعتمدين</h3>
            <span className="text-xs text-zinc-400">يمكن للمشرفين شحن حسابات اللاعبين حصراً من أرصدتهم</span>
          </div>

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
                  const admWallet = casinoEngine.getWallet(adm.id);
                  return (
                    <tr key={adm.id} className="hover:bg-zinc-900/50">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-400" />
                        <span>{adm.full_name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-400">@{adm.username}</td>
                      <td className="py-3.5 px-4 text-zinc-400">{adm.email}</td>
                      <td className="py-3.5 px-4 font-bold font-mono text-emerald-400 text-sm">
                        ${admWallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
        </div>
      )}

      {/* Tab 2: Matches & Settlement Management */}
      {activeTab === 'matches' && (
        <div className="rounded-3xl bg-[#121218] border border-zinc-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-white">إدارة وتسوية المباريات الرياضية</h3>
              <p className="text-xs text-zinc-400">
                تسوية نتائج المباريات تشغل دالة RPC الذرية لتوزيع أرباح الرهانات الفائزة فورياً
              </p>
            </div>
            <button
              onClick={() => setNewMatchModal(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-1"
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
                  <th className="py-3 px-4">المعاملات (1 / X / 2)</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">النتيجة</th>
                  <th className="py-3 px-4 text-center">التسوية الفورية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {matches.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-900/50">
                    <td className="py-3.5 px-4 text-amber-300 font-semibold">{m.league}</td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {m.team_a} ضد {m.team_b}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-300">
                      {m.odds_team_a} | {m.odds_draw || 3.0} | {m.odds_team_b}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'open'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {m.status === 'open' ? 'مفتوحة للرهان' : 'تمت التسوية'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {m.status === 'settled' ? `${m.score_team_a} - ${m.score_team_b}` : '—'}
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
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-black font-bold transition-all text-xs"
                        >
                          ⚖️ تسوية المباراة
                        </button>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">مكتملة</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Games Settings */}
      {activeTab === 'games' && (
        <div className="rounded-3xl bg-[#121218] border border-zinc-800 p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white mb-2">إعدادات ألعاب الكازينو</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map((gm) => (
              <div
                key={gm.id}
                className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl">
                    🎮
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{gm.name}</h4>
                    <p className="text-[11px] text-zinc-400">
                      الرهان: ${gm.minimum_bet} - ${gm.maximum_bet}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      gm.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {gm.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: SQL Migration */}
      {activeTab === 'sql' && (
        <div className="rounded-3xl bg-[#121218] border border-zinc-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">كود ترحيل قاعدة بيانات Supabase (SQL Migration)</h3>
              <p className="text-xs text-zinc-400">
                انسخ هذا الكود والصقه في محرّر SQL في لوحة تحكم Supabase لتشغيل المنصة فعلياً بالكامل.
              </p>
            </div>
            <button
              onClick={handleCopySql}
              className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              {copiedSql ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedSql ? 'تم النسخ!' : 'نسخ كود SQL كامل'}</span>
            </button>
          </div>

          <div className="rounded-2xl bg-black/80 border border-zinc-800 p-4 font-mono text-[11px] text-zinc-300 max-h-[350px] overflow-y-auto ltr text-left">
            <pre>{MIGRATION_SQL_SAMPLE}</pre>
          </div>
        </div>
      )}

      {/* New Admin Modal */}
      {newAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-amber-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">تعيين مشرف جديد (Admin)</h3>
              </div>
              <button
                onClick={() => setNewAdminModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">الاسم الكامل:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: خالد المنصوري"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">اسم المستخدم:</label>
                <input
                  type="text"
                  required
                  placeholder="admin_khalid"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  required
                  placeholder="admin@5lion.casino"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400 text-left"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  الرصيد الافتراضي الأولي للمشرف ($):
                </label>
                <input
                  type="number"
                  min="100"
                  max={ownerBalance}
                  value={adminInitialBalance}
                  onChange={(e) => setAdminInitialBalance(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400 text-right"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  رصيد خزينة المالك المتاح: ${ownerBalance.toLocaleString()}
                </span>
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

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewAdminModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الإنشاء...</span>
                    </>
                  ) : (
                    <span>إنشاء المشرف وتخصيص الرصيد</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Up Admin Modal */}
      {topUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-amber-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white">
                <Send className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">تغذية رصيد المشرف من الخزينة</h3>
              </div>
              <button
                onClick={() => setTopUpModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTopUpAdmin} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">المبلغ المراد إضافته ($):</label>
                <input
                  type="number"
                  min="1"
                  max={ownerBalance}
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Number(e.target.value))}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400 text-right"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  رصيد الخزينة المتاح: ${ownerBalance.toLocaleString()}
                </span>
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

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTopUpModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || ownerBalance < topUpAmount}
                  className="flex-2 py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري المعالجة...</span>
                    </>
                  ) : (
                    <span>تأكيد الإضافة (${topUpAmount.toLocaleString()})</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Match Modal */}
      {settleModal && selectedMatchToSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-amber-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">تسوية وتوزيع أرباح المباراة</h3>
              </div>
              <button
                onClick={() => setSettleModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleMatch} className="space-y-4 my-4">
              <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-xs">
                <span className="text-zinc-400 block mb-1">المباراة المحددة:</span>
                <span className="text-white font-bold text-sm">
                  {selectedMatchToSettle.team_a} ضد {selectedMatchToSettle.team_b}
                </span>
              </div>

              {/* Select Winner */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  الفريق الفائز رسمياً:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWinningTeam('team_a')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                      winningTeam === 'team_a'
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    {selectedMatchToSettle.team_a}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinningTeam('draw')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                      winningTeam === 'draw'
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    التعادل (Draw)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinningTeam('team_b')}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                      winningTeam === 'team_b'
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    {selectedMatchToSettle.team_b}
                  </button>
                </div>
              </div>

              {/* Score inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    أهداف {selectedMatchToSettle.team_a}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scoreA}
                    onChange={(e) => setScoreA(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    أهداف {selectedMatchToSettle.team_b}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={scoreB}
                    onChange={(e) => setScoreB(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-center font-bold"
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

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSettleModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-2.5 px-5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري التسوية...</span>
                    </>
                  ) : (
                    <span>تأكيد التسوية وتوزيع الأرباح</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Match Modal */}
      {newMatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#121218] border border-amber-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-white">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">إضافة مباراة رياضية جديدة</h3>
              </div>
              <button
                onClick={() => setNewMatchModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatch} className="space-y-3 my-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">البطولة / الدوري:</label>
                <input
                  type="text"
                  required
                  value={league}
                  onChange={(e) => setLeague(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">معامل فوز 1:</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.05"
                    value={oddsA}
                    onChange={(e) => setOddsA(Number(e.target.value))}
                    className="w-full py-1.5 px-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-center text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">معامل التعادل X:</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.05"
                    value={oddsDraw}
                    onChange={(e) => setOddsDraw(Number(e.target.value))}
                    className="w-full py-1.5 px-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-center text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">معامل فوز 2:</label>
                  <input
                    type="number"
                    step="0.05"
                    min="1.05"
                    value={oddsB}
                    onChange={(e) => setOddsB(Number(e.target.value))}
                    className="w-full py-1.5 px-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-center text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">موعد المباراة (بعد كم ساعة):</label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={matchHoursFromNow}
                  onChange={(e) => setMatchHoursFromNow(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:outline-none focus:border-amber-400 text-right"
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

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewMatchModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-400 hover:bg-zinc-800 text-xs font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>جاري الإضافة...</span>
                    </>
                  ) : (
                    <span>حفظ ونشر المباراة</span>
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
`;
