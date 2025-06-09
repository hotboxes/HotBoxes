'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

    if (gamesPlayed >= 1) achievements.push({ name: 'First Timer', icon: '🎯', description: 'Played your first game' });
    if (gamesPlayed >= 10) achievements.push({ name: 'Regular Player', icon: '🎮', description: 'Played 10+ games' });
    if (totalWon > 0) achievements.push({ name: 'Winner', icon: '🏆', description: 'Won your first payout' });
    if (biggestWin >= 100) achievements.push({ name: 'Big Winner', icon: '💎', description: 'Won 100+ HC in a single game' });
    if (totalDeposited >= 100) achievements.push({ name: 'High Roller', icon: '💰', description: 'Deposited $100+' });

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const achievements = getAchievements();
  const recommendations = getRecommendations();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Player Dashboard</h1>
          <p className="mt-1 text-lg text-gray-500 dark:text-gray-400">
            Welcome back, {profile?.username || user.email}! 🎮
          </p>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100">HotCoin Balance</p>
              <p className="text-2xl font-bold">{profile?.hotcoin_balance || 0} HC</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Active Games</p>
              <p className="text-2xl font-bold">{userGames.filter(g => g.is_active).length}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎮</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Winnings</p>
              <p className="text-2xl font-bold">{transactions.filter(tx => tx.type === 'payout').reduce((sum, tx) => sum + tx.amount, 0)} HC</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Games Played</p>
              <p className="text-2xl font-bold">{userGames.length}</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Games Section */}
      {userGames.filter(game => game.is_active).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🎮 Your Active Games</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userGames.filter(game => game.is_active).map((game) => {
              const gameBoxes = userBoxes.filter(box => box.game_id === game.id);
              const winningStatus = getWinningStatus(game, userBoxes);
              const gameDate = new Date(game.game_date);
              const isUpcoming = gameDate > new Date();
              const isLive = !isUpcoming && game.is_active;
              
              return (
                <div key={game.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{game.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {game.home_team} vs {game.away_team}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          isLive ? 'bg-red-100 text-red-800' :
                          isUpcoming ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {isLive ? '🔴 LIVE' : isUpcoming ? '⏰ Upcoming' : '✅ Complete'}
                        </span>
                        <span className="text-xs text-gray-500">{game.sport}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Your Boxes: {gameBoxes.length} ({gameBoxes.length * game.entry_fee} HC invested)
                      </p>
                      
                      {game.numbers_assigned && (
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {gameBoxes.slice(0, 4).map((box, index) => (
                            <div key={box.id} className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center">
                              <p className="text-xs text-gray-600 dark:text-gray-400">Box {index + 1}</p>
                              <p className="font-medium">
                                {game.home_numbers?.[box.row]} - {game.away_numbers?.[box.col]}
                              </p>
                            </div>
                          ))}
                          {gameBoxes.length > 4 && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center">
                              <p className="text-xs text-gray-600 dark:text-gray-400">+{gameBoxes.length - 4} more</p>
                            </div>
                          )}
                        </div>
                      )}

                      {!game.numbers_assigned && isUpcoming && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          ⏳ Numbers will be assigned 10 minutes before game start
                        </p>
                      )}
                    </div>

                    {/* Winning Status */}
                    {winningStatus && winningStatus.length > 0 && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <h4 className="text-sm font-bold text-green-800 dark:text-green-200 mb-2">🏆 You're Winning!</h4>
                        {winningStatus.map((win, index) => (
                          <p key={index} className="text-sm text-green-700 dark:text-green-300">
                            Q{win.quarter}: {win.amount} HC
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Current Scores */}
                    {game.home_scores && game.away_scores && game.home_scores.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Current Scores:</h4>
                        <div className="grid grid-cols-4 gap-2 text-center">
                          {['Q1', 'Q2', 'Q3', 'Final'].map((quarter, index) => (
                            <div key={quarter} className="bg-gray-50 dark:bg-gray-700 p-2 rounded">
                              <p className="text-xs text-gray-600 dark:text-gray-400">{quarter}</p>
                              {game.home_scores[index] !== undefined ? (
                                <p className="font-medium text-sm">
                                  {game.home_scores[index]} - {game.away_scores[index]}
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400">-</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {gameDate.toLocaleDateString()} at {gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <Link
                        href={`/games/${game.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View Game →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Games Section */}
      {userGames.filter(game => !game.is_active).length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">✅ Your Completed Games</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userGames.filter(game => !game.is_active).map((game) => {
              const gameBoxes = userBoxes.filter(box => box.game_id === game.id);
              const winningStatus = getWinningStatus(game, userBoxes);
              const gameDate = new Date(game.game_date);
              
              return (
                <div key={game.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden opacity-75">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{game.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {game.home_team} vs {game.away_team}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          ✅ Complete
                        </span>
                        <span className="text-xs text-gray-500">{game.sport}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Your Boxes: {gameBoxes.length} ({gameBoxes.length * game.entry_fee} HC invested)
                      </p>
                      
                      {winningStatus.totalWon > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg mb-3">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            🎉 You won {winningStatus.totalWon} HC in this game!
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-300">
                            Won {winningStatus.quartersWon} quarter(s)
                          </p>
                        </div>
                      )}

                      {game.numbers_assigned && (
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          {gameBoxes.slice(0, 4).map((box, index) => (
                            <div key={box.id} className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center">
                              <p className="text-xs text-gray-600 dark:text-gray-400">Box {index + 1}</p>
                              <p className="font-medium">
                                {game.home_numbers?.[box.row]} - {game.away_numbers?.[box.col]}
                              </p>
                            </div>
                          ))}
                          {gameBoxes.length > 4 && (
                            <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center">
                              <p className="text-xs text-gray-600 dark:text-gray-400">+{gameBoxes.length - 4} more</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {gameDate.toLocaleDateString()} at {gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                      <Link
                        href={`/games/${game.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View Results →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🏆 Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-lg text-white">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <p className="font-bold">{achievement.name}</p>
                    <p className="text-sm text-yellow-100">{achievement.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🎯 Recommended for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((game) => (
              <Link key={game.id} href={`/games/${game.id}`}>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      game.entry_fee === 0 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {game.entry_fee === 0 ? 'FREE' : `${game.entry_fee} HC/box`}
                    </span>
                    <span className="text-xs text-gray-500">{game.sport}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{game.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {game.home_team} vs {game.away_team}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(game.game_date).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">💰 Recent Activity</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {transactions.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.type === 'purchase' ? 'bg-green-500' :
                        transaction.type === 'withdrawal' ? 'bg-red-500' :
                        transaction.type === 'payout' ? 'bg-blue-500' :
                        transaction.type === 'bet' ? 'bg-purple-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {transaction.type === 'purchase' ? '💰 Deposit' : 
                           transaction.type === 'withdrawal' ? '💸 Withdrawal' :
                           transaction.type === 'payout' ? '🎉 Payout' :
                           transaction.type === 'bet' ? '🎮 Game Entry' : 
                           '📝 ' + transaction.type} - {transaction.amount} HC
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()} • {transaction.description}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      transaction.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                      transaction.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.verification_status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No recent activity. <Link href="/games" className="text-indigo-600 hover:text-indigo-800">Start playing!</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/hotcoins"
          className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg text-white hover:from-indigo-600 hover:to-purple-700 transition-all"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">💰</div>
            <h3 className="text-lg font-bold mb-1">Buy HotCoins</h3>
            <p className="text-indigo-100 text-sm">Add funds to your account</p>
          </div>
        </Link>

        <Link
          href="/games"
          className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-lg text-white hover:from-green-600 hover:to-emerald-700 transition-all"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">🎮</div>
            <h3 className="text-lg font-bold mb-1">Browse Games</h3>
            <p className="text-green-100 text-sm">Find new games to join</p>
          </div>
        </Link>

        <Link
          href="/hotcoins"
          className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 rounded-lg text-white hover:from-blue-600 hover:to-cyan-700 transition-all"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">💸</div>
            <h3 className="text-lg font-bold mb-1">Request Withdrawal</h3>
            <p className="text-blue-100 text-sm">Cash out your winnings</p>
          </div>
        </Link>
      </div>
    </div>
  );
}