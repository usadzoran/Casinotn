import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { GamesSection } from './components/GamesSection';
import { MatchesSection } from './components/MatchesSection';
import { MyBets } from './components/MyBets';
import { TransactionsLedger } from './components/TransactionsLedger';
import { AdminDashboard } from './components/AdminDashboard';
import { OwnerDashboard } from './components/OwnerDashboard';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { LoginModal, RegisterModal } from './components/AuthModals';
import { ConfigModal } from './components/ConfigModal';
import { NotificationsModal } from './components/NotificationsModal';
import { ChatModal } from './components/ChatModal';
import { ScenarioRunnerModal } from './components/ScenarioRunnerModal';
import { casinoEngine } from './lib/supabase';
import { MessageCircle, Sparkles, Trophy, Crown, Shield, Layers, PlayCircle } from 'lucide-react';

const CasinoApp: React.FC = () => {
  const { user, role, switchDemoRole } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');

  // Modals
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [scenarioOpen, setScenarioOpen] = useState(false);

  // Live Data State from Engine
  const [games, setGames] = useState(casinoEngine.getGames());
  const [matches, setMatches] = useState(casinoEngine.getMatches());

  useEffect(() => {
    const unsub = casinoEngine.subscribe(() => {
      setGames([...casinoEngine.getGames()]);
      setMatches([...casinoEngine.getMatches()]);
    });
    return () => unsub();
  }, []);

  const handleRefresh = () => {
    setGames([...casinoEngine.getGames()]);
    setMatches([...casinoEngine.getMatches()]);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0e] text-zinc-100 flex flex-col selection:bg-amber-500 selection:text-black">
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openLoginModal={() => setLoginOpen(true)}
        openRegisterModal={() => setRegisterOpen(true)}
        openConfigModal={() => setConfigOpen(true)}
        openNotifModal={() => setNotifOpen(true)}
      />

      {/* Role Testing Announcement Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/15 to-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-300 mx-auto sm:mx-0">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            أنت تتصفح حالياً بدور: <strong className="uppercase underline text-white">{role || 'زائر'}</strong>
          </span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400 hidden md:inline">
            يمكنك التبديل الفوري بين (المالك / المشرف / اللاعب) من الشريط العلوي لتجربة سيناريو الشحن والرهان كاملاً.
          </span>
        </div>

        {/* 13-Step Scenario Launcher Button */}
        <button
          onClick={() => setScenarioOpen(true)}
          className="mx-auto sm:mx-0 px-3 py-1 rounded-full bg-amber-500 text-black font-bold text-[11px] hover:bg-amber-400 shadow-md shadow-amber-500/20 flex items-center gap-1.5 transition-transform hover:scale-105"
        >
          <PlayCircle className="w-3.5 h-3.5 fill-black" />
          <span>محاكاة سيناريو الـ 13 خطوة المعتمد</span>
        </button>
      </div>

      {/* Main Views */}
      <main className="flex-1 pb-16 md:pb-0">
        {activeTab === 'home' && (
          <>
            <Hero
              onExploreGames={() => {
                const el = document.getElementById('games-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setActiveTab('games');
              }}
              onViewMatches={() => {
                const el = document.getElementById('matches-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else setActiveTab('matches');
              }}
            />
            <GamesSection games={games} onRefresh={handleRefresh} />
            <MatchesSection matches={matches} onBetPlaced={handleRefresh} />
          </>
        )}

        {activeTab === 'games' && <GamesSection games={games} onRefresh={handleRefresh} />}
        {activeTab === 'matches' && <MatchesSection matches={matches} onBetPlaced={handleRefresh} />}
        {activeTab === 'my-bets' && <MyBets />}
        {activeTab === 'transactions' && <TransactionsLedger />}
        {activeTab === 'admin-dashboard' && <AdminDashboard />}
        {activeTab === 'owner-dashboard' && <OwnerDashboard />}
      </main>

      {/* Floating Chat Trigger */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-16 md:bottom-6 left-4 md:left-6 z-40 p-3.5 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 text-black shadow-xl shadow-amber-500/25 hover:scale-110 transition-transform duration-200 flex items-center gap-2 group"
        title="تحدث مع الدعم الفني"
      >
        <MessageCircle className="w-6 h-6 fill-black" />
        <span className="hidden sm:inline text-xs font-bold font-cinzel">5LION SUPPORT</span>
      </button>

      {/* Modals */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSwitchToRegister={() => setRegisterOpen(true)}
      />

      <RegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSwitchToLogin={() => setLoginOpen(true)}
      />

      <ConfigModal
        isOpen={configOpen}
        onClose={() => setConfigOpen(false)}
      />

      <NotificationsModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />

      <ChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      <ScenarioRunnerModal
        isOpen={scenarioOpen}
        onClose={() => setScenarioOpen(false)}
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />

      {/* Footer */}
      <Footer openConfigModal={() => setConfigOpen(true)} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CasinoApp />
    </AuthProvider>
  );
}
