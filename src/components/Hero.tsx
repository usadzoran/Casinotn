import React from 'react';
import { Sparkles, Trophy, ShieldCheck, Flame, ChevronLeft } from 'lucide-react';

interface HeroProps {
  onExploreGames: () => void;
  onViewMatches: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreGames, onViewMatches }) => {
  return (
    <section className="relative overflow-hidden py-12 md:py-20 px-4 lg:px-8 border-b border-amber-500/15">
      {/* Ambient Casino Lighting and Card Suit Motifs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -top-12 right-10 text-8xl text-amber-500/5 select-none font-serif">♠</div>
      <div className="absolute top-32 left-8 text-8xl text-rose-500/5 select-none font-serif">♥</div>
      <div className="absolute bottom-6 right-1/4 text-8xl text-amber-500/5 select-none font-serif">♦</div>
      <div className="absolute bottom-10 left-1/4 text-8xl text-zinc-500/5 select-none font-serif">♣</div>

      <div className="max-w-6xl mx-auto relative z-10 text-center flex flex-col items-center">
        {/* Luxury Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs md:text-sm font-semibold tracking-wide mb-6 shadow-sm shadow-amber-500/10">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>المنصة الرائدة للألعاب والرهانات الافتراضية الفاخرة</span>
          <span className="text-amber-500/60">•</span>
          <span className="text-amber-200">عملة النظام: $ Virtual</span>
        </div>

        {/* Lion Emblem */}
        <div className="relative mb-5">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-b from-amber-300 via-amber-500 to-amber-800 p-1 shadow-2xl shadow-amber-500/25 rotate-3 hover:rotate-0 transition-transform duration-500">
            <div className="w-full h-full rounded-[22px] bg-[#0c0c10] flex items-center justify-center border border-amber-400/50">
              <span className="text-5xl md:text-7xl drop-shadow-md">🦁</span>
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-amber-200 font-cinzel">
            5LION
          </div>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black font-cinzel tracking-wider text-white mb-3">
          5LION <span className="gold-gradient-text">CASINO</span>
        </h1>

        {/* Tagline */}
        <p className="font-cinzel text-base sm:text-xl md:text-2xl text-amber-300/90 font-bold tracking-widest uppercase mb-4">
          ENTER THE WORLD OF 5LION
        </p>

        <p className="max-w-2xl text-sm md:text-base text-zinc-300 leading-relaxed mb-8">
          عالم الكازينو الفاخر بنظام الرصيد الافتراضي المحكم ($ Virtual). استمتع بماكينات السلوت الذهبية، عجلة الحظ الملكية، وأحدث مباريات كرة القدم العالمية برهانات رقمية آمنة خالية من أي دفع أو سحب خارجي.
        </p>

        {/* Call to Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-md">
          <button
            onClick={onExploreGames}
            className="flex-1 min-w-[160px] px-6 py-3.5 rounded-2xl font-bold text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all duration-300 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 group"
          >
            <span>استكشف الألعاب</span>
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onViewMatches}
            className="flex-1 min-w-[160px] px-6 py-3.5 rounded-2xl font-bold text-amber-300 bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 hover:border-amber-400 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
          >
            <span>مشاهدة المباريات</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Highlighted Value Propositions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mt-12 w-full max-w-4xl text-right">
          <div className="p-3.5 rounded-2xl bg-[#13131a]/80 border border-amber-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold">نظام محفظة مغلق</span>
            </div>
            <p className="text-[11px] text-zinc-400">رصيد افتراضي محمي بالكامل عبر Supabase RPC و Row Locking</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#13131a]/80 border border-amber-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-bold">تسوية فورية</span>
            </div>
            <p className="text-[11px] text-zinc-400">احتساب فوري للأرباح وتحديث الرصيد عند إعلان فوز الفريق</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#13131a]/80 border border-amber-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Flame className="w-4 h-4" />
              <span className="text-xs font-bold">4 ألعاب كازينو</span>
            </div>
            <p className="text-[11px] text-zinc-400">سلوتس ذهبية، عجلة الحظ الملكية، روليت، وغرفة النرد</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#13131a]/80 border border-amber-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold">3 مستويات للصلاحيات</span>
            </div>
            <p className="text-[11px] text-zinc-400">المالك (Owner) ➔ المشرف (Admin) ➔ اللاعب (Player)</p>
          </div>
        </div>
      </div>
    </section>
  );
};
