import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, Gamepad2, Trophy, History, Shield, Crown } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { user, role } = useAuth();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c10]/95 backdrop-blur-lg border-t border-amber-500/20 px-2 py-2 flex items-center justify-around text-[10px]">
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'home' ? 'text-amber-300 font-bold' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Home className="w-4 h-4" />
        <span>الرئيسية</span>
      </button>

      <button
        onClick={() => setActiveTab('games')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'games' ? 'text-amber-300 font-bold' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Gamepad2 className="w-4 h-4" />
        <span>الألعاب</span>
      </button>

      <button
        onClick={() => setActiveTab('matches')}
        className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'matches' ? 'text-amber-300 font-bold' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Trophy className="w-4 h-4" />
        <span>المباريات</span>
      </button>

      {user && (
        <button
          onClick={() => setActiveTab('my-bets')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'my-bets' ? 'text-amber-300 font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <History className="w-4 h-4" />
          <span>رهاناتي</span>
        </button>
      )}

      {role === 'admin' && (
        <button
          onClick={() => setActiveTab('admin-dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'admin-dashboard' ? 'text-emerald-300 font-bold' : 'text-emerald-500/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>المشرف</span>
        </button>
      )}

      {role === 'owner' && (
        <button
          onClick={() => setActiveTab('owner-dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'owner-dashboard' ? 'text-amber-300 font-bold' : 'text-amber-500/60'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>المالك</span>
        </button>
      )}
    </div>
  );
};
