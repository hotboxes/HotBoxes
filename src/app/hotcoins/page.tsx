'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export default function HotCoinsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState(25);
  const [withdrawCashApp, setWithdrawCashApp] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
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

      setUser({
        id: authUser.id,
        email: authUser.email || '',
        username: profile?.username,
        hotcoinBalance: profile?.hotcoin_balance || 0,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawCashApp.trim()) {
      alert('Please enter your CashApp username');
      return;
    }

    if (withdrawAmount < 25) {
      alert('Minimum withdrawal is $25');
      return;
    }

    if (withdrawAmount > (user?.hotcoinBalance || 0)) {
      alert('Insufficient balance');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: todayWithdrawals } = await supabase
      .from('hotcoin_transactions')
      .select('amount')
      .eq('user_id', user?.id)
      .eq('type', 'withdrawal')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    const todayTotal = todayWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;
    if (todayTotal + withdrawAmount > 500) {
      alert(`Daily withdrawal limit is $500. You have already withdrawn $${todayTotal} today.`);
      return;
    }

    setWithdrawing(true);
    try {
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ 
          hotcoin_balance: (user?.hotcoinBalance || 0) - withdrawAmount 
        })
        .eq('id', user?.id);

      if (balanceError) throw balanceError;

      const { error: transactionError } = await supabase
        .from('hotcoin_transactions')
        .insert([{
          user_id: user?.id,
          type: 'withdrawal',
          amount: withdrawAmount,
          description: `Withdrawal to ${withdrawCashApp}`,
          verification_status: 'pending',
          cashapp_username: withdrawCashApp
        }]);

      if (transactionError) throw transactionError;

      await fetch('/api/admin/notify-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmount,
          cashAppUsername: withdrawCashApp,
          userEmail: user?.email,
          username: user?.username || 'No username set',
          userId: user?.id,
          userBalance: (user?.hotcoinBalance || 0) - withdrawAmount
        })
      });

      setUser(prev => prev ? {
        ...prev,
        hotcoinBalance: (prev.hotcoinBalance || 0) - withdrawAmount
      } : null);

      alert(`✅ Withdrawal request submitted! $${withdrawAmount} will be sent to ${withdrawCashApp} within 24-48 hours.`);
      setWithdrawAmount(25);
      setWithdrawCashApp('');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Withdrawal failed. Please try again or contact support.');

      const { error: revertError } = await supabase
        .from('profiles')
        .update({ 
          hotcoin_balance: user?.hotcoinBalance || 0
        })
        .eq('id', user?.id);
    } finally {
      setWithdrawing(false);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">HotCoins</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Your currency for playing squares games
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Balance */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Current Balance
          </h2>
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              {user?.hotcoinBalance || 0}
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-400">HotCoins</div>
            <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              ≈ ${user?.hotcoinBalance || 0} USD
            </div>
          </div>
        </div>

        {/* Withdraw HotCoins */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Withdraw to CashApp
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                min="25"
                step="1"
                max={user?.hotcoinBalance || 0}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum withdrawal: $25 • Daily limit: $500
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your CashApp Username
              </label>
              <input
                type="text"
                placeholder="$yourcashapp"
                value={withdrawCashApp}
                onChange={(e) => setWithdrawCashApp(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Include the $ symbol (e.g., $johndoe)
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900 p-4 rounded-md">
              <div className="flex justify-between text-sm">
                <span>You'll receive:</span>
                <span className="font-semibold">${withdrawAmount}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Processing time:</span>
                <span className="text-red-600 dark:text-red-400">24-48 hours</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Fees:</span>
                <span className="text-green-600 font-semibold">Free</span>
              </div>
            </div>

            <button
              onClick={handleWithdraw}
              disabled={withdrawing || withdrawAmount < 25 || withdrawAmount > (user?.hotcoinBalance || 0) || !withdrawCashApp.trim()}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
            >
              {withdrawing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>💸</span>
                  <span>Withdraw ${withdrawAmount}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
