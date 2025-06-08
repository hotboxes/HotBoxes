'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  
  // Profile form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  
  // Security form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Preferences form states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [gameAlerts, setGameAlerts] = useState(true);
  const [winningAlerts, setWinningAlerts] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  
  // Responsible gambling settings
  const [dailySpendLimit, setDailySpendLimit] = useState<number | ''>('');
  const [weeklySpendLimit, setWeeklySpendLimit] = useState<number | ''>('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [selfExclusionDays, setSelfExclusionDays] = useState<number | ''>('');
  
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/login');
        return;
      }

      setUser(authUser);
      setEmail(authUser.email || '');

      // Load profile data
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setUsername(profileData.username || '');
        setEmailNotifications(profileData.email_notifications ?? true);
        setGameAlerts(profileData.game_alerts ?? true);
        setWinningAlerts(profileData.winning_alerts ?? true);
        setMarketingEmails(profileData.marketing_emails ?? false);
        setDailySpendLimit(profileData.daily_spend_limit || '');
        setWeeklySpendLimit(profileData.weekly_spend_limit || '');
        setTimeLimit(profileData.session_time_limit || '');
        setSelfExclusionDays(profileData.self_exclusion_days || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Update username in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update email in auth if changed
      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: email
        });

        if (emailError) throw emailError;
        showMessage('success', 'Profile updated! Please check your email to confirm the new email address.');
      } else {
        showMessage('success', 'Profile updated successfully!');
      }

      // Reload data to reflect changes
      await loadUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', `Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      setSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long');
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showMessage('success', 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('error', `Failed to update password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          email_notifications: emailNotifications,
          game_alerts: gameAlerts,
          winning_alerts: winningAlerts,
          marketing_emails: marketingEmails,
          daily_spend_limit: dailySpendLimit || null,
          weekly_spend_limit: weeklySpendLimit || null,
          session_time_limit: timeLimit || null,
          self_exclusion_days: selfExclusionDays || null,
          self_exclusion_until: selfExclusionDays ? 
            new Date(Date.now() + (Number(selfExclusionDays) * 24 * 60 * 60 * 1000)).toISOString() : 
            null
        })
        .eq('id', user.id);

      if (error) throw error;

      showMessage('success', 'Preferences updated successfully!');
      await loadUserData();
    } catch (error) {
      console.error('Error updating preferences:', error);
      showMessage('error', `Failed to update preferences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Account Settings</h1>
          <p className="mt-1 text-lg text-gray-500 dark:text-gray-400">
            Manage your account preferences and security settings
          </p>
        </div>
        <Link
          href="/dashboard"
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          ← Back to Dashboard
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'profile', label: '👤 Profile', description: 'Username & Email' },
            { key: 'security', label: '🔒 Security', description: 'Password & Login' },
            { key: 'preferences', label: '⚙️ Preferences', description: 'Notifications & Limits' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div>{tab.label}</div>
              <div className="text-xs opacity-75">{tab.description}</div>
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your username"
              />
              <p className="mt-1 text-sm text-gray-500">This is how your name will appear to other users.</p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter your email address"
              />
              <p className="mt-1 text-sm text-gray-500">You'll need to confirm any email changes.</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Account Information</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p><strong>Account ID:</strong> {user?.id?.substring(0, 8)}...</p>
                <p><strong>Member Since:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</p>
                <p><strong>Current Balance:</strong> ${profile?.hotcoin_balance || 0}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Security Settings</h2>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter new password"
                minLength={6}
              />
              <p className="mt-1 text-sm text-gray-500">Must be at least 6 characters long.</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="Confirm new password"
                minLength={6}
              />
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <strong>Security Notice:</strong> Changing your password will log you out of all devices. You'll need to log in again.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || !newPassword || !confirmPassword}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Notification Preferences */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Notification Preferences</h2>
            
            <form onSubmit={handlePreferencesUpdate} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    id="emailNotifications"
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="emailNotifications" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email Notifications
                  </label>
                </div>
                <p className="text-sm text-gray-500 ml-7">Receive general account and security notifications via email.</p>

                <div className="flex items-center">
                  <input
                    id="gameAlerts"
                    type="checkbox"
                    checked={gameAlerts}
                    onChange={(e) => setGameAlerts(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="gameAlerts" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Game Alerts
                  </label>
                </div>
                <p className="text-sm text-gray-500 ml-7">Get notified when games start, end, or when numbers are assigned.</p>

                <div className="flex items-center">
                  <input
                    id="winningAlerts"
                    type="checkbox"
                    checked={winningAlerts}
                    onChange={(e) => setWinningAlerts(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="winningAlerts" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Winning Alerts
                  </label>
                </div>
                <p className="text-sm text-gray-500 ml-7">Receive notifications when you win payouts or prizes.</p>

                <div className="flex items-center">
                  <input
                    id="marketingEmails"
                    type="checkbox"
                    checked={marketingEmails}
                    onChange={(e) => setMarketingEmails(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="marketingEmails" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Marketing Emails
                  </label>
                </div>
                <p className="text-sm text-gray-500 ml-7">Receive promotional offers and platform updates.</p>
              </div>
            </form>
          </div>

          {/* Responsible Gambling Settings */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-6">🛡️ Responsible Gambling Controls</h2>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="dailySpendLimit" className="block text-sm font-medium text-red-700 dark:text-red-300">
                    Daily Spending Limit ($)
                  </label>
                  <input
                    type="number"
                    id="dailySpendLimit"
                    value={dailySpendLimit}
                    onChange={(e) => setDailySpendLimit(e.target.value ? Number(e.target.value) : '')}
                    className="mt-1 block w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-red-900/20 dark:text-white"
                    placeholder="e.g., 100"
                    min="1"
                    max="1000"
                  />
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">Maximum amount you can spend per day.</p>
                </div>

                <div>
                  <label htmlFor="weeklySpendLimit" className="block text-sm font-medium text-red-700 dark:text-red-300">
                    Weekly Spending Limit ($)
                  </label>
                  <input
                    type="number"
                    id="weeklySpendLimit"
                    value={weeklySpendLimit}
                    onChange={(e) => setWeeklySpendLimit(e.target.value ? Number(e.target.value) : '')}
                    className="mt-1 block w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-red-900/20 dark:text-white"
                    placeholder="e.g., 500"
                    min="1"
                    max="5000"
                  />
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">Maximum amount you can spend per week.</p>
                </div>

                <div>
                  <label htmlFor="timeLimit" className="block text-sm font-medium text-red-700 dark:text-red-300">
                    Session Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    id="timeLimit"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(e.target.value ? Number(e.target.value) : '')}
                    className="mt-1 block w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-red-900/20 dark:text-white"
                    placeholder="e.g., 120"
                    min="15"
                    max="480"
                  />
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">Maximum time per session (15-480 minutes).</p>
                </div>

                <div>
                  <label htmlFor="selfExclusionDays" className="block text-sm font-medium text-red-700 dark:text-red-300">
                    Self-Exclusion (days)
                  </label>
                  <input
                    type="number"
                    id="selfExclusionDays"
                    value={selfExclusionDays}
                    onChange={(e) => setSelfExclusionDays(e.target.value ? Number(e.target.value) : '')}
                    className="mt-1 block w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-red-900/20 dark:text-white"
                    placeholder="e.g., 30"
                    min="1"
                    max="365"
                  />
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">Temporarily exclude yourself from the platform (1-365 days).</p>
                </div>
              </div>

              <div className="bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">⚠️ Important Notice</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  These limits help promote responsible gambling. Once set, spending limits cannot be increased for 24 hours. 
                  Self-exclusion periods cannot be reversed until they expire. If you're struggling with gambling, please seek help 
                  at <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="underline">ncpgambling.org</a>.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handlePreferencesUpdate}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}