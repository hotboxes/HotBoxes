'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  hotcoin_balance: number;
  is_admin: boolean;
  created_at: string;
}

interface Transaction {
  id: string;
  type: 'purchase' | 'bet' | 'payout' | 'refund' | 'withdrawal';
  amount: number;
  description: string;
  created_at: string;
  verification_status?: string;
  transaction_id?: string;
  cashapp_username?: string;
  game_id?: string;
  games?: {
    name: string;
  };
}

export default function AdminUserProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBalance, setEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser?.is_admin && userId) {
      loadUserData();
    }
  }, [currentUser, userId]);

  const checkUser = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      // Load user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);
      setNewBalance(profile.hotcoin_balance);

      // Load transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('hotcoin_transactions')
        .select(`
          *,
          games (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (transactionError) throw transactionError;
      setTransactions(transactionData || []);

    } catch (error) {
      console.error('Error loading user data:', error);
      alert('Failed to load user data');
    }
  };

  const handleUpdateBalance = async () => {
    if (!adjustmentReason.trim()) {
      alert('Please provide a reason for the balance adjustment');
      return;
    }

    try {
      const oldBalance = userProfile?.hotcoin_balance || 0;
      const difference = newBalance - oldBalance;
      
      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ hotcoin_balance: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Record transaction for audit trail
      await supabase
        .from('hotcoin_transactions')
        .insert([{
          user_id: userId,
          type: difference > 0 ? 'refund' : 'bet',
          amount: Math.abs(difference),
          description: `Admin adjustment: ${adjustmentReason} (by ${currentUser.email})`,
          verification_status: 'approved',
          verified_by: currentUser.id,
          verified_at: new Date().toISOString()
        }]);

      alert(`✅ Balance updated from $${oldBalance} to $${newBalance}`);
      setEditingBalance(false);
      setAdjustmentReason('');
      loadUserData();
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Failed to update balance');
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase': return '💰';
      case 'bet': return '🎮';
      case 'payout': return '🏆';
      case 'withdrawal': return '💸';
      case 'refund': return '🔄';
      default: return '📄';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-green-600 dark:text-green-400';
      case 'bet': return 'text-blue-600 dark:text-blue-400';
      case 'payout': return 'text-yellow-600 dark:text-yellow-400';
      case 'withdrawal': return 'text-red-600 dark:text-red-400';
      case 'refund': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Not Found</h1>
          <Link href="/admin/users" className="text-indigo-600 dark:text-indigo-400 hover:underline">
            ← Back to Users
          </Link>
        </div>
      </div>
    );
  }

  const totalPurchases = transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0);
  const totalBets = transactions.filter(t => t.type === 'bet').reduce((sum, t) => sum + t.amount, 0);
  const totalWinnings = transactions.filter(t => t.type === 'payout').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Profile</h1>
          <Link
            href="/admin/users"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            ← Back to Users
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Info */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-bold">
                {userProfile.username ? userProfile.username[0].toUpperCase() : userProfile.email[0].toUpperCase()}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {userProfile.username || 'No username'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{userProfile.email}</p>
                {userProfile.is_admin && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 mt-1">
                    Admin
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Balance
                </label>
                {editingBalance ? (
                  <div className="space-y-2 mt-1">
                    <input
                      type="number"
                      value={newBalance}
                      onChange={(e) => setNewBalance(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                    <textarea
                      placeholder="Reason for adjustment (required)..."
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      rows={2}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleUpdateBalance}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingBalance(false);
                          setNewBalance(userProfile.hotcoin_balance);
                          setAdjustmentReason('');
                        }}
                        className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${userProfile.hotcoin_balance}
                    </span>
                    <button
                      onClick={() => setEditingBalance(true)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Member Since
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(userProfile.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  User ID
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-mono">
                  {userProfile.id}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Activity Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Purchases:</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">${totalPurchases}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Bets:</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">${totalBets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Winnings:</span>
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">${totalWinnings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Withdrawals:</span>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">${totalWithdrawals}</span>
              </div>
              <hr className="border-gray-200 dark:border-gray-700" />
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Net Position:</span>
                <span className={`text-sm font-bold ${(totalPurchases + totalWinnings - totalBets - totalWithdrawals) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  ${totalPurchases + totalWinnings - totalBets - totalWithdrawals}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Transaction History ({transactions.length})
              </h3>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No transactions found.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">{getTransactionIcon(transaction.type)}</span>
                        </div>
                        <div className="ml-4">
                          <div className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                            {transaction.verification_status === 'pending' && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                                Pending
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {transaction.description}
                          </div>
                          {transaction.games?.name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Game: {transaction.games.name}
                            </div>
                          )}
                          {transaction.transaction_id && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Transaction ID: {transaction.transaction_id}
                            </div>
                          )}
                          {transaction.cashapp_username && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              CashApp: {transaction.cashapp_username}
                            </div>
                          )}
                          <div className="text-xs text-gray-400">
                            {new Date(transaction.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-semibold ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'bet' || transaction.type === 'withdrawal' ? '-' : '+'}${transaction.amount}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}