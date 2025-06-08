'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminConfigPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Configuration states
  const [withdrawalMinimum, setWithdrawalMinimum] = useState('25');
  const [withdrawalDailyLimit, setWithdrawalDailyLimit] = useState('500');
  const [autoApprovalLimit, setAutoApprovalLimit] = useState('100');
  const [termsCurrentVersion, setTermsCurrentVersion] = useState('1.0');
  const [ageVerificationRequired, setAgeVerificationRequired] = useState(true);
  const [responsibleGamblingEnabled, setResponsibleGamblingEnabled] = useState(true);
  
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

      // Load current system configuration
      const { data: configData } = await supabase
        .from('system_config')
        .select('*');

      if (configData) {
        const configMap = configData.reduce((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {} as Record<string, string>);

        setWithdrawalMinimum(configMap.withdrawal_minimum || '25');
        setWithdrawalDailyLimit(configMap.withdrawal_daily_limit || '500');
        setAutoApprovalLimit(configMap.auto_approval_limit || '100');
        setTermsCurrentVersion(configMap.terms_current_version || '1.0');
        setAgeVerificationRequired(configMap.age_verification_required === 'true');
        setResponsibleGamblingEnabled(configMap.responsible_gambling_enabled === 'true');
      }
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

  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const configUpdates = [
        { key: 'withdrawal_minimum', value: withdrawalMinimum, description: 'Minimum withdrawal amount in dollars' },
        { key: 'withdrawal_daily_limit', value: withdrawalDailyLimit, description: 'Daily withdrawal limit per user in dollars' },
        { key: 'auto_approval_limit', value: autoApprovalLimit, description: 'Auto-approval limit for payments in dollars' },
        { key: 'terms_current_version', value: termsCurrentVersion, description: 'Current version of terms of service' },
        { key: 'age_verification_required', value: ageVerificationRequired.toString(), description: 'Whether age verification is required for new users' },
        { key: 'responsible_gambling_enabled', value: responsibleGamblingEnabled.toString(), description: 'Whether responsible gambling features are enabled' }
      ];

      for (const config of configUpdates) {
        await supabase
          .from('system_config')
          .upsert({
            key: config.key,
            value: config.value,
            description: config.description,
            updated_at: new Date().toISOString()
          });
      }

      showMessage('success', 'System configuration updated successfully!');
    } catch (error) {
      console.error('Error updating configuration:', error);
      showMessage('error', `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Configuration</h1>
          <p className="mt-1 text-lg text-gray-500 dark:text-gray-400">
            Manage platform settings and operational parameters
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

      <div className="space-y-8">
        {/* Financial Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">💰 Financial Settings</h2>
          
          <form onSubmit={handleSaveConfiguration} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="withdrawalMinimum" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Minimum Withdrawal ($)
                </label>
                <input
                  type="number"
                  id="withdrawalMinimum"
                  value={withdrawalMinimum}
                  onChange={(e) => setWithdrawalMinimum(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  min="1"
                  max="100"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Minimum amount users can withdraw</p>
              </div>

              <div>
                <label htmlFor="withdrawalDailyLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Daily Withdrawal Limit ($)
                </label>
                <input
                  type="number"
                  id="withdrawalDailyLimit"
                  value={withdrawalDailyLimit}
                  onChange={(e) => setWithdrawalDailyLimit(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  min="100"
                  max="10000"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Maximum daily withdrawal per user</p>
              </div>

              <div>
                <label htmlFor="autoApprovalLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-Approval Limit ($)
                </label>
                <input
                  type="number"
                  id="autoApprovalLimit"
                  value={autoApprovalLimit}
                  onChange={(e) => setAutoApprovalLimit(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  min="1"
                  max="1000"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Payments under this amount are auto-approved</p>
              </div>
            </div>
          </form>
        </div>

        {/* Legal & Compliance Settings */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">⚖️ Legal & Compliance</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="termsCurrentVersion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Terms of Service Version
              </label>
              <input
                type="text"
                id="termsCurrentVersion"
                value={termsCurrentVersion}
                onChange={(e) => setTermsCurrentVersion(e.target.value)}
                className="mt-1 block w-full md:w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., 1.0, 2.1"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Current version of terms of service for tracking user acceptance</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="ageVerificationRequired"
                  type="checkbox"
                  checked={ageVerificationRequired}
                  onChange={(e) => setAgeVerificationRequired(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="ageVerificationRequired" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Age Verification Required
                </label>
              </div>
              <p className="text-sm text-gray-500 ml-7">Require users to verify they are 18+ years old during registration</p>

              <div className="flex items-center">
                <input
                  id="responsibleGamblingEnabled"
                  type="checkbox"
                  checked={responsibleGamblingEnabled}
                  onChange={(e) => setResponsibleGamblingEnabled(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="responsibleGamblingEnabled" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Responsible Gambling Features Enabled
                </label>
              </div>
              <p className="text-sm text-gray-500 ml-7">Enable spending limits, time limits, and self-exclusion features</p>
            </div>
          </div>
        </div>

        {/* Security Information */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-4">🔒 Security Information</h2>
          
          <div className="space-y-4 text-sm text-yellow-700 dark:text-yellow-300">
            <div>
              <strong>Configuration Impact:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Changes to financial limits affect all future transactions immediately</li>
                <li>Auto-approval limits help reduce manual admin workload</li>
                <li>Age verification and terms tracking are required for legal compliance</li>
                <li>Responsible gambling features help protect users and meet regulatory requirements</li>
              </ul>
            </div>
            
            <div>
              <strong>Recommended Settings:</strong>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Minimum withdrawal: $25 (covers processing fees)</li>
                <li>Daily withdrawal limit: $500 (fraud prevention)</li>
                <li>Auto-approval limit: $100 (balances convenience with security)</li>
                <li>Keep age verification and responsible gambling enabled for compliance</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveConfiguration}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {saving ? 'Saving Configuration...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}