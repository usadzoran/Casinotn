import React, { useState } from 'react';
import { Game } from '../types/database';
import { GameModal } from './InteractiveGames';
import { Play, Sparkles, Flame, Coins, ShieldCheck } from 'lucide-react';

interface GamesSectionProps {
  games: Game[];
  onRefresh: () => void;
}

export const GamesSection: React.FC<GamesSectionProps> = ({ games, onRefresh }) => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  return (
    <section id="games-section" className="py-12 px-4 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-amber-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold tracking-widest uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>كازينو النخبة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-cinzel text-white">
            الألعاب <span className="gold-gradient-text">الفاخرة</span>
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md">
          جرب حظك في ألعاب 5LION الكلاسيكية بالرصيد الافتراضي مع احتمالات فوز حقيقية ونظام تسوية فوري.
        </p>
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {games.map((game) => (
          <div
            key={game.id}
            className="group relative rounded-3xl bg-[#121218] border border-amber-500/20 hover:border-amber-500/50 transition-all duration-300 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col"
          >
            {/* Game Image Banner */}
            <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
              <img
                src={game.image_url}
                alt={game.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121218] via-transparent to-black/40" />

              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider backdrop-blur-md ${
                    game.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {game.status === 'active' ? 'متاح للعب' : 'معطل مؤقتاً'}
                </span>
              </div>

              {/* Lion Watermark */}
              <div className="absolute bottom-2 left-3 text-2xl drop-shadow-md">
                {game.slug === 'golden-slots' && '🎰'}
                {game.slug === 'lucky-wheel' && '🎡'}
                {game.slug === 'royal-cards' && '🃏'}
                {game.slug === 'dice-room' && '🎲'}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white font-cinzel mb-1 group-hover:text-amber-300 transition-colors">
                  {game.name}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                  {game.description}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-800/80">
                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="text-zinc-400">الحد الأدنى للرهان:</span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    ${game.minimum_bet}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedGame(game)}
                  disabled={game.status !== 'active'}
                  className="w-full py-3 rounded-2xl font-bold text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 group-hover:shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed font-cinzel text-sm"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>العب الآن</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Modal */}
      {selectedGame && (
        <GameModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onSuccessBet={onRefresh}
        />
      )}
    </section>
  );
};
