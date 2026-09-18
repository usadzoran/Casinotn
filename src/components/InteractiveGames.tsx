import React, { useState } from 'react';
import { Game } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { casinoEngine } from '../lib/supabase';
import confetti from 'canvas-confetti';
import { X, Play, AlertCircle, Sparkles, Coins, RefreshCw, Trophy } from 'lucide-react';

interface GameModalProps {
  game: Game;
  onClose: () => void;
  onSuccessBet: () => void;
}

export const GameModal: React.FC<GameModalProps> = ({ game, onClose, onSuccessBet }) => {
  const { user, wallet, refreshUserData } = useAuth();
  const [betAmount, setBetAmount] = useState<number>(game.minimum_bet);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    isWin: boolean;
    multiplier: number;
    payout: number;
    gameResult: any;
  } | null>(null);

  // Specific visual states
  const [reels, setReels] = useState<string[]>(['🦁', '👑', '💎']);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [diceValues, setDiceValues] = useState<[number, number]>([3, 4]);
  const [drawnCard, setDrawnCard] = useState<string>('A♠');

  const handlePlay = async () => {
    if (!user) {
      setError('يجب عليك تسجيل الدخول أولاً للمشاركة في اللعبة');
      return;
    }

    if (betAmount < game.minimum_bet || betAmount > game.maximum_bet) {
      setError(`قيمة الرهان يجب أن تكون بين $${game.minimum_bet} و $${game.maximum_bet}`);
      return;
    }

    if (!wallet || wallet.balance < betAmount) {
      setError('الرصيد غير كافٍ لإجراء هذه اللعبة');
      return;
    }

    setError(null);
    setIsPlaying(true);
    setLastResult(null);

    try {
      // Simulate physical animation duration
      const playPromise = casinoEngine.playCasinoGame(user.id, game.slug, betAmount);

      // Visual animations based on game type
      if (game.slug === 'golden-slots') {
        const interval = setInterval(() => {
          const syms = ['🦁', '👑', '💎', '7️⃣', '🍒', '🪙'];
          setReels([
            syms[Math.floor(Math.random() * syms.length)],
            syms[Math.floor(Math.random() * syms.length)],
            syms[Math.floor(Math.random() * syms.length)],
          ]);
        }, 100);

        const res = await playPromise;
        await new Promise((r) => setTimeout(r, 1200));
        clearInterval(interval);

        if (res.gameResult?.reels) {
          setReels(res.gameResult.reels);
        }
        setLastResult({
          isWin: res.isWin,
          multiplier: res.multiplier,
          payout: res.payout,
          gameResult: res.gameResult,
        });
      } else if (game.slug === 'lucky-wheel') {
        const newRot = wheelRotation + 1440 + Math.floor(Math.random() * 360);
        setWheelRotation(newRot);
        const res = await playPromise;
        await new Promise((r) => setTimeout(r, 1500));
        setLastResult({
          isWin: res.isWin,
          multiplier: res.multiplier,
          payout: res.payout,
          gameResult: res.gameResult,
        });
      } else if (game.slug === 'dice-room') {
        const interval = setInterval(() => {
          setDiceValues([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
        }, 80);
        const res = await playPromise;
        await new Promise((r) => setTimeout(r, 1000));
        clearInterval(interval);
        if (res.gameResult?.dice1 && res.gameResult?.dice2) {
          setDiceValues([res.gameResult.dice1, res.gameResult.dice2]);
        }
        setLastResult({
          isWin: res.isWin,
          multiplier: res.multiplier,
          payout: res.payout,
          gameResult: res.gameResult,
        });
      } else {
        // Royal Cards
        const res = await playPromise;
        await new Promise((r) => setTimeout(r, 800));
        if (res.gameResult?.card) {
          setDrawnCard(res.gameResult.card);
        }
        setLastResult({
          isWin: res.isWin,
          multiplier: res.multiplier,
          payout: res.payout,
          gameResult: res.gameResult,
        });
      }

      refreshUserData();
      onSuccessBet();

      // Trigger Confetti on Win
      const outcome = await playPromise;
      if (outcome.isWin) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FFF8DC'],
        });
      }
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ أثناء تنفيذ اللعبة');
    } finally {
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#111116] border border-amber-500/35 p-6 shadow-2xl shadow-black overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Glow overlay */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
              🦁
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-cinzel">{game.name}</h3>
              <p className="text-xs text-zinc-400">الحد الأدنى: ${game.minimum_bet} | الأقصى: ${game.maximum_bet}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Balance Bar */}
        <div className="flex items-center justify-between p-3 my-4 rounded-2xl bg-[#171720] border border-amber-500/20">
          <span className="text-xs text-zinc-400">رصيدك الافتراضي الحالي:</span>
          <span className="text-base font-bold text-amber-300 font-mono">
            ${wallet ? wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </span>
        </div>

        {/* Game Center Visual Stage */}
        <div className="my-6 flex flex-col items-center justify-center min-h-[180px] p-6 rounded-2xl bg-gradient-to-b from-[#09090c] to-[#14141d] border border-amber-500/30 relative">
          {game.slug === 'golden-slots' && (
            <div className="flex items-center justify-center gap-3">
              {reels.map((symbol, idx) => (
                <div
                  key={idx}
                  className={`w-20 h-24 rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 border-2 ${
                    isPlaying ? 'border-amber-400 animate-pulse' : 'border-amber-500/60'
                  } flex items-center justify-center text-4xl shadow-inner shadow-black`}
                >
                  {symbol}
                </div>
              ))}
            </div>
          )}

          {game.slug === 'lucky-wheel' && (
            <div className="relative w-36 h-36 flex items-center justify-center">
              <div
                className="w-full h-full rounded-full border-4 border-amber-500 shadow-xl flex items-center justify-center transition-transform ease-out duration-1000"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  background: 'conic-gradient(#f59e0b 0% 12.5%, #18181b 12.5% 25%, #d97706 25% 37.5%, #27272a 37.5% 50%, #f59e0b 50% 62.5%, #18181b 62.5% 75%, #b45309 75% 87.5%, #3f3f46 87.5% 100%)',
                }}
              >
                <div className="w-12 h-12 rounded-full bg-black border-2 border-amber-400 flex items-center justify-center text-xs font-bold text-amber-300">
                  5LION
                </div>
              </div>
              <div className="absolute -top-3 w-4 h-4 bg-amber-400 rotate-45 border border-black shadow-md z-10" />
            </div>
          )}

          {game.slug === 'dice-room' && (
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-200 text-black flex items-center justify-center text-4xl font-black font-mono shadow-xl border-2 border-white">
                {diceValues[0]}
              </div>
              <span className="text-2xl text-amber-500 font-bold">+</span>
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-200 text-black flex items-center justify-center text-4xl font-black font-mono shadow-xl border-2 border-white">
                {diceValues[1]}
              </div>
            </div>
          )}

          {game.slug === 'royal-cards' && (
            <div className="w-24 h-36 rounded-2xl bg-white text-zinc-900 border-2 border-amber-400 p-2 flex flex-col justify-between items-center shadow-2xl shadow-amber-500/10">
              <span className="text-xl font-bold self-start">{drawnCard.slice(0, 1)}</span>
              <span className="text-4xl">{drawnCard.slice(1) || '♠'}</span>
              <span className="text-xl font-bold self-end">{drawnCard.slice(0, 1)}</span>
            </div>
          )}

          {/* Outcome Alert Banner */}
          {lastResult && (
            <div
              className={`mt-4 px-4 py-2 rounded-xl text-center text-sm font-bold animate-in fade-in duration-300 w-full ${
                lastResult.isWin
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {lastResult.isWin ? (
                <div className="flex items-center justify-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>
                    مبروك! ربحت ${lastResult.payout.toLocaleString()} (مضاعف {lastResult.multiplier}x)
                  </span>
                </div>
              ) : (
                <span>حظ أوفر في الجولة القادمة! لم يتم تحقيق فوز.</span>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Bet Amount Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <span>قيمة الرهان الافتراضي ($):</span>
            <span className="font-mono text-amber-300 font-bold">${betAmount}</span>
          </div>

          <div className="flex items-center gap-2">
            {[game.minimum_bet, game.minimum_bet * 2, game.minimum_bet * 5, 100, 500].map((val) => {
              if (val > game.maximum_bet) return null;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBetAmount(val)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    betAmount === val
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
                  }`}
                >
                  ${val}
                </button>
              );
            })}
          </div>

          <input
            type="range"
            min={game.minimum_bet}
            max={Math.min(game.maximum_bet, 2000)}
            step={5}
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Play Action Button */}
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="mt-6 w-full py-4 rounded-2xl font-bold text-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-200 hover:to-amber-400 transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base font-cinzel tracking-wider"
        >
          {isPlaying ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>جاري اللعب...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-black" />
              <span>العب الآن (${betAmount})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
