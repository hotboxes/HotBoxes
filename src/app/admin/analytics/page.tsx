'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface UserActivity {
  id: string;
  username: string;
  email: string;
  hotcoin_balance: number;
  total_spent: number;
  total_won: number;
  games_played: number;
  last_activity: string;
  net_profit_loss: number;
  avg_game_spend: number;
  win_rate: number;
}

interface GamePerformance {
  id: string;
  name: string;
  sport: string;
  home_team: string;
  away_team: string;
  entry_fee: number;
  total_boxes_sold: number;
  total_revenue: number;
  total_payouts: number;
  profit_margin: number;
  completion_rate: number;
  created_at: string;
}

interface FraudAlert {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  user_id?: string;
  user_email?: string;
  amount?: number;
  timestamp: string;
  details: any;
}

export default function AdminAnalyticsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [gamePerformance, setGamePerformance] = useState<GamePerformance[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'games' | 'fraud'>('users');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const router = useRouter();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (currentUser?.is_admin) {
      loadAnalytics();
    }
  }, [currentUser, timeframe]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/');
        return;
      }

      setCurrentUser(profile);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/');
    }
  };

  const getTimeframeDate = () => {
    const now = new Date();
    switch (timeframe) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default: return new Date('2020-01-01'); // All time
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUserActivity(),
        loadGamePerformance(),
        loadFraudDetection()
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async () => {
    try {
      const cutoffDate = getTimeframeDate();
      
      // Get all users with their transaction data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profiles) return;

      const userActivityData: UserActivity[] = [];

      for (const profile of profiles) {
        // Get user's transactions in timeframe
        const { data: transactions } = await supabase
          .from('hotcoin_transactions')
          .select('*')
          .eq('user_id', profile.id)
          .gte('created_at', cutoffDate.toISOString())
          .eq('verification_status', 'approved');

        // Get user's game participation
        const { data: boxes } = await supabase
          .from('boxes')
          .select('*, games(*)')
          .eq('user_id', profile.id);

        const total_spent = (transactions || []).filter(tx => tx.type === 'bet').reduce((sum, tx) => sum + tx.amount, 0);
        const total_won = (transactions || []).filter(tx => tx.type === 'payout').reduce((sum, tx) => sum + tx.amount, 0);
        const games_played = new Set((boxes || []).map(box => box.game_id)).size;
        const lastTransaction = (transactions || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        userActivityData.push({
          id: profile.id,
          username: profile.username || 'No username',
          email: profile.email,
          hotcoin_balance: profile.hotcoin_balance,
          total_spent,
          total_won,
          games_played,
          last_activity: lastTransaction?.created_at || profile.created_at,
          net_profit_loss: total_won - total_spent,
          avg_game_spend: games_played > 0 ? total_spent / games_played : 0,
          win_rate: games_played > 0 ? ((transactions || []).filter(tx => tx.type === 'payout').length / games_played) * 100 : 0
        });
      }

      // Sort by total spent (most active first)
      userActivityData.sort((a, b) => b.total_spent - a.total_spent);
      setUserActivity(userActivityData);
    } catch (error) {
      console.error('Error loading user activity:', error);
    }
  };

  const loadGamePerformance = async () => {
    try {
      const cutoffDate = getTimeframeDate();
      
      const { data: games } = await supabase
        .from('games')
        .select('*')
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (!games) return;

      const gamePerformanceData: GamePerformance[] = [];

      for (const game of games) {
        // Get boxes sold for this game
        const { data: boxes } = await supabase
          .from('boxes')
          .select('*')
          .eq('game_id', game.id)
          .not('user_id', 'is', null);

        // Get bet transactions for this game
        const { data: betTransactions } = await supabase
          .from('hotcoin_transactions')
          .select('*')
          .eq('game_id', game.id)
          .eq('type', 'bet')
          .eq('verification_status', 'approved');

        // Get payout transactions for this game
        const { data: payoutTransactions } = await supabase
          .from('hotcoin_transactions')
          .select('*')
          .eq('game_id', game.id)
          .eq('type', 'payout')
          .eq('verification_status', 'approved');

        const total_boxes_sold = (boxes || []).length;
        const total_revenue = (betTransactions || []).reduce((sum, tx) => sum + tx.amount, 0);
        const total_payouts = (payoutTransactions || []).reduce((sum, tx) => sum + tx.amount, 0);
        const profit_margin = total_revenue > 0 ? ((total_revenue - total_payouts) / total_revenue) * 100 : 0;
        const completion_rate = total_boxes_sold > 0 ? (total_boxes_sold / 100) * 100 : 0;

        gamePerformanceData.push({
          id: game.id,
          name: game.name,
          sport: game.sport,
          home_team: game.home_team,
          away_team: game.away_team,
          entry_fee: game.entry_fee,
          total_boxes_sold,
          total_revenue,
          total_payouts,
          profit_margin,
          completion_rate,
          created_at: game.created_at
        });
      }

      // Sort by total revenue (most profitable first)
      gamePerformanceData.sort((a, b) => b.total_revenue - a.total_revenue);
      setGamePerformance(gamePerformanceData);
    } catch (error) {
      console.error('Error loading game performance:', error);
    }
  };

  const loadFraudDetection = async () => {
    try {
      const alerts: FraudAlert[] = [];
      const cutoffDate = getTimeframeDate();

      // Get all recent transactions
      const { data: transactions } = await supabase
        .from('hotcoin_transactions')
        .select(`
          *,
          profiles:user_id (email, username, hotcoin_balance)
        `)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (!transactions) return;

      // Fraud Detection Rules
      for (const tx of transactions) {
        const userEmail = tx.profiles?.email || 'Unknown';
        
        // 1. Large single transactions ($500+)
        if (tx.amount >= 500) {
          alerts.push({
            type: 'Large Transaction',
            severity: tx.amount >= 1000 ? 'high' : 'medium',
            description: `Large ${tx.type} transaction of $${tx.amount}`,
            user_id: tx.user_id,
            user_email: userEmail,
            amount: tx.amount,
            timestamp: tx.created_at,
            details: { transaction_id: tx.id, type: tx.type }
          });
        }

        // 2. Rapid successive transactions (multiple in short time)
        const recentUserTx = transactions.filter(t => 
          t.user_id === tx.user_id && 
          new Date(t.created_at).getTime() > new Date(tx.created_at).getTime() - (10 * 60 * 1000) // 10 minutes
        );
        
        if (recentUserTx.length >= 5) {
          alerts.push({
            type: 'Rapid Transactions',
            severity: 'medium',
            description: `${recentUserTx.length} transactions in 10 minutes`,
            user_id: tx.user_id,
            user_email: userEmail,
            timestamp: tx.created_at,
            details: { transaction_count: recentUserTx.length, timeframe: '10 minutes' }
          });
        }

        // 3. Failed verification pattern
        if (tx.verification_status === 'rejected') {
          alerts.push({
            type: 'Failed Verification',
            severity: 'low',
            description: `${tx.type} verification failed`,
            user_id: tx.user_id,
            user_email: userEmail,
            amount: tx.amount,
            timestamp: tx.created_at,
            details: { transaction_id: tx.id, reason: 'verification_failed' }
          });
        }

        // 4. Unusual withdrawal patterns
        if (tx.type === 'withdrawal' && tx.amount >= 300) {
          alerts.push({
            type: 'Large Withdrawal',
            severity: 'medium',
            description: `Large withdrawal request of $${tx.amount}`,
            user_id: tx.user_id,
            user_email: userEmail,
            amount: tx.amount,
            timestamp: tx.created_at,
            details: { transaction_id: tx.id }
          });
        }
      }

      // 5. Check for users with unusual win rates
      const { data: profiles } = await supabase.from('profiles').select('*');
      
      for (const profile of profiles || []) {
        const userTransactions = transactions.filter(tx => tx.user_id === profile.id);
        const payouts = userTransactions.filter(tx => tx.type === 'payout');
        const bets = userTransactions.filter(tx => tx.type === 'bet');
        
        if (bets.length >= 10) {
          const winRate = (payouts.length / bets.length) * 100;
          if (winRate >= 80) {
            alerts.push({
              type: 'Unusual Win Rate',
              severity: 'high',
              description: `Extremely high win rate: ${Math.round(winRate)}%`,
              user_id: profile.id,
              user_email: profile.email,
              timestamp: new Date().toISOString(),
              details: { win_rate: winRate, games_played: bets.length }
            });
          }
        }
      }

      // Remove duplicates and sort by severity and time
      const uniqueAlerts = alerts.filter((alert, index, self) => 
        index === self.findIndex(a => 
          a.type === alert.type && 
          a.user_id === alert.user_id && 
          Math.abs(new Date(a.timestamp).getTime() - new Date(alert.timestamp).getTime()) < 60000
        )
      );

      uniqueAlerts.sort((a, b) => {
        const severityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[b.severity] - severityOrder[a.severity];
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setFraudAlerts(uniqueAlerts);
    } catch (error) {
      console.error('Error loading fraud detection:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Advanced reporting and fraud detection</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
          <Link
            href="/admin"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'users', label: '👥 User Activity', count: userActivity.length },
            { key: 'games', label: '🎮 Game Performance', count: gamePerformance.length },
            { key: 'fraud', label: '🚨 Fraud Detection', count: fraudAlerts.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* User Activity Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">👥 User Activity Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {userActivity.filter(u => u.total_spent > 0).length}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Top Spender</p>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">
                  ${userActivity[0]?.total_spent || 0}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Avg Spend/User</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  ${Math.round(userActivity.reduce((sum, u) => sum + u.total_spent, 0) / userActivity.length) || 0}
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">High Win Rate Users</p>
                <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {userActivity.filter(u => u.win_rate >= 50 && u.games_played >= 5).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Spending</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Activity</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {userActivity.slice(0, 50).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          <div className="text-xs text-gray-400">Balance: ${user.hotcoin_balance}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="font-medium">Spent: ${user.total_spent}</div>
                          <div className="text-green-600">Won: ${user.total_won}</div>
                          <div className={`text-xs ${user.net_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Net: {user.net_profit_loss >= 0 ? '+' : ''}${user.net_profit_loss}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div>Games: {user.games_played}</div>
                          <div>Win Rate: {Math.round(user.win_rate)}%</div>
                          <div>Avg/Game: ${Math.round(user.avg_game_spend)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.last_activity).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Game Performance Tab */}
      {activeTab === 'games' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🎮 Game Performance Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-green-600 dark:text-green-400 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  ${gamePerformance.reduce((sum, g) => sum + g.total_revenue, 0)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Avg Profit Margin</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {Math.round(gamePerformance.reduce((sum, g) => sum + g.profit_margin, 0) / gamePerformance.length) || 0}%
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Top Game Revenue</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  ${gamePerformance[0]?.total_revenue || 0}
                </p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Avg Completion</p>
                <p className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {Math.round(gamePerformance.reduce((sum, g) => sum + g.completion_rate, 0) / gamePerformance.length) || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Game</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {gamePerformance.map((game) => (
                    <tr key={game.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{game.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{game.home_team} vs {game.away_team}</div>
                          <div className="text-xs text-gray-400">{game.sport} • ${game.entry_fee}/box</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="font-medium text-green-600">${game.total_revenue}</div>
                          <div className="text-red-600">-${game.total_payouts}</div>
                          <div className="text-xs text-gray-500">Profit: ${game.total_revenue - game.total_payouts}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div>Boxes: {game.total_boxes_sold}/100</div>
                          <div>Completion: {Math.round(game.completion_rate)}%</div>
                          <div className={`text-xs ${game.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Margin: {Math.round(game.profit_margin)}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(game.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fraud Detection Tab */}
      {activeTab === 'fraud' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🚨 Fraud Detection & Security</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">High Severity</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {fraudAlerts.filter(a => a.severity === 'high').length}
                </p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Medium Severity</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                  {fraudAlerts.filter(a => a.severity === 'medium').length}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Low Severity</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {fraudAlerts.filter(a => a.severity === 'low').length}
                </p>
              </div>
            </div>
          </div>

          {fraudAlerts.length === 0 ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">No Fraud Alerts</h3>
              <p className="text-green-700 dark:text-green-300">All user activity appears normal for the selected timeframe.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fraudAlerts.map((alert, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-red-500' :
                    alert.severity === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500' :
                    'bg-gray-50 dark:bg-gray-900/20 border-gray-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">{alert.type}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">{alert.description}</p>
                      {alert.user_email && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          User: {alert.user_email}
                          {alert.amount && ` • Amount: $${alert.amount}`}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {alert.user_id && (
                      <Link
                        href={`/admin/users/${alert.user_id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View User →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}