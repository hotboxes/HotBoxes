'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface NavigationProps {
  user?: {
    id: string;
    email: string;
    username?: string;
    hotcoinBalance?: number;
    isAdmin?: boolean;
  } | null;
}

export default function Navigation({ user: propUser }: NavigationProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Load profile data
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profileData);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      if (authUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#0A1128]/95 backdrop-blur-lg shadow-xl shadow-[#FF4500]/10'
        : 'bg-[#0A1128]/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center group">
              {/* PLACEHOLDER: Replace with actual logo image */}
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-lg flex items-center justify-center glow-orange">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white text-display group-hover:text-[#FF4500] transition-colors">
                  HOT<span className="text-[#FF4500]">BOXES</span>
                </h1>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:ml-10 lg:flex lg:space-x-1">
              <Link
                href="/games"
                className={`${
                  pathname === '/games'
                    ? 'text-[#FF4500] border-b-2 border-[#FF4500]'
                    : 'text-gray-300 hover:text-[#FF4500] border-b-2 border-transparent hover:border-[#FF6B35]'
                } px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all`}
              >
                Games
              </Link>
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className={`${
                      pathname === '/dashboard'
                        ? 'text-[#FF4500] border-b-2 border-[#FF4500]'
                        : 'text-gray-300 hover:text-[#FF4500] border-b-2 border-transparent hover:border-[#FF6B35]'
                    } px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/hotcoins"
                    className={`${
                      pathname === '/hotcoins'
                        ? 'text-[#FF4500] border-b-2 border-[#FF4500]'
                        : 'text-gray-300 hover:text-[#FF4500] border-b-2 border-transparent hover:border-[#FF6B35]'
                    } px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all`}
                  >
                    HotCoins
                  </Link>
                  <Link
                    href="/settings"
                    className={`${
                      pathname === '/settings'
                        ? 'text-[#FF4500] border-b-2 border-[#FF4500]'
                        : 'text-gray-300 hover:text-[#FF4500] border-b-2 border-transparent hover:border-[#FF6B35]'
                    } px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all`}
                  >
                    Settings
                  </Link>
                  {profile?.is_admin && (
                    <Link
                      href="/admin"
                      className={`${
                        pathname.startsWith('/admin')
                          ? 'text-[#39FF14] border-b-2 border-[#39FF14] glow-green'
                          : 'text-gray-300 hover:text-[#39FF14] border-b-2 border-transparent hover:border-[#39FF14]'
                      } px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all`}
                    >
                      Admin
                    </Link>
                  )}
                </>
              )}
            </nav>
          </div>

          {/* Right side - User info / Auth buttons */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4">
            {user ? (
              <>
                {/* HotCoin Balance Badge */}
                <div className="flex items-center space-x-3 bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-[#FFD700]/30 glow-gold">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center">
                      <span className="text-[#0A1128] text-xs font-bold">HC</span>
                    </div>
                    <span className="text-[#FFD700] font-bold text-lg">
                      {profile?.hotcoin_balance || 0}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-gray-600"></div>
                  <span className="text-white font-medium text-sm">
                    {profile?.username || user.email?.split('@')[0]}
                  </span>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-all border border-white/20 hover:border-white/40"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-white hover:text-[#FF4500] rounded-lg text-sm font-semibold transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-6 py-2 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white rounded-lg text-sm font-bold transition-all transform hover:scale-105 glow-orange"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FF4500]"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden border-t border-white/10 bg-[#0A1128]/98 backdrop-blur-lg">
          <div className="pt-2 pb-3 space-y-1 px-4">
            <Link
              href="/games"
              className={`${
                pathname === '/games'
                  ? 'bg-[#FF4500]/20 border-l-4 border-[#FF4500] text-[#FF4500]'
                  : 'border-l-4 border-transparent text-gray-300 hover:bg-white/5 hover:border-[#FF6B35] hover:text-white'
              } block pl-4 pr-4 py-3 text-base font-semibold uppercase tracking-wide`}
            >
              Games
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`${
                    pathname === '/dashboard'
                      ? 'bg-[#FF4500]/20 border-l-4 border-[#FF4500] text-[#FF4500]'
                      : 'border-l-4 border-transparent text-gray-300 hover:bg-white/5 hover:border-[#FF6B35] hover:text-white'
                  } block pl-4 pr-4 py-3 text-base font-semibold uppercase tracking-wide`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/hotcoins"
                  className={`${
                    pathname === '/hotcoins'
                      ? 'bg-[#FF4500]/20 border-l-4 border-[#FF4500] text-[#FF4500]'
                      : 'border-l-4 border-transparent text-gray-300 hover:bg-white/5 hover:border-[#FF6B35] hover:text-white'
                  } block pl-4 pr-4 py-3 text-base font-semibold uppercase tracking-wide`}
                >
                  HotCoins
                </Link>
                <Link
                  href="/settings"
                  className={`${
                    pathname === '/settings'
                      ? 'bg-[#FF4500]/20 border-l-4 border-[#FF4500] text-[#FF4500]'
                      : 'border-l-4 border-transparent text-gray-300 hover:bg-white/5 hover:border-[#FF6B35] hover:text-white'
                  } block pl-4 pr-4 py-3 text-base font-semibold uppercase tracking-wide`}
                >
                  Settings
                </Link>
                {profile?.is_admin && (
                  <Link
                    href="/admin"
                    className={`${
                      pathname.startsWith('/admin')
                        ? 'bg-[#39FF14]/20 border-l-4 border-[#39FF14] text-[#39FF14]'
                        : 'border-l-4 border-transparent text-gray-300 hover:bg-white/5 hover:border-[#39FF14] hover:text-white'
                    } block pl-4 pr-4 py-3 text-base font-semibold uppercase tracking-wide`}
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile User Section */}
          <div className="pt-4 pb-3 border-t border-white/10">
            {user ? (
              <div className="px-4 space-y-3">
                {/* HotCoin Balance */}
                <div className="flex items-center justify-between bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 backdrop-blur-sm px-4 py-3 rounded-lg border border-[#FFD700]/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center">
                      <span className="text-[#0A1128] text-sm font-bold">HC</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 uppercase">Balance</div>
                      <div className="text-[#FFD700] font-bold text-xl">
                        {profile?.hotcoin_balance || 0}
                      </div>
                    </div>
                  </div>
                  <div className="text-white font-medium text-sm">
                    {profile?.username || user.email?.split('@')[0]}
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-all border border-white/20"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2 px-4">
                <Link
                  href="/login"
                  className="block text-center px-4 py-3 rounded-lg text-base font-semibold text-white hover:bg-white/5 border border-white/20"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="block text-center px-4 py-3 rounded-lg text-base font-bold bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white glow-orange"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
