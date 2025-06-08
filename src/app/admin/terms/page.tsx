'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminTermsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Terms data
  const [currentVersion, setCurrentVersion] = useState('1.0');
  const [newVersion, setNewVersion] = useState('');
  const [userAcceptanceData, setUserAcceptanceData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
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

      // Load current terms version
      const { data: configData } = await supabase
        .from('system_config')
        .select('value')
        .eq('key', 'terms_current_version')
        .single();

      if (configData) {
        setCurrentVersion(configData.value);
      }

      // Load user acceptance data
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, username, email, terms_version, terms_accepted_at, created_at')
        .order('terms_accepted_at', { ascending: false, nullsFirst: false });

      setUserAcceptanceData(usersData || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateTermsVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.trim()) {
      showMessage('error', 'Please enter a new version number');
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('system_config')
        .update({ 
          value: newVersion.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('key', 'terms_current_version');

      if (error) throw error;

      setCurrentVersion(newVersion.trim());
      setNewVersion('');
      showMessage('success', `Terms version updated to ${newVersion.trim()}. Users will need to accept the new terms.`);
      
      // Reload data to refresh acceptance status
      setTimeout(() => loadAdminData(), 1000);
    } catch (error) {
      console.error('Error updating terms version:', error);
      showMessage('error', `Failed to update terms version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const getAcceptanceStats = () => {
    const totalUsers = userAcceptanceData.length;
    const acceptedCurrentVersion = userAcceptanceData.filter(user => user.terms_version === currentVersion).length;
    const neverAccepted = userAcceptanceData.filter(user => !user.terms_version).length;
    const outdatedVersion = userAcceptanceData.filter(user => user.terms_version && user.terms_version !== currentVersion).length;

    return { totalUsers, acceptedCurrentVersion, neverAccepted, outdatedVersion };
  };

  const filteredUsers = userAcceptanceData.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.terms_version?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const stats = getAcceptanceStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms Management</h1>
          <p className="mt-1 text-lg text-gray-500 dark:text-gray-400">
            Manage terms versions and track user acceptance
          </p>
        </div>
        <Link
          href="/admin"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Current Version & Update */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📋 Current Terms Version</h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{currentVersion}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Active Version</div>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p><strong>Last Updated:</strong> See system config for timestamps</p>
              <p><strong>Active Since:</strong> When this version was set</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🔄 Update Terms Version</h2>
          
          <form onSubmit={handleUpdateTermsVersion} className="space-y-4">
            <div>
              <label htmlFor="newVersion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Version Number
              </label>
              <input
                type="text"
                id="newVersion"
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 1.1, 2.0"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Users will be prompted to accept the new terms</p>
            </div>

            <button
              type="submit"
              disabled={saving || !newVersion.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {saving ? 'Updating...' : 'Update Terms Version'}
            </button>
          </form>

          <div className="mt-4 text-xs text-gray-500">
            <strong>⚠️ Warning:</strong> Updating the terms version will require all users to accept the new terms before they can continue using the platform.
          </div>
        </div>
      </div>

      {/* Acceptance Statistics */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📊 Acceptance Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.acceptedCurrentVersion}</div>
            <div className="text-sm text-green-700 dark:text-green-300">Accepted Current Version</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.outdatedVersion}</div>
            <div className="text-sm text-yellow-700 dark:text-yellow-300">Outdated Version</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.neverAccepted}</div>
            <div className="text-sm text-red-700 dark:text-red-300">Never Accepted</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUsers}</div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Total Users</div>
          </div>
        </div>
      </div>

      {/* User Acceptance Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">👥 User Acceptance Status</h2>
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Version Accepted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acceptance Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((userData) => (
                <tr key={userData.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {userData.username || userData.email}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {userData.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {userData.terms_version || 'None'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {userData.terms_accepted_at 
                        ? new Date(userData.terms_accepted_at).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      userData.terms_version === currentVersion
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : userData.terms_version
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {userData.terms_version === currentVersion
                        ? 'Current'
                        : userData.terms_version
                        ? 'Outdated'
                        : 'Never Accepted'
                      }
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No users found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}