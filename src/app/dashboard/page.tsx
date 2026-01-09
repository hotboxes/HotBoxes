'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userBoxes, setUserBoxes] = useState<any[]>([]);
  const [userGames, setUserGames] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allGames, setAllGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadUserData();

    // Set up real-time subscriptions
    const subscription = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotcoin_transactions' }, () => {
        loadUserData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        loadUserData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'boxes' }, () => {
        loadUserData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser(authUser);

      // Load all data concurrently
      const [
        profileResult,
        boxesResult,
        transactionsResult,
        gamesResult
      ] = await Promise.all([
        // User profile
        supabase.from('profiles').select('*').eq('id', authUser.id).single(),

        // User's boxes with game info
        supabase.from('boxes').select(`
          *,
          games:game_id (
            id, name, sport, home_team, away_team, entry_fee,
            game_date, is_active, numbers_assigned,
            home_numbers, away_numbers, home_scores, away_scores,
            payout_q1, payout_q2, payout_q3, payout_final
          )
        `).eq('user_id', authUser.id),

        // User's transactions (last 20)
        supabase.from('hotcoin_transactions')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(20),

        // All active games for recommendations
        supabase.from('games')
          .select('*')
          .eq('is_active', true)
          .order('game_date', { ascending: true })
      ]);

      setProfile(profileResult.data);
      setUserBoxes(boxesResult.data || []);
      setTransactions(transactionsResult.data || []);
      setAllGames(gamesResult.data || []);

      // Extract unique games user is participating in
      const uniqueGames = Array.from(
        new Map(
          (boxesResult.data || [])
            .filter(box => box.games)
            .map(box => [box.games.id, box.games])
        ).values()
      );
      setUserGames(uniqueGames);

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };


  // Get user achievements
  const getAchievements = () => {
    const achievements = [];
    const gamesPlayed = userGames.length;
    const totalWon = transactions.filter(tx => tx.type === 'payout').reduce((sum, tx) => sum + tx.amount, 0);
    const biggestWin = Math.max(...transactions.filter(tx => tx.type === 'payout').map(tx => tx.amount), 0);
    const totalDeposited = transactions.filter(tx => tx.type === 'purchase' && tx.verification_status === 'approved').reduce((sum, tx) => sum + tx.amount, 0);

    if (gamesPlayed >= 1) achievements.push({ name: 'First Timer', icon: '🎯', description: 'Played your first game', color: 'from-[#39FF14]/20 to-[#00FF41]/20 border-[#39FF14]/50' });
    if (gamesPlayed >= 10) achievements.push({ name: 'Regular Player', icon: '🎮', description: 'Played 10+ games', color: 'from-[#FF4500]/20 to-[#FF6B35]/20 border-[#FF4500]/50' });
    if (totalWon > 0) achievements.push({ name: 'Winner', icon: '🏆', description: 'Won your first payout', color: 'from-[#FFD700]/20 to-[#FFA500]/20 border-[#FFD700]/50' });
    if (biggestWin >= 100) achievements.push({ name: 'Big Winner', icon: '💎', description: 'Won 100+ HC in a single game', color: 'from-[#FFD700]/20 to-[#FFA500]/20 border-[#FFD700]/50' });
    if (totalDeposited >= 100) achievements.push({ name: 'High Roller', icon: '💰', description: 'Deposited $100+', color: 'from-[#39FF14]/20 to-[#00FF41]/20 border-[#39FF14]/50' });

    return achievements;
  };

  // Get game recommendations
  const getRecommendations = () => {
    const userBalance = profile?.hotcoin_balance || 0;
    const userSports = userGames.map(game => game.sport);

    return allGames
      .filter(game => {
        // Filter games user can afford and isn't already in
        const userInGame = userBoxes.some(box => box.game_id === game.id);
        const canAfford = game.entry_fee <= userBalance || game.entry_fee === 0;
        return !userInGame && canAfford;
      })
      .sort((a, b) => {
        // Prioritize games in user's favorite sport
        const aScore = userSports.includes(a.sport) ? 1 : 0;
        const bScore = userSports.includes(b.sport) ? 1 : 0;
        return bScore - aScore;
      })
      .slice(0, 3);
  };

  // Check if user has winning box in a game
  const getWinningStatus = (game: any, userBoxes: any[]) => {
    if (!game.home_scores || !game.away_scores || game.home_scores.length === 0) {
      return null;
    }

    const userGameBoxes = userBoxes.filter(box => box.game_id === game.id);
    const winningBoxes = [];

    for (let quarter = 0; quarter < game.home_scores.length; quarter++) {
      const homeScore = game.home_scores[quarter];
      const awayScore = game.away_scores[quarter];

      if (homeScore !== undefined && awayScore !== undefined) {
        const homeLastDigit = homeScore % 10;
        const awayLastDigit = awayScore % 10;

        const winningBox = userGameBoxes.find(box => {
          const homeNumberIndex = game.home_numbers?.indexOf(homeLastDigit) || -1;
          const awayNumberIndex = game.away_numbers?.indexOf(awayLastDigit) || -1;
          return box.row === homeNumberIndex && box.col === awayNumberIndex;
        });

        if (winningBox) {
          const payouts = [game.payout_q1, game.payout_q2, game.payout_q3, game.payout_final];
          winningBoxes.push({
            quarter: quarter + 1,
            amount: payouts[quarter] || 0,
            box: winningBox
          });
        }
      }
    }

    return winningBoxes;
  };

  // Calculate stats
  const calculateStats = () => {
    const totalWon = transactions.filter(tx => tx.type === 'payout').reduce((sum, tx) => sum + tx.amount, 0);
    const totalSpent = transactions.filter(tx => tx.type === 'bet').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const netWinnings = totalWon - totalSpent;
    const gamesWon = [...new Set(transactions.filter(tx => tx.type === 'payout').map(tx => tx.game_id))].length;
    const winRate = userGames.length > 0 ? Math.round((gamesWon / userGames.length) * 100) : 0;

    return { netWinnings, winRate, totalWon, gamesWon };
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

  if (!user) {
    return null;
  }

  const achievements = getAchievements();
  const recommendations = getRecommendations();
  const stats = calculateStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-5xl font-extrabold text-white text-display mb-2">
          PLAYER <span className="text-[#FF4500]">DASHBOARD</span>
        </h1>
        <p className="text-2xl text-gray-300 font-semibold">
          Welcome back, <span className="text-[#39FF14]">{profile?.username || user.email?.split('@')[0]}</span>! 🎮
        </p>
      </motion.div>

      {/* ESPN-Style Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {/* HotCoin Balance */}
        <div className="relative group">
          <div className="relative bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/20 backdrop-blur-sm rounded-xl p-6 border border-[#FFD700]/50 transition-all duration-300 hover:glow-gold hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Balance</div>
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
            <div className="text-4xl font-extrabold text-[#FFD700] text-display text-glow-gold">
              {profile?.hotcoin_balance || 0}
            </div>
            <div className="text-sm font-bold text-[#FFA500] uppercase">HotCoins</div>
          </div>
        </div>

        {/* Net Winnings */}
        <div className="relative group">
          <div className="relative bg-gradient-to-br from-[#39FF14]/20 to-[#00FF41]/20 backdrop-blur-sm rounded-xl p-6 border border-[#39FF14]/50 transition-all duration-300 hover:glow-green hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Net P/L</div>
              <div className="w-10 h-10 bg-gradient-to-br from-[#39FF14] to-[#00FF41] rounded-full flex items-center justify-center">
                <span className="text-xl text-[#0A1128]">📈</span>
              </div>
            </div>
            <div className={`text-4xl font-extrabold text-display ${stats.netWinnings >= 0 ? 'text-[#39FF14] text-glow-green' : 'text-[#FF4500] text-glow-orange'}`}>
              {stats.netWinnings >= 0 ? '+' : ''}{stats.netWinnings}
            </div>
            <div className="text-sm font-bold text-[#39FF14]/80 uppercase">HC</div>
          </div>
        </div>

        {/* Active Games */}
        <div className="relative group">
          <div className="relative bg-gradient-to-br from-[#FF4500]/20 to-[#FF6B35]/20 backdrop-blur-sm rounded-xl p-6 border border-[#FF4500]/50 transition-all duration-300 hover:glow-orange hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Active</div>
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-full flex items-center justify-center">
                <span className="text-xl">🎮</span>
              </div>
            </div>
            <div className="text-4xl font-extrabold text-[#FF4500] text-display text-glow-orange">
              {userGames.filter(g => g.is_active).length}
            </div>
            <div className="text-sm font-bold text-[#FF4500]/80 uppercase">Games</div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="relative group">
          <div className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-xl p-6 border border-[#FFD700]/50 transition-all duration-300 hover:glow-gold hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Win Rate</div>
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center">
                <span className="text-xl text-[#0A1128]">🏆</span>
              </div>
            </div>
            <div className="text-4xl font-extrabold text-[#FFD700] text-display text-glow-gold">
              {stats.winRate}%
            </div>
            <div className="text-sm font-bold text-[#FFD700]/80 uppercase">{stats.gamesWon}/{userGames.length}</div>
          </div>
        </div>
      </motion.div>

      {/* Active Games Section */}
      {userGames.filter(game => game.is_active).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-extrabold text-white text-display mb-4 flex items-center gap-3">
            <span className="text-[#FF4500]">🎮</span>
            YOUR ACTIVE GAMES
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userGames.filter(game => game.is_active).map((game) => {
              const gameBoxes = userBoxes.filter(box => box.game_id === game.id);
              const winningStatus = getWinningStatus(game, userBoxes);
              const gameDate = new Date(game.game_date);
              const isUpcoming = gameDate > new Date();
              const isLive = !isUpcoming && game.is_active;

              return (
                <div key={game.id} className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-xl overflow-hidden border border-[#FF4500]/30 transition-all duration-300 hover:border-[#FF4500]/60 hover:glow-orange">
                  <div className="absolute inset-0 grid-pattern opacity-10"></div>
                  <div className="relative z-10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white text-sports mb-1">{game.name}</h3>
                        <p className="text-lg text-gray-300 font-semibold">
                          {game.home_team} <span className="text-[#FF4500]">vs</span> {game.away_team}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isLive && (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/50 glow-orange animate-pulse">
                            🔴 LIVE
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/50">
                            ⏱️ UPCOMING
                          </span>
                        )}
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                          game.sport === 'NFL' ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/50' : 'bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/50'
                        }`}>
                          {game.sport === 'NFL' ? '🏈 NFL' : '🏀 NBA'}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4 bg-[#0A1128]/50 rounded-lg p-4 border border-[#FFD700]/20">
                      <p className="text-sm text-gray-400 uppercase tracking-wider mb-2 font-semibold">
                        Your Position
                      </p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-[#FFD700] text-glow-gold">{gameBoxes.length}</p>
                          <p className="text-xs text-gray-400 uppercase">Boxes Claimed</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#FF4500] text-glow-orange">{gameBoxes.length * game.entry_fee}</p>
                          <p className="text-xs text-gray-400 uppercase">HC Invested</p>
                        </div>
                      </div>

                      {game.numbers_assigned && gameBoxes.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {gameBoxes.slice(0, 4).map((box, index) => (
                            <div key={box.id} className="bg-[#1E3A8A]/40 p-2 rounded-lg text-center border border-[#39FF14]/20">
                              <p className="text-xs text-gray-400">Box {index + 1}</p>
                              <p className="font-bold text-[#39FF14]">
                                {game.home_numbers?.[box.row]} - {game.away_numbers?.[box.col]}
                              </p>
                            </div>
                          ))}
                          {gameBoxes.length > 4 && (
                            <div className="bg-[#1E3A8A]/40 p-2 rounded-lg text-center border border-[#FFD700]/20">
                              <p className="text-xs text-gray-400">More</p>
                              <p className="font-bold text-[#FFD700]">+{gameBoxes.length - 4}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {!game.numbers_assigned && isUpcoming && (
                        <div className="mt-3 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-3">
                          <p className="text-sm text-[#FFD700] font-bold text-center">
                            ⏳ Numbers assign 10 min before kickoff
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Winning Status */}
                    {winningStatus && winningStatus.length > 0 && (
                      <div className="mb-4 bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border border-[#FFD700]/50 rounded-lg p-4 glow-gold">
                        <h4 className="text-sm font-bold text-[#FFD700] mb-2 uppercase tracking-wider flex items-center gap-2">
                          🏆 YOU'RE WINNING!
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {winningStatus.map((win, index) => (
                            <div key={index} className="bg-[#0A1128]/50 p-2 rounded text-center border border-[#FFD700]/30">
                              <p className="text-xs text-gray-400">Q{win.quarter}</p>
                              <p className="text-lg font-bold text-[#FFD700]">+{win.amount} HC</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Current Scores */}
                    {game.home_scores && game.away_scores && game.home_scores.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-wider">Live Scores:</h4>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {['Q1', 'Q2', 'Q3', 'Final'].map((quarter, index) => (
                            <div key={quarter} className="bg-[#0A1128]/50 p-3 rounded-lg border border-[#39FF14]/20">
                              <p className="text-xs text-gray-400 uppercase mb-1">{quarter}</p>
                              {game.home_scores[index] !== undefined ? (
                                <p className="font-bold text-[#39FF14]">
                                  {game.home_scores[index]}-{game.away_scores[index]}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-600">-</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                      <div className="text-sm text-gray-400">
                        📅 {gameDate.toLocaleDateString()} • {gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <Link
                        href={`/games/${game.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-sm font-bold rounded-lg transition-all transform hover:scale-105 glow-orange"
                      >
                        VIEW GAME →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-extrabold text-white text-display mb-4 flex items-center gap-3">
            <span className="text-[#FFD700]">🏆</span>
            ACHIEVEMENTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className={`relative bg-gradient-to-br ${achievement.color} backdrop-blur-sm rounded-xl p-4 border transition-all duration-300 hover:-translate-y-1`}>
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div>
                    <p className="font-bold text-white text-lg text-sports">{achievement.name}</p>
                    <p className="text-sm text-gray-300">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Game Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-extrabold text-white text-display mb-4 flex items-center gap-3">
            <span className="text-[#39FF14]">🎯</span>
            RECOMMENDED FOR YOU
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <div className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-xl p-6 border border-[#39FF14]/30 transition-all duration-300 hover:border-[#39FF14]/60 hover:glow-green hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${
                      game.entry_fee === 0 ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/50' : 'bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/50'
                    }`}>
                      {game.entry_fee === 0 ? '🎁 FREE' : `${game.entry_fee} HC`}
                    </span>
                    <span className="text-xs text-gray-400 uppercase font-bold">{game.sport}</span>
                  </div>
                  <h3 className="font-bold text-white text-lg text-sports mb-2">{game.name}</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    {game.home_team} vs {game.away_team}
                  </p>
                  <p className="text-xs text-gray-400">
                    📅 {new Date(game.game_date).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-extrabold text-white text-display mb-4 flex items-center gap-3">
          <span className="text-[#FFD700]">💰</span>
          RECENT ACTIVITY
        </h2>
        <div className="relative bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/80 backdrop-blur-sm rounded-xl overflow-hidden border border-[#FF4500]/20">
          <div className="max-h-96 overflow-y-auto">
            {transactions.length > 0 ? (
              <div className="divide-y divide-gray-700">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'purchase' ? 'bg-[#39FF14]/20 border border-[#39FF14]/50' :
                        transaction.type === 'withdrawal' ? 'bg-[#FF4500]/20 border border-[#FF4500]/50' :
                        transaction.type === 'payout' ? 'bg-[#FFD700]/20 border border-[#FFD700]/50' :
                        transaction.type === 'bet' ? 'bg-[#FF6B35]/20 border border-[#FF6B35]/50' :
                        'bg-gray-500/20 border border-gray-500/50'
                      }`}>
                        <span className="text-lg">
                          {transaction.type === 'purchase' ? '💰' :
                           transaction.type === 'withdrawal' ? '💸' :
                           transaction.type === 'payout' ? '🎉' :
                           transaction.type === 'bet' ? '🎮' : '📝'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {transaction.type === 'purchase' ? 'Deposit' :
                           transaction.type === 'withdrawal' ? 'Withdrawal' :
                           transaction.type === 'payout' ? 'Payout Won' :
                           transaction.type === 'bet' ? 'Game Entry' :
                           transaction.type.toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(transaction.created_at).toLocaleDateString()} • {transaction.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${
                        transaction.type === 'payout' || transaction.type === 'purchase' ? 'text-[#39FF14]' : 'text-[#FF4500]'
                      }`}>
                        {transaction.type === 'payout' || transaction.type === 'purchase' ? '+' : ''}{transaction.amount} HC
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-lg font-bold ${
                        transaction.verification_status === 'approved' ? 'bg-[#39FF14]/20 text-[#39FF14]' :
                        transaction.verification_status === 'pending' ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                        'bg-[#FF4500]/20 text-[#FF4500]'
                      }`}>
                        {transaction.verification_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-gray-400">
                <div className="text-4xl mb-4">🎮</div>
                <p className="text-lg mb-2">No recent activity</p>
                <Link href="/games" className="text-[#FF4500] hover:text-[#FF6B35] font-bold">
                  Start playing!
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Link
          href="/hotcoins"
          className="relative group"
        >
          <div className="relative bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/20 backdrop-blur-sm rounded-xl p-8 border border-[#FFD700]/50 transition-all duration-300 hover:glow-gold hover:-translate-y-2">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center mx-auto mb-4 glow-gold">
                <span className="text-3xl">💰</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white text-display mb-2">BUY HOTCOINS</h3>
              <p className="text-gray-300 text-sm">Add funds to your account</p>
            </div>
          </div>
        </Link>

        <Link
          href="/games"
          className="relative group"
        >
          <div className="relative bg-gradient-to-br from-[#39FF14]/20 to-[#00FF41]/20 backdrop-blur-sm rounded-xl p-8 border border-[#39FF14]/50 transition-all duration-300 hover:glow-green hover:-translate-y-2">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14] to-[#00FF41] rounded-full flex items-center justify-center mx-auto mb-4 glow-green">
                <span className="text-3xl text-[#0A1128]">🎮</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white text-display mb-2">BROWSE GAMES</h3>
              <p className="text-gray-300 text-sm">Find new games to join</p>
            </div>
          </div>
        </Link>

        <Link
          href="/hotcoins"
          className="relative group"
        >
          <div className="relative bg-gradient-to-br from-[#FF4500]/20 to-[#FF6B35]/20 backdrop-blur-sm rounded-xl p-8 border border-[#FF4500]/50 transition-all duration-300 hover:glow-orange hover:-translate-y-2">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-full flex items-center justify-center mx-auto mb-4 glow-orange">
                <span className="text-3xl">💸</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white text-display mb-2">CASH OUT</h3>
              <p className="text-gray-300 text-sm">Withdraw your winnings</p>
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
