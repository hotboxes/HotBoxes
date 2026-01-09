'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Grid from '@/components/Grid';
import { motion } from 'framer-motion';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [game, setGame] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGameData();
  }, [id]);

  // Auto-refresh every 30 seconds to get latest scores
  useEffect(() => {
    const interval = setInterval(() => {
      loadGameData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadGameData = async () => {
    try {
      // Get user information
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Fetch game details
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (gameError || !gameData) {
        setError('Game not found');
        setLoading(false);
        return;
      }

      setGame(gameData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-32 h-32 border-4 border-[#FF4500] border-t-transparent rounded-full"></div>
          <div className="absolute inset-0 w-32 h-32 border-4 border-[#39FF14] border-b-transparent rounded-full animate-spin"></div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/80 backdrop-blur-sm rounded-xl p-12 border border-[#FF4500]/30"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-6 glow-orange">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-white text-display mb-4">
            ERROR: <span className="text-[#FF4500]">{error}</span>
          </h1>
          <p className="text-gray-300 mb-8 text-lg">
            Something went wrong loading this game.
          </p>
          <button
            onClick={() => router.back()}
            className="px-8 py-4 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-xl font-bold rounded-lg transition-all transform hover:scale-105 glow-orange"
          >
            GO BACK
          </button>
        </motion.div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/80 backdrop-blur-sm rounded-xl p-12 border border-[#FF4500]/30"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-6 glow-orange">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-white text-display mb-4">
            GAME <span className="text-[#FF4500]">NOT FOUND</span>
          </h1>
          <p className="text-gray-300 mb-8 text-lg">
            This game doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.back()}
            className="px-8 py-4 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-xl font-bold rounded-lg transition-all transform hover:scale-105 glow-orange"
          >
            BROWSE GAMES
          </button>
        </motion.div>
      </div>
    );
  }

  const totalPrize = (game.payout_q1 || 0) + (game.payout_q2 || 0) + (game.payout_q3 || 0) + (game.payout_final || 0);
  const gameDate = new Date(game.game_date);
  const now = new Date();
  const isLive = game.is_active && gameDate <= now;
  const isUpcoming = game.is_active && gameDate > now;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Game Header - Premium Event Poster Style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-2xl overflow-hidden border border-[#FF4500]/30 mb-8 glow-orange"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 grid-pattern opacity-20"></div>

        <div className="relative z-10 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Left Side - Teams & Info */}
            <div className="flex-1">
              {/* Sport & Status Badges */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider ${
                  game.sport === 'NFL'
                    ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/50 glow-green'
                    : 'bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/50 glow-orange'
                }`}>
                  {game.sport === 'NFL' ? '🏈 NFL' : '🏀 NBA'}
                </span>
                {isLive && (
                  <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/50 glow-orange animate-pulse">
                    🔴 LIVE NOW
                  </span>
                )}
                {isUpcoming && (
                  <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/50">
                    ⏱️ UPCOMING
                  </span>
                )}
                {!game.is_active && (
                  <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wider bg-gray-500/20 text-gray-400 border border-gray-500/50">
                    🏁 CLOSED
                  </span>
                )}
              </div>

              {/* Game Name */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white text-display mb-3">
                {game.name}
              </h1>

              {/* Teams Matchup - Huge Bold Display */}
              <div className="flex items-center gap-4 mb-4">
                <div className="text-2xl sm:text-3xl font-bold text-white text-sports">
                  {game.home_team}
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-[#FF4500] text-display">
                  VS
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white text-sports">
                  {game.away_team}
                </div>
              </div>

              {/* Game Date/Time */}
              <p className="text-gray-300 text-lg">
                📅 {gameDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Right Side - Prize Pool */}
            <div className="lg:text-right">
              <div className="inline-block bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 backdrop-blur-sm border border-[#FFD700]/50 rounded-2xl px-8 py-6 glow-gold">
                <div className="text-sm text-gray-300 uppercase tracking-wider mb-2 font-semibold">
                  {game.entry_fee === 0 ? '💎 FREE GAME PRIZE' : '💰 TOTAL PRIZE POOL'}
                </div>
                <div className="text-5xl font-extrabold text-[#FFD700] text-display text-glow-gold">
                  {totalPrize}
                </div>
                <div className="text-xl font-bold text-[#FFA500] uppercase">
                  HotCoins
                </div>
                <div className="mt-3 text-sm text-gray-300">
                  {game.entry_fee === 0 ? (
                    <span className="text-[#39FF14] font-bold">🎁 FREE ENTRY</span>
                  ) : (
                    <span>{game.entry_fee} HC per box</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Prize Breakdown - Stadium Scoreboard Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-extrabold text-white text-display mb-4 flex items-center gap-3">
          <span className="text-[#FFD700]">💰</span>
          PRIZE BREAKDOWN
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Q1 */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-xl p-6 border border-[#39FF14]/30 transition-all duration-300 hover:border-[#39FF14]/60 hover:glow-green hover:-translate-y-1">
              <div className="absolute top-0 right-0 text-[80px] font-bold text-[#39FF14]/5 leading-none text-display">1</div>
              <div className="relative z-10">
                <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  1st Quarter
                </div>
                <div className="text-4xl font-extrabold text-[#39FF14] text-display text-glow-green">
                  {game.payout_q1 || 0}
                </div>
                <div className="text-sm font-bold text-[#39FF14]/80 uppercase">
                  HotCoins
                </div>
              </div>
            </div>
          </div>

          {/* Q2 */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-xl p-6 border border-[#FF4500]/30 transition-all duration-300 hover:border-[#FF4500]/60 hover:glow-orange hover:-translate-y-1">
              <div className="absolute top-0 right-0 text-[80px] font-bold text-[#FF4500]/5 leading-none text-display">2</div>
              <div className="relative z-10">
                <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  Halftime
                </div>
                <div className="text-4xl font-extrabold text-[#FF4500] text-display text-glow-orange">
                  {game.payout_q2 || 0}
                </div>
                <div className="text-sm font-bold text-[#FF4500]/80 uppercase">
                  HotCoins
                </div>
              </div>
            </div>
          </div>

          {/* Q3 */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-xl p-6 border border-[#FFD700]/30 transition-all duration-300 hover:border-[#FFD700]/60 hover:glow-gold hover:-translate-y-1">
              <div className="absolute top-0 right-0 text-[80px] font-bold text-[#FFD700]/5 leading-none text-display">3</div>
              <div className="relative z-10">
                <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  3rd Quarter
                </div>
                <div className="text-4xl font-extrabold text-[#FFD700] text-display text-glow-gold">
                  {game.payout_q3 || 0}
                </div>
                <div className="text-sm font-bold text-[#FFD700]/80 uppercase">
                  HotCoins
                </div>
              </div>
            </div>
          </div>

          {/* Final */}
          <div className="relative group">
            <div className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-xl p-6 border border-[#39FF14]/30 transition-all duration-300 hover:border-[#39FF14]/60 hover:glow-green hover:-translate-y-1">
              <div className="absolute top-0 right-0 text-[80px] font-bold text-[#39FF14]/5 leading-none text-display">F</div>
              <div className="relative z-10">
                <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold mb-2">
                  Final Score
                </div>
                <div className="text-4xl font-extrabold text-[#39FF14] text-display text-glow-green">
                  {game.payout_final || 0}
                </div>
                <div className="text-sm font-bold text-[#39FF14]/80 uppercase">
                  HotCoins
                </div>
              </div>
            </div>
          </div>
        </div>

        {game.entry_fee === 0 && (
          <div className="mt-4 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg p-4">
            <p className="text-[#39FF14] font-bold text-center text-lg">
              🎁 FREE GAME - Winners receive fixed HotCoin prizes! Claim up to 2 boxes for free!
            </p>
          </div>
        )}
      </motion.div>

      {/* The Grid - Stadium Style Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-extrabold text-white text-display mb-4 flex items-center gap-3">
          <span className="text-[#FF4500]">🎯</span>
          CLAIM YOUR SQUARES
        </h2>

        <div className="relative bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/80 backdrop-blur-sm rounded-2xl p-4 sm:p-8 border border-[#FF4500]/20">
          <div className="absolute inset-0 grid-pattern opacity-10 rounded-2xl"></div>
          <div className="relative z-10">
            <Grid
              gameId={id}
              userId={user?.id}
              homeScores={game.home_scores || []}
              awayScores={game.away_scores || []}
              readOnly={!game.is_active}
              homeNumbers={game.home_numbers || []}
              awayNumbers={game.away_numbers || []}
              numbersAssigned={game.numbers_assigned || false}
              entryFee={game.entry_fee || 0}
              homeTeam={game.home_team}
              awayTeam={game.away_team}
            />
          </div>
        </div>
      </motion.div>

      {/* Login CTA for non-authenticated users */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/80 backdrop-blur-sm rounded-xl p-8 border border-[#FF4500]/30"
        >
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-4 glow-orange">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-2xl font-extrabold text-white text-display mb-2">
            READY TO <span className="text-[#FF4500]">PLAY?</span>
          </h3>
          <p className="text-gray-300 mb-6 text-lg">
            Sign in to claim your squares and join the action!
          </p>
          <a
            href="/login"
            className="inline-block px-8 py-4 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-xl font-bold rounded-lg transition-all transform hover:scale-105 glow-orange"
          >
            LOG IN NOW
          </a>
        </motion.div>
      )}
    </div>
  );
}