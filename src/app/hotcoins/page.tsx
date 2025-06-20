'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

export default function HotCoinsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseAmount, setPurchaseAmount] = useState(10);
  const [purchasing, setPurchasing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRef, setPaymentRef] = useState('');
  const [transactionId, setTransactionId] = useState('');
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

  const handlePurchase = async () => {
    if (purchaseAmount < 10) {
      alert('Minimum purchase is $10');
      return;
    }

    // Generate unique payment reference
    const newPaymentRef = `HC-${user?.id?.slice(-8)}-${Date.now()}`;
    setPaymentRef(newPaymentRef);
    setShowPaymentModal(true);
  };

  const handleCashAppRedirect = () => {
    // Try CashApp deep link - this should work better on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Mobile: Use CashApp deep link that should pre-fill recipient
      window.location.href = `https://cash.app/$playhotboxes/${purchaseAmount}`;
    } else {
      // Desktop: Open CashApp web (user will need to manually enter details)
      window.open('https://cash.app/$playhotboxes', '_blank');
    }
  };

  const submitTransaction = async () => {
    if (!transactionId.trim()) {
      alert('Please enter your transaction ID');
      return;
    }
    
    console.log('Starting payment verification...', {
      purchaseAmount,
      transactionId: transactionId.trim(),
      userId: user?.id
    });
    
    setPurchasing(true);
    try {
      // Check if transaction ID already used
      console.log('Checking for duplicate transaction ID...');
      const { data: existingTransaction } = await supabase
        .from('hotcoin_transactions')
        .select('id')
        .eq('transaction_id', transactionId.trim())
        .single();
        
      if (existingTransaction) {
        console.log('Duplicate transaction ID found');
        alert('This transaction ID has already been used.');
        setPurchasing(false);
        return;
      }
      
      console.log('Transaction ID is unique, proceeding...');
      
      // Determine if auto-approval applies
      const autoApproved = purchaseAmount <= 100;
      const verificationStatus = autoApproved ? 'approved' : 'pending';
      
      console.log('Creating transaction record...', { autoApproved, verificationStatus });
      
      // Create transaction record
      const { error: transactionError } = await supabase
        .from('hotcoin_transactions')
        .insert([{
          user_id: user?.id,
          type: 'purchase',
          amount: purchaseAmount,
          description: `CashApp purchase of ${purchaseAmount} HotCoins (Ref: ${paymentRef})`,
          payment_method: 'cashapp',
          transaction_id: transactionId.trim(),
          verification_status: verificationStatus,
          auto_approved: autoApproved
        }]);
        
      if (transactionError) {
        console.error('Transaction creation error:', transactionError);
        throw transactionError;
      }
      
      console.log('Transaction record created successfully');
      
      if (autoApproved) {
        console.log('Auto-approving payment and updating balance...');
        // Auto-approve: Update user's HotCoin balance immediately
        const { error } = await supabase
          .from('profiles')
          .update({ 
            hotcoin_balance: (user?.hotcoinBalance || 0) + purchaseAmount 
          })
          .eq('id', user?.id);

        if (error) {
          console.error('Balance update error:', error);
          throw error;
        }

        console.log('Balance updated successfully');

        // Update local state
        setUser(prev => prev ? {
          ...prev,
          hotcoinBalance: (prev.hotcoinBalance || 0) + purchaseAmount
        } : null);

        console.log('Payment process completed successfully');
        alert(`🎉 Payment verified! ${purchaseAmount} HotCoins added to your account.`);
      } else {
        // Manual verification required
        alert(`💰 Payment submitted! Your purchase of ${purchaseAmount} HotCoins is pending verification. You'll receive your HotCoins within 24 hours.`);
        
        // Send email notification to admin (non-blocking)
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          await fetch('/api/admin/notify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: purchaseAmount,
              transactionId: transactionId.trim(),
              userEmail: user?.email,
              userId: user?.id,
              paymentRef
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          console.log('Admin notification sent successfully');
        } catch (notificationError) {
          console.error('Failed to send admin notification (non-critical):', notificationError);
          // Don't fail the whole payment process if notification fails
        }
      }
      
      // Reset form
      setShowPaymentModal(false);
      setTransactionId('');
      setPurchaseAmount(10);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Payment processing failed. Please contact support if you completed the payment.');
    } finally {
      setPurchasing(false);
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

    // Check daily withdrawal limit
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
      // Immediately deduct from user's balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ 
          hotcoin_balance: (user?.hotcoinBalance || 0) - withdrawAmount 
        })
        .eq('id', user?.id);

      if (balanceError) throw balanceError;

      // Record the withdrawal transaction
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

      // Send email notification to admin
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

      // Update local state
      setUser(prev => prev ? {
        ...prev,
        hotcoinBalance: (prev.hotcoinBalance || 0) - withdrawAmount
      } : null);

      alert(`✅ Withdrawal request submitted! $${withdrawAmount} will be sent to ${withdrawCashApp} within 24-48 hours.`);
      
      // Reset form
      setWithdrawAmount(25);
      setWithdrawCashApp('');
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Withdrawal failed. Please try again or contact support.');
      
      // Revert balance change on error
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        {/* Purchase HotCoins */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Purchase HotCoins
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                min="10"
                step="1"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum purchase: $10
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
              <div className="flex justify-between text-sm">
                <span>You'll receive:</span>
                <span className="font-semibold">{purchaseAmount} HotCoins</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Exchange rate:</span>
                <span>1 USD = 1 HotCoin</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Processing time:</span>
                <span className={purchaseAmount <= 100 ? "text-green-600 font-semibold" : "text-orange-600"}>
                  {purchaseAmount <= 100 ? "Instant" : "Up to 24 hours"}
                </span>
              </div>
            </div>

            <button
              onClick={handlePurchase}
              disabled={purchasing || purchaseAmount < 10}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-md transition-colors flex items-center justify-center space-x-2"
            >
              {purchasing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>💰</span>
                  <span>Pay ${purchaseAmount} via CashApp</span>
                </>
              )}
            </button>
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

      {/* Quick Purchase Options */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Purchase
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[10, 25, 50, 100].map((amount) => (
            <button
              key={amount}
              onClick={() => setPurchaseAmount(amount)}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-4 rounded-md text-center transition-colors"
            >
              ${amount}
            </button>
          ))}
        </div>
      </div>

      {/* How it Works */}
      <div className="mt-12 bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          How HotCoins Work
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">💰</span>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Purchase</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Buy HotCoins with real money. 1 USD = 1 HotCoin
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🎮</span>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Play</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Use HotCoins to buy squares in games
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">🏆</span>
            </div>
            <h4 className="font-medium text-gray-900 dark:text-white">Win</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Win HotCoins based on game outcomes
            </p>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Complete Your Payment
            </h3>
            
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-md">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Payment Details:</strong>
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Send: <strong>${purchaseAmount}</strong><br/>
                  To: <strong>$playhotboxes</strong><br/>
                  Reference: <strong>{paymentRef}</strong>
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  1. Click the button below to open CashApp
                </p>
                <button
                  onClick={handleCashAppRedirect}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium flex items-center justify-center space-x-2"
                >
                  <span>📱</span>
                  <span>Open CashApp & Pay $playhotboxes</span>
                </button>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  2. After completing the payment, enter your transaction ID below:
                </p>
                <input
                  type="text"
                  placeholder="Enter transaction ID (e.g., CR123456789)"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setTransactionId('');
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={submitTransaction}
                  disabled={purchasing || !transactionId.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-md font-medium"
                >
                  {purchasing ? 'Processing...' : 'Verify Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}