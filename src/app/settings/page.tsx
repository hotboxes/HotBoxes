'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile form states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  // Security form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');


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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4"
      >
        <div>
          <h1 className="text-5xl font-extrabold text-white text-display mb-2">
            ACCOUNT <span className="text-[#FF4500]">SETTINGS</span>
          </h1>
          <p className="text-lg text-gray-300">
            Manage your profile and security settings
          </p>
        </div>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-gradient-to-r from-[#1E3A8A]/50 to-[#0A1128]/70 hover:from-[#1E3A8A]/70 hover:to-[#0A1128]/90 border border-[#FFD700]/30 text-white rounded-lg font-bold transition-all transform hover:scale-105"
        >
          ← Dashboard
        </Link>
      </motion.div>

      {/* Message Alert */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl font-semibold ${
            message.type === 'success'
              ? 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 glow-green'
              : 'bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/30 glow-orange'
          }`}>
          {message.text}
        </motion.div>
      )}

      {/* Tab Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border-b border-gray-700 mb-8"
      >
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'profile', label: '👤 Profile', description: 'Username & Email', color: 'from-[#FFD700] to-[#FFA500]' },
            { key: 'security', label: '🔒 Security', description: 'Password & Login', color: 'from-[#FF4500] to-[#FF6B35]' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-bold text-sm transition-all ${
                activeTab === tab.key
                  ? 'border-[#FF4500] text-[#FF4500] scale-105'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="text-lg">{tab.label}</div>
              <div className="text-xs opacity-75 uppercase tracking-wider">{tab.description}</div>
            </button>
          ))}
        </nav>
      </motion.div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <motion.div
          key="profile"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-2xl p-8 border border-[#FFD700]/30"
        >
          <div className="absolute inset-0 grid-pattern opacity-10 rounded-2xl"></div>

          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white text-display mb-6 flex items-center gap-3">
              <span className="text-[#FFD700]">👤</span>
              PROFILE INFORMATION
            </h2>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-4 py-3 border border-[#39FF14]/30 rounded-lg bg-[#0A1128]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all"
                  placeholder="Enter your username"
                />
                <p className="mt-2 text-sm text-gray-400">This is how your name will appear to other users.</p>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full px-4 py-3 border border-[#39FF14]/30 rounded-lg bg-[#0A1128]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all"
                  placeholder="Enter your email address"
                />
                <p className="mt-2 text-sm text-gray-400">You'll need to confirm any email changes.</p>
              </div>

              <div className="bg-[#0A1128]/70 border border-[#FFD700]/20 p-6 rounded-xl">
                <h3 className="text-sm font-bold text-[#FFD700] uppercase tracking-wider mb-4">Account Information</h3>
                <div className="text-sm text-gray-300 space-y-2">
                  <p className="flex justify-between">
                    <span className="text-gray-400">Account ID:</span>
                    <span className="font-mono text-[#39FF14]">{user?.id?.substring(0, 8)}...</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Member Since:</span>
                    <span className="font-semibold">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-400">Current Balance:</span>
                    <span className="font-bold text-[#FFD700] text-lg">{profile?.hotcoin_balance || 0} HC</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FFD700] disabled:opacity-50 text-[#0A1128] font-bold rounded-lg transition-all transform hover:scale-105 glow-gold"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-[#0A1128] border-t-transparent rounded-full"
                      />
                      Saving...
                    </span>
                  ) : (
                    '💾 Save Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <motion.div
          key="security"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-2xl p-8 border border-[#FF4500]/30"
        >
          <div className="absolute inset-0 grid-pattern opacity-10 rounded-2xl"></div>

          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-white text-display mb-6 flex items-center gap-3">
              <span className="text-[#FF4500]">🔒</span>
              SECURITY SETTINGS
            </h2>

            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-[#39FF14]/30 rounded-lg bg-[#0A1128]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all"
                  placeholder="Enter new password"
                  minLength={6}
                />
                <p className="mt-2 text-sm text-gray-400">Must be at least 6 characters long.</p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-[#39FF14]/30 rounded-lg bg-[#0A1128]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                  minLength={6}
                />
              </div>

              <div className="bg-[#FFD700]/10 border-l-4 border-[#FFD700] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <p className="text-sm text-[#FFD700] font-bold mb-1 uppercase tracking-wider">
                      Security Notice
                    </p>
                    <p className="text-sm text-gray-300">
                      Changing your password will log you out of all devices. You'll need to log in again.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving || !newPassword || !confirmPassword}
                  className="px-8 py-3 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] hover:from-[#FF6B35] hover:to-[#FF4500] disabled:opacity-50 text-white font-bold rounded-lg transition-all transform hover:scale-105 glow-orange"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Updating...
                    </span>
                  ) : (
                    '🔐 Update Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

    </div>
  );
}
