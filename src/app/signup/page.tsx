'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('Starting signup process for email:', email);

      // Sign up the user
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      console.log('Signup response:', {
        error: signUpError,
        data: data,
        user: data?.user,
        session: data?.session,
        emailConfirmedAt: data?.user?.email_confirmed_at,
        userCreated: !!data?.user
      });

      if (signUpError) {
        console.error('Signup error details:', signUpError);
        throw signUpError;
      }

      // Check if user was created but needs confirmation
      if (data?.user && !data.user.email_confirmed_at) {
        console.log('User created, needs email confirmation');

        // Create user profile in Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              username,
              email,
            },
          ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        // Show confirmation message
        setShowConfirmation(true);
      } else if (data?.user && data.user.email_confirmed_at) {
        // User was auto-confirmed (shouldn't happen with email confirmation enabled)
        console.log('User auto-confirmed');
        setShowConfirmation(true);
      } else {
        throw new Error('Unexpected signup response - no user data received');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    setResendMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        console.error('Resend error:', error);
        setResendMessage('Failed to resend email. Please try again or contact support.');
      } else {
        setResendMessage('Confirmation email resent! Check your inbox and spam folder.');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setResendMessage('Failed to resend email. Please try again or contact support.');
    } finally {
      setResendingEmail(false);
    }
  };

  // Show confirmation screen after successful signup
  if (showConfirmation) {
    return (
      <div className="flex min-h-[80vh] flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="sm:mx-auto sm:w-full sm:max-w-2xl"
        >
          <div className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-2xl p-8 sm:p-12 border border-[#39FF14]/30">
            <div className="absolute inset-0 grid-pattern opacity-10 rounded-2xl"></div>

            <div className="relative z-10 text-center">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-[#39FF14] to-[#00FF41] mb-6 glow-green"
              >
                <svg className="h-10 w-10 text-[#0A1128]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </motion.div>

              <h2 className="text-4xl sm:text-5xl font-extrabold text-white text-display mb-4">
                CHECK YOUR <span className="text-[#39FF14]">EMAIL!</span>
              </h2>

              <p className="text-gray-300 text-lg mb-6">
                We've sent a confirmation email to:
              </p>

              <div className="bg-[#0A1128]/50 border-2 border-[#39FF14]/50 rounded-xl p-4 mb-6 glow-green">
                <p className="text-[#39FF14] font-bold text-xl">{email}</p>
              </div>

              <div className="text-left bg-[#1E3A8A]/30 rounded-xl p-6 mb-6 border border-[#FFD700]/20">
                <h3 className="font-bold text-[#FFD700] text-lg mb-3 uppercase tracking-wider">Next Steps:</h3>
                <ol className="text-gray-300 space-y-2 list-decimal list-inside">
                  <li className="text-base">Check your email inbox (and spam folder)</li>
                  <li className="text-base">Click the "Confirm your account" link in the email</li>
                  <li className="text-base">You'll be redirected back to HotBoxes to start playing!</li>
                </ol>
              </div>

              <div className="text-sm text-gray-400 mb-6">
                <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-xl p-4">
                  <h4 className="font-bold text-[#FFD700] mb-2 uppercase tracking-wider">Email Not Received?</h4>
                  <ul className="text-gray-300 space-y-1 text-sm text-left">
                    <li>• Check your spam/junk folder</li>
                    <li>• Look for emails from "noreply@ljyeewnjtkcvbrjjpzyw.supabase.co"</li>
                    <li>• Wait up to 5-10 minutes for delivery</li>
                    <li>• Contact support at help@playhotboxes.com if still missing</li>
                  </ul>
                </div>
              </div>

              {/* Resend message */}
              {resendMessage && (
                <div className={`p-4 rounded-xl text-sm font-semibold mb-4 ${
                  resendMessage.includes('Failed')
                    ? 'bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/30'
                    : 'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30'
                }`}>
                  {resendMessage}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={resendingEmail}
                  className="w-full bg-gradient-to-r from-[#39FF14] to-[#00FF41] hover:from-[#00FF41] hover:to-[#39FF14] disabled:opacity-50 text-[#0A1128] font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 glow-green"
                >
                  {resendingEmail ? 'Resending...' : '📧 Resend Confirmation Email'}
                </button>

                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setEmail('');
                    setPassword('');
                    setUsername('');
                    setResendMessage('');
                  }}
                  className="w-full bg-gradient-to-r from-[#FF4500] to-[#FF6B35] hover:from-[#FF6B35] hover:to-[#FF4500] text-white font-bold py-3 px-4 rounded-xl transition-all transform hover:scale-105 glow-orange"
                >
                  🎮 Sign Up Another Account
                </button>

                <Link
                  href="/login"
                  className="block w-full text-center bg-[#1E3A8A]/50 hover:bg-[#1E3A8A]/70 border border-[#FFD700]/30 text-white font-bold py-3 px-4 rounded-xl transition-all"
                >
                  ← Back to Login
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-5xl font-extrabold text-white text-display mb-3">
            JOIN THE <span className="text-[#FF4500]">ACTION</span>
          </h2>
          <p className="text-xl text-gray-300 font-semibold mb-2">
            Create your free account
          </p>
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-[#39FF14] hover:text-[#00FF41] transition-colors"
            >
              Sign in here →
            </Link>
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-2xl p-8 border border-[#FF4500]/30">
          <div className="absolute inset-0 grid-pattern opacity-10 rounded-2xl"></div>

          <div className="relative z-10">
            {error && (
              <div className="mb-6 bg-[#FF4500]/10 border-l-4 border-[#FF4500] rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-[#FF4500]"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-[#FF4500] font-semibold">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-[#39FF14]/30 rounded-lg bg-[#0A1128]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all"
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-[#39FF14]/30 rounded-lg bg-[#0A1128]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-gray-300 uppercase tracking-wider mb-2"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-[#39FF14]/30 rounded-lg bg-[#0A1128]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all"
                  placeholder="Create a strong password"
                />
              </div>

              <div className="flex items-start">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 mt-1 rounded border-[#39FF14]/30 bg-[#0A1128]/50 text-[#39FF14] focus:ring-[#39FF14]"
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-gray-300"
                >
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    className="font-semibold text-[#FFD700] hover:text-[#FFA500] transition-colors"
                  >
                    Terms and Conditions
                  </Link>
                  {' '}and confirm I am 18+ years old
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-lg text-xl font-bold text-white bg-gradient-to-r from-[#39FF14] to-[#00FF41] hover:from-[#00FF41] hover:to-[#39FF14] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#39FF14] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 glow-green text-[#0A1128]"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-[#0A1128] border-t-transparent rounded-full"
                      />
                      Creating account...
                    </>
                  ) : (
                    <>
                      🎮 Create Account
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="mt-6 flex items-center justify-center">
              <div className="flex-1 border-t border-gray-700"></div>
              <span className="px-4 text-sm text-gray-500 uppercase tracking-wider">Or</span>
              <div className="flex-1 border-t border-gray-700"></div>
            </div>

            {/* Login CTA */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 mb-3">Already have an account?</p>
              <Link
                href="/login"
                className="block w-full py-3 px-4 border-2 border-[#FF4500]/50 rounded-lg text-lg font-bold text-[#FF4500] hover:bg-[#FF4500]/10 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
