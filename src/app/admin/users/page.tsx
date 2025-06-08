'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface User {
  id: string;
  username: string;
  email: string;
  hotcoin_balance: number;
  is_admin: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'recent' | 'active' | 'admins'>('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser?.is_admin) {
      loadUsers();
    }
  }, [currentUser, filter]);

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

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'recent') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte('created_at', sevenDaysAgo.toISOString());
      } else if (filter === 'active') {
        query = query.gt('hotcoin_balance', 0);
      } else if (filter === 'admins') {
        query = query.eq('is_admin', true);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      let filteredUsers = data || [];
      
      if (searchTerm) {
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleEditBalance = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ hotcoin_balance: newBalance })
        .eq('id', userId);

      if (error) throw error;

      // Record transaction for audit trail
      await supabase
        .from('hotcoin_transactions')
        .insert([{
          user_id: userId,
          type: 'refund',
          amount: newBalance,
          description: `Admin adjustment by ${currentUser.email}`,
          verification_status: 'approved',
          verified_by: currentUser.id,
          verified_at: new Date().toISOString()
        }]);

      alert(`✅ Balance updated to $${newBalance}`);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error updating balance:', error);
      alert('Failed to update balance');
    }
  };

  const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'remove admin' : 'grant admin'} privileges?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      alert(`✅ Admin status ${currentStatus ? 'removed' : 'granted'}`);
      loadUsers();
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Failed to update admin status');
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    // Prevent deleting self
    if (userId === currentUser.id) {
      alert('❌ You cannot delete your own account!');
      return;
    }

    const confirmMessage = `⚠️ DANGER: Delete user "${userEmail}"?\n\nThis will permanently delete:\n• User account and profile\n• All game boxes and entries\n• All transaction history\n• All related data\n\nThis action CANNOT be undone!\n\nType "DELETE" to confirm:`;
    
    const confirmation = prompt(confirmMessage);
    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      setLoading(true);
      
      // Delete in proper order due to foreign key constraints
      // 1. Delete user's boxes first
      const { error: boxesError } = await supabase
        .from('boxes')
        .delete()
        .eq('user_id', userId);

      if (boxesError) {
        console.error('Error deleting user boxes:', boxesError);
        throw new Error('Failed to delete user game entries');
      }

      // 2. Delete user's transactions
      const { error: transactionsError } = await supabase
        .from('hotcoin_transactions')
        .delete()
        .eq('user_id', userId);

      if (transactionsError) {
        console.error('Error deleting user transactions:', transactionsError);
        throw new Error('Failed to delete user transaction history');
      }

      // 3. Delete the user profile (this also handles auth user deletion via RLS/triggers if setup)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting user profile:', profileError);
        throw new Error('Failed to delete user profile');
      }

      alert(`✅ User "${userEmail}" has been permanently deleted along with all associated data.`);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`❌ Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <Link
            href="/admin"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by email or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'All Users' },
              { key: 'recent', label: 'Recent (7d)' },
              { key: 'active', label: 'Active (>$0)' },
              { key: 'admins', label: 'Admins' }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  filter === filterOption.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {users.length} Users Found
          </h3>
        </div>
        
        {users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No users found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <li key={user.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                        {user.username ? user.username[0].toUpperCase() : user.email[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.username || 'No username'}
                        </div>
                        {user.is_admin && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-400">
                        Joined {new Date(user.created_at).toLocaleDateString()} • 
                        Balance: <span className="font-semibold">${user.hotcoin_balance}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {editingUser === user.id ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={newBalance}
                          onChange={(e) => setNewBalance(Number(e.target.value))}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-sm dark:bg-gray-700 dark:text-white"
                          placeholder="$0"
                        />
                        <button
                          onClick={() => handleEditBalance(user.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingUser(user.id);
                            setNewBalance(user.hotcoin_balance);
                          }}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium"
                        >
                          Edit Balance
                        </button>
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                          className={`text-sm font-medium ${
                            user.is_admin 
                              ? 'text-red-600 dark:text-red-400 hover:text-red-500'
                              : 'text-green-600 dark:text-green-400 hover:text-green-500'
                          }`}
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-500 text-sm font-medium"
                        >
                          View Profile
                        </Link>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          disabled={user.id === currentUser?.id}
                          className={`text-sm font-medium ${
                            user.id === currentUser?.id
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 dark:text-red-400 hover:text-red-500'
                          }`}
                          title={user.id === currentUser?.id ? 'Cannot delete your own account' : 'Delete user permanently'}
                        >
                          {user.id === currentUser?.id ? '🔒 Self' : '🗑️ Delete'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          👥 User Management Actions
        </h3>
        <div className="text-blue-800 dark:text-blue-200 space-y-2">
          <p><strong>Edit Balance:</strong> Click "Edit Balance" to adjust user's HotCoin balance (for giveaways, refunds, etc.)</p>
          <p><strong>Admin Rights:</strong> Click "Make Admin" or "Remove Admin" to manage admin privileges</p>
          <p><strong>View Profile:</strong> Click "View Profile" to see detailed transaction history and user activity</p>
          <p><strong>Delete User:</strong> Click "🗑️ Delete" to permanently remove user and all their data (requires typing "DELETE" to confirm)</p>
          <p><strong>Search:</strong> Use the search box to find users by email or username</p>
        </div>
      </div>
    </div>
  );
}