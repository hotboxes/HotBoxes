'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function HelpPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // Form states
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser(authUser);
        setUserEmail(authUser.email || '');

        // Load profile for username
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', authUser.id)
          .single();

        if (profileData) {
          setUserName(profileData.username || '');
        }
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

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !description.trim()) {
      showMessage('error', 'Please fill in all required fields');
      return;
    }

    if (!user && !userEmail.trim()) {
      showMessage('error', 'Please provide your email address');
      return;
    }

    setSubmitting(true);

    try {
      const ticketData = {
        user_id: user?.id || null,
        subject: subject.trim(),
        message: description.trim(),
        category,
        priority,
        user_email: userEmail.trim(),
        user_name: userName.trim() || null,
        status: 'open'
      };

      const { error } = await supabase
        .from('support_tickets')
        .insert([ticketData]);

      if (error) throw error;

      showMessage('success', 'Support ticket submitted successfully! We\'ll get back to you within 24 hours.');
      
      // Reset form
      setSubject('');
      setDescription('');
      setCategory('general');
      setPriority('medium');
      if (!user) {
        setUserEmail('');
        setUserName('');
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      showMessage('error', `Failed to submit ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Help & Support</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          Get help with HotBoxes or submit a support request
        </p>
      </div>

      {/* Message Alert */}
      {message && (
        <div className={`mb-8 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Quick Help Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📚 Quick Help</h2>
          
          {/* FAQ Links */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔍 Frequently Asked Questions</h3>
            <div className="space-y-3">
              <Link href="/faq#account" className="block text-indigo-600 hover:text-indigo-500 text-sm">
                → How do I create an account and get started?
              </Link>
              <Link href="/faq#payments" className="block text-indigo-600 hover:text-indigo-500 text-sm">
                → How do I buy HotCoins with CashApp?
              </Link>
              <Link href="/faq#games" className="block text-indigo-600 hover:text-indigo-500 text-sm">
                → How does the game scoring work?
              </Link>
              <Link href="/faq#withdrawals" className="block text-indigo-600 hover:text-indigo-500 text-sm">
                → How do I withdraw my winnings?
              </Link>
              <Link href="/faq" className="block text-indigo-600 hover:text-indigo-500 font-medium">
                → View all FAQ
              </Link>
            </div>
          </div>

          {/* Common Issues */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⚠️ Common Issues</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Payment Not Credited</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Payments under $100 are usually instant. For larger amounts, admin approval may take up to 24 hours.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Can't Access Account</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Check your email for verification links. Contact support if you're still unable to log in.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Game Not Working</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Try refreshing the page. If issues persist, check that numbers have been assigned to the game.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">📞 Contact Information</h3>
            <div className="space-y-2 text-blue-700 dark:text-blue-300 text-sm">
              <p><strong>Response Time:</strong> Within 24 hours</p>
              <p><strong>Support Hours:</strong> 9 AM - 9 PM EST</p>
              <p><strong>Emergency Issues:</strong> Payment/withdrawal problems get priority</p>
              <div className="mt-4">
                <p><strong>Alternative Contact:</strong></p>
                <p>Email: support@playhotboxes.com</p>
                <p>For privacy concerns: privacy@playhotboxes.com</p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Form */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">📝 Submit Support Ticket</h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <form onSubmit={handleSubmitTicket} className="space-y-6">
              {/* User Info (for non-logged in users) */}
              {!user && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="userName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="userEmail"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Logged in user info */}
              {user && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Your Account</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Logged in as: {userName || userEmail}
                  </p>
                </div>
              )}

              {/* Ticket Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="general">General Question</option>
                    <option value="payment">Payment Issue</option>
                    <option value="withdrawal">Withdrawal Problem</option>
                    <option value="game">Game/Technical Issue</option>
                    <option value="account">Account Access</option>
                    <option value="legal">Legal/Compliance</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Low - General inquiry</option>
                    <option value="medium">Medium - Standard issue</option>
                    <option value="high">High - Urgent problem</option>
                    <option value="urgent">Urgent - Critical issue</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Please provide as much detail as possible about your issue, including any error messages, transaction IDs, or steps that led to the problem."
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  Include transaction IDs, error messages, and steps to reproduce the issue
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      📤 Submit Support Ticket
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              <p><strong>What happens next?</strong></p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You'll receive an email confirmation</li>
                <li>Our support team will review your ticket</li>
                <li>We'll respond within 24 hours (urgent issues faster)</li>
                <li>You can track your ticket status in your account</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Notice */}
      <div className="mt-12 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚖️ Legal & Responsible Gambling Support</h3>
        <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
          If you need help with gambling-related issues or have concerns about problem gambling:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-yellow-700 dark:text-yellow-300 text-sm">
          <div>
            <p><strong>National Problem Gambling Helpline:</strong></p>
            <p>📞 1-800-522-4700 (24/7)</p>
            <p>💬 Text "HELPLINE" to 233-373</p>
          </div>
          <div>
            <p><strong>Online Resources:</strong></p>
            <p>🌐 <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-600">ncpgambling.org</a></p>
            <p>🛡️ Use our responsible gambling tools in <Link href="/settings" className="underline hover:text-yellow-600">Settings</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}