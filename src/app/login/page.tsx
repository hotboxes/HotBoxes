'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Backup timeout to prevent infinite loading
    const backupTimeout = setTimeout(() => {
      console.log('Login taking too long, resetting...');
      setLoading(false);
      setError('Login is taking longer than expected. Please try again.');
    }, 10000); // 10 seconds

    try {
      console.log('Attempting login with:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', { data, error });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('Login successful but no user data returned');
      }

      console.log('Login successful, redirecting...');
      clearTimeout(backupTimeout);

      // Add a small delay to ensure auth state updates, then redirect
      setTimeout(() => {
        window.location.href = '/games';
      }, 100);
    } catch (err: any) {
      console.error('Login error:', err);
      clearTimeout(backupTimeout);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-5xl font-extrabold text-white text-display mb-3">
            WELCOME <span className="text-[#FF4500]">BACK</span>
          </h2>
          <p className="text-xl text-gray-300 font-semibold mb-2">
            Sign in to claim your squares
          </p>
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="font-bold text-[#39FF14] hover:text-[#00FF41] transition-colors"
            >
              Create one now →
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-[#39FF14]/30 rounded-lg bg-[#0A1128]/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#39FF14] focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#39FF14]/30 bg-[#0A1128]/50 text-[#39FF14] focus:ring-[#39FF14]"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-gray-300"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    href="/forgot-password"
                    className="font-semibold text-[#FFD700] hover:text-[#FFA500] transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-lg text-xl font-bold text-white bg-gradient-to-r from-[#FF4500] to-[#FF6B35] hover:from-[#FF6B35] hover:to-[#FF4500] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500] disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 glow-orange"
                >
                  {loading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      🎮 Sign In
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

            {/* Sign Up CTA */}
            <div className="mt-6 text-center">
              <p className="text-gray-400 mb-3">New to HotBoxes?</p>
              <Link
                href="/signup"
                className="block w-full py-3 px-4 border-2 border-[#39FF14]/50 rounded-lg text-lg font-bold text-[#39FF14] hover:bg-[#39FF14]/10 transition-all"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
