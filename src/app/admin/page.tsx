 'use client';

  import { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import { supabase } from '@/lib/supabase';
  import Link from 'next/link';

  export default function AdminPage() {
    const [user, setUser] = useState<any>(null);
    const [games, setGames] = useState<any[]>([]);
    const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      loadAdminData();
    }, []);

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

        // Load games
        const { data: gamesData } = await supabase
          .from('games')
          .select('*')
          .order('game_date', { ascending: false })
          .limit(10);

        setGames(gamesData || []);

        // Load pending withdrawals
        const { data: withdrawalsData } = await supabase
          .from('hotcoin_transactions')
          .select(`
            *,
            profiles:user_id (
              username,
              email,
              hotcoin_balance
            )
          `)
          .eq('type', 'withdrawal')
          .eq('verification_status', 'pending')
          .order('created_at', { ascending: false });

        setPendingWithdrawals(withdrawalsData || []);

        // Load pending payments (over $100)
        const { data: paymentsData } = await supabase
          .from('hotcoin_transactions')
          .select(`
            *,
            profiles:user_id (
              username,
              email
            )
          `)
          .eq('type', 'purchase')
          .eq('verification_status', 'pending')
          .order('created_at', { ascending: false });

        setPendingPayments(paymentsData || []);

        // Load recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(10);

        setRecentUsers(usersData || []);

      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteGame = async (gameId: string, gameName: string) => {
      if (!confirm(`Are you sure you want to delete the game "${gameName}"? This action cannot be undone.`)) {
        return;
      }

      try {
        console.log('Starting deletion for game:', gameId);

        // First, check how many boxes exist for this game
        const { data: existingBoxes, error: checkError } = await supabase
          .from('boxes')
          .select('id')
          .eq('game_id', gameId);

        if (checkError) {
          console.error('Error checking boxes:', checkError);
          alert(`Error checking boxes: ${checkError.message}`);
          return;
        }

        console.log(`Found ${existingBoxes?.length || 0} boxes to delete`);

        // Delete all boxes for this game
        const { data: deletedBoxes, error: boxesError } = await supabase
          .from('boxes')
          .delete()
          .eq('game_id', gameId)
          .select();

        if (boxesError) {
          console.error('Error deleting boxes:', boxesError);
          alert(`Failed to delete game boxes: ${boxesError.message}`);
          return;
        }

        console.log(`Deleted ${deletedBoxes?.length || 0} boxes`);

        // Then delete the game
        const { data: deletedGame, error: gameError } = await supabase
          .from('games')
          .delete()
          .eq('id', gameId)
          .select();

        if (gameError) {
          console.error('Error deleting game:', gameError);
          alert(`Failed to delete game: ${gameError.message}`);
          return;
        }

        console.log('Deleted game:', deletedGame);

        if (!deletedGame || deletedGame.length === 0) {
          alert('Game was not found or could not be deleted. It may have already been removed.');
          return;
        }

        // Refresh the games list
        await loadAdminData();
        alert(`Game "${gameName}" has been deleted successfully.`);
      } catch (error) {
        console.error('Error deleting game:', error);
        alert(`An error occurred while deleting the game: ${error.message || error}`);
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
        loadAdminData(); // Refresh data
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
        loadAdminData(); // Refresh data
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
        loadAdminData(); // Refresh data
      } catch (error) {
        console.error('Error approving payment:', error);
        alert('Failed to approve payment. Please try again.');
      }
    };

    const handleRejectPayment = async (transactionId: string) => {
      try {
        const { data, error } = await supabase.rpc('reject_payment', {
          transaction_uuid: transactionId,
          admin_id: user.id
        });

        if (error) throw error;
        
        alert('Payment rejected.');
        loadAdminData(); // Refresh data
      } catch (error) {
        console.error('Error rejecting payment:', error);
        alert('Failed to reject payment. Please try again.');
      }
    };

    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 
  border-indigo-600"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    const activeGames = games.filter(g => g.is_active).length;
    const totalGames = games.length;
    const totalRevenue = games.reduce((sum, game) => {
      return sum + (game.entry_fee * 100);
    }, 0);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <Link
            href="/admin/games/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Add New Game
          </Link>
        </div>

        {/* Pending Actions - High Priority */}
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
                  <div className="space-y-4">
                    {pendingWithdrawals.slice(0, 3).map((withdrawal) => (
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
                    {pendingWithdrawals.length > 3 && (
                      <Link href="/admin/payments" className="text-red-600 dark:text-red-400 text-sm hover:underline">
                        View all {pendingWithdrawals.length} pending withdrawals →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Pending Payments */}
              {pendingPayments.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-4">
                    💰 Pending Payments ({pendingPayments.length})
                  </h3>
                  <div className="space-y-4">
                    {pendingPayments.slice(0, 3).map((payment) => (
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
                            <button
                              onClick={() => handleRejectPayment(payment.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {pendingPayments.length > 3 && (
                      <Link href="/admin/payments" className="text-yellow-600 dark:text-yellow-400 text-sm hover:underline">
                        View all {pendingPayments.length} pending payments →
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center 
  justify-center">
                    <span className="text-white text-sm font-bold">🎮</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400
   truncate">
                      Active Games
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {activeGames}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center 
  justify-center">
                    <span className="text-white text-sm font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400
   truncate">
                      Potential Revenue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {totalRevenue} HC
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center 
  justify-center">
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400
   truncate">
                      Total Games
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {totalGames}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md 
  mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 
  dark:text-white">
              Quick Actions
            </h3>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              <Link
                href="/admin/games/create"
                className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 
  dark:hover:bg-indigo-900/50 p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">🏈</div>
                <div className="text-sm font-medium text-indigo-700 
  dark:text-indigo-300">
                  Add NFL Game
                </div>
              </Link>
              <Link
                href="/admin/games/create?sport=NBA"
                className="bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 
  dark:hover:bg-orange-900/50 p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">🏀</div>
                <div className="text-sm font-medium text-orange-700 
  dark:text-orange-300">
                  Add NBA Game
                </div>
              </Link>
              <Link
                href="/admin/payments"
                className="bg-green-50 dark:bg-green-900/30 hover:bg-green-100 
  dark:hover:bg-green-900/50 p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm font-medium text-green-700 
  dark:text-green-300">
                  Verify Payments
                </div>
              </Link>
              <Link
                href="/admin/payments"
                className="bg-green-50 dark:bg-green-900/30 hover:bg-green-100 
  dark:hover:bg-green-900/50 p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">💰</div>
                <div className="text-sm font-medium text-green-700 
  dark:text-green-300">
                  All Payments
                </div>
              </Link>
              <Link
                href="/admin/users"
                className="bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 
  dark:hover:bg-purple-900/50 p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">👥</div>
                <div className="text-sm font-medium text-purple-700 
  dark:text-purple-300">
                  Manage Users
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Users */}
        {recentUsers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md mb-8">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                👥 Recent Users ({recentUsers.length} new this week)
              </h3>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentUsers.slice(0, 5).map((user) => (
                  <li key={user.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                            {user.username ? user.username[0].toUpperCase() : user.email[0].toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.username || 'No username'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email} • ${user.hotcoin_balance || 0} HC
                          </div>
                          <div className="text-xs text-gray-400">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {user.is_admin && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                            Admin
                          </span>
                        )}
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium"
                        >
                          View Profile
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {recentUsers.length > 5 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                  <Link href="/admin/users" className="text-indigo-600 dark:text-indigo-400 text-sm hover:underline">
                    View all {recentUsers.length} recent users →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent Games */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden 
  sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 
  dark:text-white">
              Recent Games
            </h3>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            {games && games.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {games.map((game) => (
                  <li key={game.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-0.5 
  rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 
  dark:text-blue-200">
                            {game.sport}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 
  dark:text-white">
                            {game.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {game.home_team} vs {game.away_team} • {game.entry_fee} HC
  per box
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {game.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 
  rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 
  dark:text-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 
  rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 
  dark:text-gray-200">
                            Closed
                          </span>
                        )}
                        <Link
                          href={`/admin/games/${game.id}`}
                          className="text-indigo-600 dark:text-indigo-400 
  hover:text-indigo-500 text-sm font-medium"
                        >
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
                <p className="text-gray-500 dark:text-gray-400">No games yet. Create
  your first game!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
