import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { casinoEngine } from '../lib/supabase';
import { MessageCircle, X, Send, Shield, User, Bot, Sparkles } from 'lucide-react';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string; isAgent?: boolean }>>([
    {
      sender: 'الدعم الفني 5LION',
      text: 'مرحباً بك في 5LION CASINO! كيف يمكننا مساعدتك اليوم بخصوص حسابك أو رصيدك الافتراضي؟',
      time: 'الآن',
      isAgent: true,
    },
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = {
      sender: user?.full_name || 'أنت',
      text: inputText.trim(),
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isAgent: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    const query = inputText.trim().toLowerCase();
    setInputText('');

    // Simulated Smart Support Responder for Casino
    setTimeout(() => {
      let reply = 'شكراً لتواصلك. فريق إدارة 5LION يتابع طلبك وسيقوم المشرف بالرد عليك فوراً.';
      if (query.includes('رصيد') || query.includes('شحن') || query.includes('دولار')) {
        reply = 'الرصيد في 5LION هو رصيد افتراضي ($ Virtual). يتم شحن حسابك من قِبل المشرفين المعتمدين (Admins) فقط عبر لوحة التحكم.';
      } else if (query.includes('سحب') || query.includes('فلوس') || query.includes('حقيقي')) {
        reply = 'تنبيه: منصة 5LION CASINO هي منصة ألعاب وترفيه افتراضية بالكامل. لا توجد بوابات دفع حقيقية أو سحب نقدي.';
      } else if (query.includes('مباراة') || query.includes('رهان')) {
        reply = 'يمكنك تصفح المباريات المفتوحة في قسم "المباريات والرهان"، واختيار الفريق وتأكيد رهانك. تسوية الأرباح تتم فور إعلان النتيجة!';
      } else if (query.includes('لعبة') || query.includes('سلوتس')) {
        reply = 'لدينا 4 ألعاب كازينو فاخرة: ماكينات السلوتس الذهبية، عجلة الحظ الملكية، روليت، وغرفة النرد، مع مضاعفات تصل إلى 15x!';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'مشرف الدعم (5LION Support)',
          text: reply,
          time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
          isAgent: true,
        },
      ]);
    }, 700);
  };

  return (
    <div className="fixed bottom-20 left-4 md:left-6 z-50 w-full max-w-sm rounded-3xl bg-[#121218] border border-amber-500/40 p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 flex flex-col h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 flex items-center justify-center text-black font-bold text-xs">
            🦁
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">دعم 5LION المباشر</h4>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              متواجد للمساعدة
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-zinc-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="my-3 overflow-y-auto flex-1 space-y-2.5 pr-1 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.isAgent ? 'items-start' : 'items-end'}`}
          >
            <span className="text-[10px] text-zinc-500 mb-0.5 px-1">{m.sender}</span>
            <div
              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                m.isAgent
                  ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tr-none'
                  : 'bg-amber-500 text-black font-medium rounded-tl-none'
              }`}
            >
              {m.text}
            </div>
            <span className="text-[9px] text-zinc-600 mt-0.5 px-1">{m.time}</span>
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="pt-2 border-t border-zinc-800 flex items-center gap-2">
        <input
          type="text"
          placeholder="اكتب رسالتك هنا..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-xs focus:outline-none focus:border-amber-400"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-40 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
