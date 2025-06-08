'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface PaymentTransaction {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  payment_method: string;
  transaction_id: string;
  verification_status: 'pending' | 'approved' | 'rejected';
  auto_approved: boolean;
  created_at: string;
  profiles: {
    username: string;
    email: string;
  };
}

export default function AdminPaymentsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user?.is_admin) {
      loadPayments();
    }
  }, [user, filter]);

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

      setUser(profile);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      let query = supabase
        .from('hotcoin_transactions')
        .select(`
          *,
          profiles:user_id (
            username,
            email
          )
        `)
        .eq('type', 'purchase')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('verification_status', filter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const approvePayment = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.rpc('approve_payment', {
        transaction_uuid: transactionId,
        admin_id: user.id
      });

      if (error) throw error;
      
      alert('Payment approved successfully!');
      loadPayments();
    } catch (error) {
      console.error('Error approving payment:', error);
      alert('Failed to approve payment. Please try again.');
    }
  };

  const rejectPayment = async (transactionId: string) => {
    try {
      const { data, error } = await supabase.rpc('reject_payment', {
        transaction_uuid: transactionId,
        admin_id: user.id
      });

      if (error) throw error;
      
      alert('Payment rejected.');
      loadPayments();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      alert('Failed to reject payment. Please try again.');
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payment Verification</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Review and approve user payments
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'pending', label: 'Pending', count: payments.filter(p => p.verification_status === 'pending').length },
              { key: 'approved', label: 'Approved', count: payments.filter(p => p.verification_status === 'approved').length },
              { key: 'rejected', label: 'Rejected', count: payments.filter(p => p.verification_status === 'rejected').length },
              { key: 'all', label: 'All', count: payments.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`${
                  filter === tab.key
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Payments List */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No payments found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {payments.map((payment) => (
              <li key={payment.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          payment.verification_status === 'approved' ? 'bg-green-500' :
                          payment.verification_status === 'rejected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              ${payment.amount} HotCoins
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {payment.profiles?.email} • {payment.profiles?.username || 'No username'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">
                              Transaction ID: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{payment.transaction_id}</code>
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(payment.created_at).toLocaleString()} • {payment.payment_method?.toUpperCase()}
                              {payment.auto_approved && <span className="ml-2 text-green-600">• Auto-approved</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {payment.verification_status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => approvePayment(payment.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectPayment(payment.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  
                  {payment.verification_status !== 'pending' && (
                    <div className="text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.verification_status === 'approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {payment.verification_status.charAt(0).toUpperCase() + payment.verification_status.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Verification Instructions
        </h3>
        <div className="text-blue-800 dark:text-blue-200 space-y-2">
          <p>1. <strong>Check your CashApp:</strong> Open your CashApp and verify the transaction ID matches a real payment to $playhotboxes</p>
          <p>2. <strong>Verify amount:</strong> Ensure the payment amount matches what the user claims</p>
          <p>3. <strong>Approve/Reject:</strong> Click Approve to credit HotCoins or Reject if the payment is invalid</p>
          <p>4. <strong>Auto-approved:</strong> Payments $100 and under are automatically approved</p>
        </div>
      </div>
    </div>
  );
}