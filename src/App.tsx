import React, { useState, useEffect, useCallback } from 'react';
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
import { ErrorBoundary } from './components/ErrorBoundary';
import { casinoApi, supabase } from './lib/supabase';
import { Game, Match } from './types/database';
import { MessageCircle } from 'lucide-react';

const CasinoApp: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');

  // Modals
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Live Data State directly from Supabase
  const [games, setGames] = useState<Game[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const fetchCatalogData = useCallback(async () => {
    try {
      const [gamesData, matchesData] = await Promise.all([
        casinoApi.getGames(),
        casinoApi.getMatches(),
      ]);
      setGames(gamesData);
      setMatches(matchesData);
    } catch (err) {
      console.warn('[5LION CASINO] Failed to fetch catalog data:', err);
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalogData();

    // Supabase Realtime for Matches and Games
    const channel = supabase
      .channel('public-catalog-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          casinoApi.getMatches().then(setMatches);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        () => {
          casinoApi.getGames().then(setGames);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCatalogData]);

  const handleRefresh = () => {
    fetchCatalogData();
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

      {/* Footer */}
      <Footer openConfigModal={() => setConfigOpen(true)} />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CasinoApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
