import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const Footer: React.FC<{ openConfigModal: () => void }> = ({ openConfigModal }) => {
  return (
    <footer className="bg-[#08080c] border-t border-amber-500/20 pt-12 pb-24 md:pb-12 px-4 lg:px-8 text-xs text-zinc-400">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Main Footer Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center text-xl shadow-lg shadow-amber-500/15">
              🦁
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-cinzel text-lg font-black text-white">5LION</span>
                <span className="font-cinzel text-xs text-amber-400 font-bold tracking-widest">CASINO</span>
              </div>
              <p className="text-[11px] text-zinc-500">منصة الألعاب والمراهنات الافتراضية الفاخرة</p>
            </div>
          </div>

          {/* Virtual Currency Notice */}
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 max-w-md text-[11px] text-right">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>تنويه أمان:</strong> جميع العملات والمعاملات على المنصة هي رصيد افتراضي داخلي ($ Virtual). لا توجد إيداعات نقدية أو بوابات سحب بنكية حقيقية.
            </span>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} 5LION CASINO. جميع الحقوق محفوظة لمنصة 5LION المستقلة.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={openConfigModal}
              className="text-amber-400/80 hover:text-amber-300 underline font-medium"
            >
              إعدادات Supabase والترحيل (SQL)
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Row Level Security (RLS) Active</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
