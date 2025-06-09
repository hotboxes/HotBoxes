'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminPage() {
  const [user, setUser] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({});
  const [showBulkOps, setShowBulkOps] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkType, setBulkType] = useState<'add' | 'subtract'>('add');
  const router = useRouter();

  useEffect(() => {
    loadAdminData();
    
    // Set up real-time subscriptions
    const subscription = supabase
      .channel('admin-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotcoin_transactions' }, () => {
        loadAdminData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadAdminData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, () => {
        loadAdminData();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults({});
      return;
    }

    const performSearch = () => {
      const query = searchQuery.toLowerCase();
      
      // Search users
      const matchingUsers = allUsers.filter(user => 
        user.email?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.id?.toLowerCase().includes(query)
      ).slice(0, 5);

      // Search games
      const matchingGames = games.filter(game =>
        game.name?.toLowerCase().includes(query) ||
        game.home_team?.toLowerCase().includes(query) ||
        game.away_team?.toLowerCase().includes(query) ||
        game.sport?.toLowerCase().includes(query)
      ).slice(0, 5);

      // Search transactions
      const matchingTransactions = allTransactions.filter(tx =>
        tx.transaction_id?.toLowerCase().includes(query) ||
        tx.type?.toLowerCase().includes(query) ||
        tx.profiles?.email?.toLowerCase().includes(query) ||
        tx.amount?.toString().includes(query)
      ).slice(0, 5);

      setSearchResults({
        users: matchingUsers,
        games: matchingGames,
        transactions: matchingTransactions
      });
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, allUsers, games, allTransactions]);

  const loadAdminData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', authUser.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/');
        return;
      }

      setUser(authUser);

      // Load all data concurrently
      const [
        gamesResult,
        usersResult,
        transactionsResult,
        withdrawalsResult,
        paymentsResult,
        recentUsersResult
      ] = await Promise.all([
        // Games
        supabase.from('games').select('*').order('game_date', { ascending: false }),
        
        // All users
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        
        // All transactions
        supabase.from('hotcoin_transactions').select(`
          *,
          profiles:user_id (username, email)
        `).order('created_at', { ascending: false }).limit(100),
        
        // Pending withdrawals
        supabase.from('hotcoin_transactions').select(`
          *,
          profiles:user_id (username, email, hotcoin_balance)
        `).eq('type', 'withdrawal').eq('verification_status', 'pending').order('created_at', { ascending: false }),
        
        // Pending payments
        supabase.from('hotcoin_transactions').select(`
          *,
          profiles:user_id (username, email)
        `).eq('type', 'purchase').eq('verification_status', 'pending').order('created_at', { ascending: false }),
        
        // Recent users (last 7 days)
        supabase.from('profiles').select('*')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false })
      ]);

      setGames(gamesResult.data || []);
      setAllUsers(usersResult.data || []);
      setAllTransactions(transactionsResult.data || []);
      setPendingWithdrawals(withdrawalsResult.data || []);
      setPendingPayments(paymentsResult.data || []);
      setRecentUsers(recentUsersResult.data || []);
      
      // Create recent activity feed
      const activityFeed = (transactionsResult.data || []).slice(0, 10).map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        user: tx.profiles?.username || tx.profiles?.email || 'Unknown',
        timestamp: tx.created_at,
        status: tx.verification_status
      }));
      setRecentActivity(activityFeed);

    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Financial analytics calculations
  const getFinancialMetrics = () => {
    const now = new Date();
    const timeframes = {
      '24h': new Date(now.getTime() - 24 * 60 * 60 * 1000),
      '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };
    
    const cutoffDate = timeframes[selectedTimeframe as keyof typeof timeframes];
    const filteredTransactions = allTransactions.filter(tx => 
      new Date(tx.created_at) >= cutoffDate && tx.verification_status === 'approved'
    );

    const revenue = filteredTransactions
      .filter(tx => tx.type === 'purchase')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const payouts = filteredTransactions
      .filter(tx => tx.type === 'payout')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const withdrawals = filteredTransactions
      .filter(tx => tx.type === 'withdrawal')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const profit = revenue - payouts - withdrawals;
    const transactionCount = filteredTransactions.length;
    const avgTransactionSize = transactionCount > 0 ? revenue / filteredTransactions.filter(tx => tx.type === 'purchase').length : 0;

    return { revenue, payouts, withdrawals, profit, transactionCount, avgTransactionSize };
  };

  // User analytics
  const getUserAnalytics = () => {
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(user => user.hotcoin_balance > 0).length;
    const newUsersThisWeek = recentUsers.length;
    const averageBalance = allUsers.reduce((sum, user) => sum + (user.hotcoin_balance || 0), 0) / totalUsers;
    
    // Top spenders
    const topSpenders = allUsers
      .sort((a, b) => (b.hotcoin_balance || 0) - (a.hotcoin_balance || 0))
      .slice(0, 5);

    // User segments
    const highValue = allUsers.filter(user => (user.hotcoin_balance || 0) > 100).length;
    const mediumValue = allUsers.filter(user => (user.hotcoin_balance || 0) > 25 && (user.hotcoin_balance || 0) <= 100).length;
    const lowValue = allUsers.filter(user => (user.hotcoin_balance || 0) > 0 && (user.hotcoin_balance || 0) <= 25).length;

    return { totalUsers, activeUsers, newUsersThisWeek, averageBalance, topSpenders, highValue, mediumValue, lowValue };
  };

  // Game analytics
  const getGameAnalytics = () => {
    const activeGames = games.filter(g => g.is_active).length;
    const totalGames = games.length;
    
    // Calculate boxes sold per game
    const gamePerformance = games.map(game => {
      const gameTransactions = allTransactions.filter(tx => 
        tx.type === 'bet' && tx.game_id === game.id
      );
      return {
        ...game,
        boxesSold: gameTransactions.length,
        revenue: gameTransactions.reduce((sum, tx) => sum + game.entry_fee, 0)
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Sport performance
    const nflGames = games.filter(g => g.sport === 'NFL').length;
    const nbaGames = games.filter(g => g.sport === 'NBA').length;
    
    return { activeGames, totalGames, gamePerformance, nflGames, nbaGames };
  };

  // Security monitoring
  const getSecurityMetrics = () => {
    const suspiciousTransactions = allTransactions.filter(tx => 
      tx.amount > 500 || (tx.type === 'purchase' && tx.verification_status === 'pending')
    ).length;

    const failedTransactions = allTransactions.filter(tx => 
      tx.verification_status === 'rejected'
    ).length;

    const duplicatePayments = allTransactions.filter((tx, index, arr) => 
      tx.transaction_id && arr.findIndex(t => t.transaction_id === tx.transaction_id) !== index
    ).length;

    return { suspiciousTransactions, failedTransactions, duplicatePayments };
  };

  const handleDeleteGame = async (gameId: string, gameName: string) => {
    if (!confirm(`Are you sure you want to delete the game "${gameName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      // Delete boxes first, then game
      await supabase.from('boxes').delete().eq('game_id', gameId);
      const { error } = await supabase.from('games').delete().eq('id', gameId);

      if (error) throw error;
      
      alert(`Game "${gameName}" has been deleted successfully.`);
      loadAdminData();
    } catch (error) {
      console.error('Error deleting game:', error);
      alert(`An error occurred while deleting the game: ${error.message}`);
    }
  };

  const handleApproveWithdrawal = async (transactionId: string, amount: number, cashAppUsername: string) => {
    try {
      const { data, error } = await supabase.rpc('complete_withdrawal', {
        transaction_uuid: transactionId,
        admin_id: user.id
      });

      if (error) throw error;
      
      alert(`✅ Withdrawal approved! Remember to send $${amount} to ${cashAppUsername} via CashApp.`);
      loadAdminData();
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert('Failed to approve withdrawal. Please try again.');
    }
  };

  const handleRejectWithdrawal = async (transactionId: string, amount: number) => {
    if (!confirm(`Are you sure you want to reject this $${amount} withdrawal? This will refund the user.`)) {
      return;
    }

    try {
      const { data, error } = await supabase.rpc('cancel_withdrawal', {
        transaction_uuid: transactionId,
        admin_id: user.id
      });

      if (error) throw error;
      
      alert(`❌ Withdrawal rejected and user refunded $${amount}.`);
      loadAdminData();
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('Failed to reject withdrawal. Please try again.');
    }
  };

  const handleApprovePayment = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.rpc('approve_payment', {
        transaction_uuid: transactionId,
        admin_id: user.id
      });

      if (error) throw error;
      
      alert('Payment approved successfully!');
      loadAdminData();
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Failed to approve payment. Please try again.');
    }
  };

  // Bulk operations functions
  const handleBulkBalanceAdjustment = async () => {
    if (selectedUsers.length === 0 || !bulkAmount) {
      alert('Please select users and enter an amount');
      return;
    }

    const amount = parseInt(bulkAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount');
      return;
    }

    const confirmMessage = `Are you sure you want to ${bulkType} $${amount} ${bulkType === 'add' ? 'to' : 'from'} ${selectedUsers.length} users?`;
    if (!confirm(confirmMessage)) return;

    try {
      for (const userId of selectedUsers) {
        const user = allUsers.find(u => u.id === userId);
        if (!user) continue;

        const newBalance = bulkType === 'add' 
          ? user.hotcoin_balance + amount 
          : Math.max(0, user.hotcoin_balance - amount);

        // Update user balance
        await supabase
          .from('profiles')
          .update({ hotcoin_balance: newBalance })
          .eq('id', userId);

        // Create transaction record
        await supabase
          .from('hotcoin_transactions')
          .insert({
            user_id: userId,
            type: bulkType === 'add' ? 'purchase' : 'refund',
            amount: amount,
            description: `Bulk ${bulkType === 'add' ? 'credit' : 'debit'} by admin${bulkMessage ? ': ' + bulkMessage : ''}`,
            verification_status: 'approved',
            verified_by: user.id,
            verified_at: new Date().toISOString()
          });
      }

      alert(`Successfully ${bulkType === 'add' ? 'added' : 'subtracted'} $${amount} ${bulkType === 'add' ? 'to' : 'from'} ${selectedUsers.length} users`);
      setSelectedUsers([]);
      setBulkAmount('');
      setBulkMessage('');
      setShowBulkOps(false);
      loadAdminData();
    } catch (error) {
      console.error('Bulk operation error:', error);
      alert('Failed to complete bulk operation');
    }
  };

  const handleBulkGameDeletion = async () => {
    const inactiveGames = games.filter(g => !g.is_active);
    if (inactiveGames.length === 0) {
      alert('No inactive games to delete');
      return;
    }

    if (!confirm(`Delete all ${inactiveGames.length} inactive games? This cannot be undone.`)) {
      return;
    }

    try {
      for (const game of inactiveGames) {
        await supabase.from('boxes').delete().eq('game_id', game.id);
        await supabase.from('games').delete().eq('id', game.id);
      }
      
      alert(`Successfully deleted ${inactiveGames.length} inactive games`);
      loadAdminData();
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert('Failed to delete games');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(allUsers.map(u => u.id));
  };

  const clearUserSelection = () => {
    setSelectedUsers([]);
  };

  const handleMassAssignNumbers = async () => {
    const gamesNeedingNumbers = games.filter(g => g.is_active && !g.numbers_assigned);
    
    if (gamesNeedingNumbers.length === 0) {
      alert('No active games need number assignment');
      return;
    }

    if (!confirm(`Assign numbers to ${gamesNeedingNumbers.length} games?`)) {
      return;
    }

    try {
      let assigned = 0;
      
      for (const game of gamesNeedingNumbers) {
        const shuffle = (arr: number[]) => {
          for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
          }
          return arr;
        };
        
        const home = shuffle([0,1,2,3,4,5,6,7,8,9]);
        const away = shuffle([0,1,2,3,4,5,6,7,8,9]);
        
        const { error } = await supabase
          .from('games')
          .update({ 
            home_numbers: home, 
            away_numbers: away, 
            numbers_assigned: true 
          })
          .eq('id', game.id);
        
        if (!error) assigned++;
      }
      
      alert(`Successfully assigned numbers to ${assigned} games!`);
      loadAdminData();
    } catch (error) {
      console.error('Mass assign error:', error);
      alert('Failed to assign numbers');
    }
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

  const financialMetrics = getFinancialMetrics();
  const userAnalytics = getUserAnalytics();
  const gameAnalytics = getGameAnalytics();
  const securityMetrics = getSecurityMetrics();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ultimate Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time platform control center</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={() => setShowBulkOps(!showBulkOps)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Bulk Operations
          </button>
          <Link
            href="/admin/games/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Add New Game
          </Link>
        </div>
      </div>

      {/* Universal Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search users, games, transactions, or IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Search Results */}
        {searchQuery && Object.keys(searchResults).length > 0 && (
          <div className="mt-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
            {searchResults.users && searchResults.users.length > 0 && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">👥 Users ({searchResults.users.length})</h3>
                {searchResults.users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="h-4 w-4 text-indigo-600 rounded"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username || user.email}</p>
                        <p className="text-xs text-gray-500">{user.hotcoin_balance || 0} HC • {user.email}</p>
                      </div>
                    </div>
                    <Link href={`/admin/users/${user.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm">View</Link>
                  </div>
                ))}
              </div>
            )}

            {searchResults.games && searchResults.games.length > 0 && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">🎮 Games ({searchResults.games.length})</h3>
                {searchResults.games.map((game: any) => (
                  <div key={game.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{game.name}</p>
                      <p className="text-xs text-gray-500">{game.sport} • {game.home_team} vs {game.away_team}</p>
                    </div>
                    <Link href={`/admin/games/${game.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm">Manage</Link>
                  </div>
                ))}
              </div>
            )}

            {searchResults.transactions && searchResults.transactions.length > 0 && (
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">💰 Transactions ({searchResults.transactions.length})</h3>
                {searchResults.transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {tx.amount} HC - {tx.type} {tx.transaction_id ? `(${tx.transaction_id})` : ''}
                      </p>
                      <p className="text-xs text-gray-500">{tx.profiles?.email} • {new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      tx.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                      tx.verification_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.verification_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Operations Panel */}
      {showBulkOps && (
        <div className="mb-8 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-4">🔧 Bulk Operations</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Operations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">👥 User Operations</h3>
              
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <button
                    onClick={selectAllUsers}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-sm hover:bg-indigo-200"
                  >
                    Select All Users ({allUsers.length})
                  </button>
                  <button
                    onClick={clearUserSelection}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                  >
                    Clear Selection
                  </button>
                </div>

                <div className="text-sm text-gray-600">
                  Selected: {selectedUsers.length} users
                </div>

                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <select
                      value={bulkType}
                      onChange={(e) => setBulkType(e.target.value as 'add' | 'subtract')}
                      className="px-3 py-2 border rounded text-sm"
                    >
                      <option value="add">Add Balance</option>
                      <option value="subtract">Subtract Balance</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                      className="px-3 py-2 border rounded text-sm w-32"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Optional reason/message"
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />

                  <button
                    onClick={handleBulkBalanceAdjustment}
                    disabled={selectedUsers.length === 0 || !bulkAmount}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-2 rounded text-sm font-medium"
                  >
                    {bulkType === 'add' ? 'Add' : 'Subtract'} ${bulkAmount || 0} {bulkType === 'add' ? 'to' : 'from'} {selectedUsers.length} users
                  </button>
                </div>
              </div>
            </div>

            {/* Game Operations */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">🎮 Game Operations</h3>
              
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Inactive games: {games.filter(g => !g.is_active).length}
                </div>

                <button
                  onClick={handleBulkGameDeletion}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-medium"
                >
                  Delete All Inactive Games
                </button>

                <div className="text-xs text-gray-500">
                  This will permanently delete all games that are marked as inactive, including all associated boxes and data.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {(pendingWithdrawals.length > 0 || pendingPayments.length > 0 || securityMetrics.suspiciousTransactions > 0) && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 rounded-md">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🚨</span>
            <div>
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Critical Actions Required</h3>
              <p className="text-red-700 dark:text-red-300">
                {pendingWithdrawals.length} pending withdrawals • {pendingPayments.length} pending payments • {securityMetrics.suspiciousTransactions} security alerts
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Financial Analytics Dashboard */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">💰 Financial Analytics ({selectedTimeframe})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Revenue</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{financialMetrics.revenue} HC</p>
              </div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📈</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Net Profit</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{financialMetrics.profit} HC</p>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">💎</span>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Withdrawals</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{financialMetrics.withdrawals} HC</p>
              </div>
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">💸</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Avg Transaction</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{Math.round(financialMetrics.avgTransactionSize)} HC</p>
              </div>
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🎯</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Analytics */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">👥 User Intelligence</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">User Segments</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">High Value (&gt;$100)</span>
                <span className="text-lg font-bold text-green-600">{userAnalytics.highValue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Medium Value ($25-$100)</span>
                <span className="text-lg font-bold text-blue-600">{userAnalytics.mediumValue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Low Value ($1-$25)</span>
                <span className="text-lg font-bold text-orange-600">{userAnalytics.lowValue}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">New This Week</span>
                <span className="text-lg font-bold text-purple-600">{userAnalytics.newUsersThisWeek}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Top Spenders</h3>
            <div className="space-y-3">
              {userAnalytics.topSpenders.map((user, index) => (
                <div key={user.id} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm text-gray-900 dark:text-white">{user.username || user.email}</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">{user.hotcoin_balance || 0} HC</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Game Performance Analytics */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🎮 Game Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Games</p>
            <p className="text-xl font-bold text-green-600">{gameAnalytics.activeGames}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Games</p>
            <p className="text-xl font-bold text-blue-600">{gameAnalytics.totalGames}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">NFL Games</p>
            <p className="text-xl font-bold text-orange-600">{gameAnalytics.nflGames}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">NBA Games</p>
            <p className="text-xl font-bold text-purple-600">{gameAnalytics.nbaGames}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Top Game Revenue</p>
            <p className="text-xl font-bold text-green-600">{gameAnalytics.gamePerformance[0]?.revenue || 0} HC</p>
          </div>
        </div>
      </div>

      {/* Security & Fraud Monitoring */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔒 Security Monitoring</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Suspicious Transactions</p>
                <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">{securityMetrics.suspiciousTransactions}</p>
              </div>
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Failed Transactions</p>
                <p className="text-xl font-bold text-red-900 dark:text-red-100">{securityMetrics.failedTransactions}</p>
              </div>
              <span className="text-2xl">❌</span>
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">System Health</p>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">Healthy</p>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Activity Feed */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">⚡ Live Activity Feed</h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.type === 'purchase' ? 'bg-green-500' :
                        activity.type === 'withdrawal' ? 'bg-red-500' :
                        activity.type === 'payout' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.type === 'purchase' ? '💰' : 
                           activity.type === 'withdrawal' ? '💸' :
                           activity.type === 'payout' ? '🎉' : '📝'} 
                          {activity.user} - ${activity.amount} ({activity.type})
                        </p>
                        <p className="text-xs text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No recent activity
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      {(pendingWithdrawals.length > 0 || pendingPayments.length > 0) && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
            ⚠️ Pending Actions ({pendingWithdrawals.length + pendingPayments.length})
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Withdrawals */}
            {pendingWithdrawals.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-4">
                  💸 Pending Withdrawals ({pendingWithdrawals.length})
                </h3>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {pendingWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="bg-white dark:bg-gray-800 p-4 rounded-md border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${withdrawal.amount} → {withdrawal.cashapp_username}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {withdrawal.profiles?.email} ({withdrawal.profiles?.username || 'No username'})
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(withdrawal.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveWithdrawal(withdrawal.id, withdrawal.amount, withdrawal.cashapp_username)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(withdrawal.id, withdrawal.amount)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Payments */}
            {pendingPayments.length > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
                  💰 Pending Payments ({pendingPayments.length})
                </h3>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {pendingPayments.map((payment) => (
                    <div key={payment.id} className="bg-white dark:bg-gray-800 p-4 rounded-md border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${payment.amount} from {payment.profiles?.email}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Transaction ID: {payment.transaction_id}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(payment.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApprovePayment(payment.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            🚀 Quick Actions
          </h3>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-4 p-4">
            <Link href="/admin/games/create" className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 p-4 rounded-lg text-center transition-colors">
              <div className="text-2xl mb-2">🏈</div>
              <div className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Add NFL Game</div>
            </Link>
            <Link href="/admin/games/create?sport=NBA" className="bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/50 p-4 rounded-lg text-center transition-colors">
              <div className="text-2xl mb-2">🏀</div>
              <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Add NBA Game</div>
            </Link>
            <Link href="/admin/payments" className="bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 p-4 rounded-lg text-center transition-colors">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300">Payments</div>
            </Link>
            <Link href="/admin/users" className="bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 p-4 rounded-lg text-center transition-colors">
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Users</div>
            </Link>
            <Link href="/admin/analytics" className="bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 p-4 rounded-lg text-center transition-colors">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Analytics</div>
            </Link>
            <Link href="/admin/config" className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 p-4 rounded-lg text-center transition-colors">
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm font-medium text-red-700 dark:text-red-300">System Config</div>
            </Link>
            <Link href="/admin/terms" className="bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 p-4 rounded-lg text-center transition-colors">
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">Terms Management</div>
            </Link>
            <Link href="/admin/support" className="bg-pink-50 dark:bg-pink-900/30 hover:bg-pink-100 dark:hover:bg-pink-900/50 p-4 rounded-lg text-center transition-colors">
              <div className="text-2xl mb-2">📧</div>
              <div className="text-sm font-medium text-pink-700 dark:text-pink-300">Support Tickets</div>
            </Link>
            <button onClick={handleMassAssignNumbers} className="bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/50 p-4 rounded-lg text-center transition-colors">
              <div className="text-2xl mb-2">🎲</div>
              <div className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Assign Numbers</div>
            </button>
            <Link href="/games" className="bg-gray-50 dark:bg-gray-900/30 hover:bg-gray-100 dark:hover:bg-gray-900/50 p-4 rounded-lg text-center transition-colors">
              <div className="text-2xl mb-2">🌐</div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Site</div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Games */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            🎮 Recent Games
          </h3>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
          {games && games.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {games.slice(0, 10).map((game) => (
                <li key={game.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {game.sport}
                      </span>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {game.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {game.home_team} vs {game.away_team} • {game.entry_fee === 0 ? 'Free' : `${game.entry_fee} HC`} per box
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {game.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                          Closed
                        </span>
                      )}
                      <Link href={`/admin/games/${game.id}`} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
                        Manage
                      </Link>
                      <button
                        onClick={() => handleDeleteGame(game.id, game.name)}
                        className="text-red-600 dark:text-red-400 hover:text-red-500 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No games yet. Create your first game!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}