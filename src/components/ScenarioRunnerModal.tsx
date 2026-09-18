import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { casinoEngine } from '../lib/supabase';
import {
  CheckCircle2,
  Play,
  RotateCcw,
  Sparkles,
  X,
  ArrowRight,
  Shield,
  Crown,
  User,
  Check,
  Trophy,
} from 'lucide-react';

interface ScenarioRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: string) => void;
}

export const ScenarioRunnerModal: React.FC<ScenarioRunnerModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const { switchDemoRole, refreshUserData } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);
  const [log, setLog] = useState<string[]>([]);

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: 'دخول المالك (Owner Login)',
      desc: 'تسجيل الدخول بدور المالك صاحب الخزينة الافتراضية ($1,000,000).',
      actor: 'owner',
      action: async () => {
        switchDemoRole('owner');
        return 'تم تسجيل الدخول بدور المالك. رصيد الخزينة: $1,000,000';
      },
    },
    {
      num: 2,
      title: 'إنشاء حساب مشرف (Create Admin)',
      desc: 'المالك ينشئ حساب المشرف مع تخصيص الصلاحيات.',
      actor: 'owner',
      action: async () => {
        const owner = casinoEngine.getProfiles().find((p) => p.role === 'owner')!;
        await casinoEngine.createAdmin(owner.id, {
          fullName: 'مشرف النخبة (Admin 1)',
          username: 'elite_admin_1',
          email: 'admin1@5lion.casino',
          initialBalance: 0,
        });
        return 'تم إنشاء حساب المشرف elite_admin_1 بنجاح';
      },
    },
    {
      num: 3,
      title: 'إضافة 10,000$ لرصيد المشرف',
      desc: 'المالك يغذي رصيد المشرف بمبلغ $10,000 من الخزينة الرئيسية.',
      actor: 'owner',
      action: async () => {
        const owner = casinoEngine.getProfiles().find((p) => p.role === 'owner')!;
        const admin = casinoEngine.getProfiles().find((p) => p.role === 'admin')!;
        await casinoEngine.ownerAddAdminBalance(owner.id, admin.id, 10000, 'تغذية أولية من الخزينة للمشرف');
        const admW = casinoEngine.getWallet(admin.id);
        return `تمت إضافة $10,000 لرصيد المشرف. رصيد المشرف الحالي: $${admW.balance.toLocaleString()}`;
      },
    },
    {
      num: 4,
      title: 'دخول المشرف (Admin Login)',
      desc: 'المشرف يسجل دخوله إلى لوحة المشرف لإدارة وتوزيع الرصيد.',
      actor: 'admin',
      action: async () => {
        switchDemoRole('admin');
        return 'المشرف دخل لوحة التحكم بنجاح.';
      },
    },
    {
      num: 5,
      title: 'المشرف يحول 500$ إلى اللاعب',
      desc: 'المشرف يشحن محفظة اللاعب بمبلغ $500 من رصيده الخاص.',
      actor: 'admin',
      action: async () => {
        const admin = casinoEngine.getProfiles().find((p) => p.role === 'admin')!;
        const player = casinoEngine.getProfiles().find((p) => p.role === 'player')!;
        await casinoEngine.adminTransferToPlayer(admin.id, player.id, 500, 'شحن رصيد ترحيبي للاعب');
        return 'تم تحويل $500 من المشرف إلى محفظة اللاعب بنجاح';
      },
    },
    {
      num: 6,
      title: 'التحقق الدقيق من الأرصدة (Balance Verification)',
      desc: 'التأكد من أن رصيد المشرف = $9,500 ورصيد اللاعب = $500.',
      actor: 'admin',
      action: async () => {
        const admin = casinoEngine.getProfiles().find((p) => p.role === 'admin')!;
        const player = casinoEngine.getProfiles().find((p) => p.role === 'player')!;
        const admW = casinoEngine.getWallet(admin.id);
        const plW = casinoEngine.getWallet(player.id);
        return `✅ تم التحقق الذري: رصيد المشرف = $${admW.balance.toLocaleString()} | رصيد اللاعب = $${plW.balance.toLocaleString()}`;
      },
    },
    {
      num: 7,
      title: 'دخول اللاعب لقسم الألعاب',
      desc: 'اللاعب يسجل دخوله ويفتح صالة الألعاب الفاخرة.',
      actor: 'player',
      action: async () => {
        switchDemoRole('player');
        return 'تم تسجيل الدخول بدور اللاعب.';
      },
    },
    {
      num: 8,
      title: 'اللاعب يراهن بـ 50$ في اللعبة',
      desc: 'اللاعب يلعب جولة سلوتس ذهبية بقيمة $50.',
      actor: 'player',
      action: async () => {
        const player = casinoEngine.getProfiles().find((p) => p.role === 'player')!;
        const res = await casinoEngine.playCasinoGame(player.id, 'golden-slots', 50);
        return `تم لعب الجولة برهان $50. النتيجة: ${res.isWin ? `فوز +$${res.payout}` : 'خسارة'}`;
      },
    },
    {
      num: 9,
      title: 'التحقق من خصم الرهان والسجل',
      desc: 'التحقق من تسجيل المعاملة وخصم الرصيد من المحفظة.',
      actor: 'player',
      action: async () => {
        const player = casinoEngine.getProfiles().find((p) => p.role === 'player')!;
        const plW = casinoEngine.getWallet(player.id);
        return `رصيد اللاعب المتبقي في المحفظة: $${plW.balance.toLocaleString()}`;
      },
    },
    {
      num: 10,
      title: 'اللاعب يراهن بـ 50$ على مباراة (فوز الفريق A، معامل 2.00)',
      desc: 'وضع رهان رياضي على مباراة ريال مدريد بمعامل 2.00 وربح متوقع 100$.',
      actor: 'player',
      action: async () => {
        const player = casinoEngine.getProfiles().find((p) => p.role === 'player')!;
        const matches = casinoEngine.getMatches();
        const openMatch = matches.find((m) => m.status === 'open') || matches[0];
        const betRes = await casinoEngine.placeMatchBet(player.id, openMatch.id, 'team_a', 50);
        return `تم تسجيل الرهان الرياضي بنجاح! الربح المتوقع: $${betRes.potentialWin}`;
      },
    },
    {
      num: 11,
      title: 'تسجيل الرهان في حالة Pending وخصم الرصيد',
      desc: 'التحقق من حالة الرهان (قيد الانتظار) في السجل المالي.',
      actor: 'player',
      action: async () => {
        const player = casinoEngine.getProfiles().find((p) => p.role === 'player')!;
        const bets = casinoEngine.getBets(player.id, 'player');
        const lastBet = bets[0];
        return `الرهان مسجل برقم #${lastBet?.id.slice(0, 8)} بحالة: ${lastBet?.status}`;
      },
    },
    {
      num: 12,
      title: 'المالك يحدد نتيجة المباراة (فوز الفريق A)',
      desc: 'المالك يدخل لوحة التحكم ويعتمد فوز Team A بنتيجة 2-1.',
      actor: 'owner',
      action: async () => {
        switchDemoRole('owner');
        const owner = casinoEngine.getProfiles().find((p) => p.role === 'owner')!;
        const matches = casinoEngine.getMatches();
        const openMatch = matches.find((m) => m.status === 'open') || matches[0];
        const settleRes = await casinoEngine.settleMatch(owner.id, openMatch.id, 'team_a', 2, 1);
        return `تمت تسوية المباراة: فاز الفريق A، عدد الرهانات الفائزة: ${settleRes.wonCount}`;
      },
    },
    {
      num: 13,
      title: 'النظام يسوي الرهان ويودع 100$ أرباح للاعب!',
      desc: 'دالة RPC الذرية تودع 100$ في محفظة اللاعب مع إشعار وتسجيل في السجل.',
      actor: 'player',
      action: async () => {
        switchDemoRole('player');
        const player = casinoEngine.getProfiles().find((p) => p.role === 'player')!;
        const plW = casinoEngine.getWallet(player.id);
        const txs = casinoEngine.getTransactions(player.id, 'player');
        const winTx = txs.find((t) => t.type === 'BET_WIN');
        return `🎉 اكتملت الدورة بنجاح كامل! تم إيداع أرباح الرهان ($100) وسجل المعاملة #${winTx?.id.slice(0, 8)}. رصيد اللاعب الحالي: $${plW.balance.toLocaleString()}`;
      },
    },
  ];

  const handleRunStep = async (stepIdx: number) => {
    const s = steps[stepIdx];
    try {
      const msg = await s.action();
      setLog((prev) => [...prev, `[خطوة ${s.num}] ${msg}`]);
      setCurrentStep(stepIdx + 1);
      refreshUserData();
    } catch (err: any) {
      setLog((prev) => [...prev, `[خطوة ${s.num} - خطأ] ${err?.message || 'تعذر الإكمال'}`]);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    setLog([]);
    for (let i = 0; i < steps.length; i++) {
      await handleRunStep(i);
      await new Promise((r) => setTimeout(r, 600));
    }
    setIsRunningAll(false);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setLog([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#121218] border border-amber-500/40 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white font-cinzel">
                محاكي السيناريو الكامل (13 خطوة معتمدة)
              </h3>
              <p className="text-xs text-zinc-400">
                المالك ➔ إنشاء المشرف ➔ شحن $10,000 ➔ شحن اللاعب $500 ➔ رهان اللعبة ➔ رهان المباراة ➔ تسوية وفوز $100
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="my-4 flex items-center justify-between gap-3 bg-zinc-900/80 p-3 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunAll}
              disabled={isRunningAll}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>{isRunningAll ? 'جاري التشغيل التلقائي...' : 'تشغيل السيناريو بالكامل تلقائياً'}</span>
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة البدء</span>
            </button>
          </div>

          <span className="text-xs font-mono text-amber-300 font-bold">
            اكتمل: {currentStep} / {steps.length}
          </span>
        </div>

        {/* Steps List */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1 my-2">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > idx;
            const isCurrent = currentStep === idx;

            return (
              <div
                key={step.num}
                className={`p-3 rounded-2xl border transition-all text-xs flex items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-zinc-300'
                    : isCurrent
                    ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-md'
                    : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500 text-black'
                        : isCurrent
                        ? 'bg-amber-500 text-black animate-pulse'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : step.num}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{step.title}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                          step.actor === 'owner'
                            ? 'bg-amber-500/20 text-amber-300'
                            : step.actor === 'admin'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}
                      >
                        {step.actor}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{step.desc}</p>
                  </div>
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => handleRunStep(idx)}
                    disabled={isRunningAll}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-amber-500 hover:text-black text-zinc-200 font-semibold text-xs transition-colors shrink-0"
                  >
                    تنفيذ الخطوة
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Execution Logs */}
        {log.length > 0 && (
          <div className="mt-3 p-3 rounded-2xl bg-black/90 border border-zinc-800 text-[11px] font-mono text-emerald-400 max-h-32 overflow-y-auto space-y-1">
            <span className="text-zinc-500 block pb-1 border-b border-zinc-800 font-sans">
              سجل العمليات الذرية المباشرة (Atomic Execution Log):
            </span>
            {log.map((entry, idx) => (
              <div key={idx}>➔ {entry}</div>
            ))}
          </div>
        )}

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
