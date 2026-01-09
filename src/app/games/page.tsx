'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Game } from '@/types';

export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Filter states
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [sortBy, setSortBy] = useState<string>('date');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadGamesAndUser();
  }, []);

  useEffect(() => {
    filterAndSortGames();
  }, [games, selectedSport, selectedStatus, sortBy, searchTerm]);

  const loadGamesAndUser = async () => {
    try {
      // Get user information
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      // Fetch all games
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .order('game_date', { ascending: true });

      if (gamesError) throw gamesError;

      setGames(gamesData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortGames = () => {
    let filtered = [...games];

    // Filter by sport
    if (selectedSport !== 'all') {
      filtered = filtered.filter(game => game.sport === selectedSport);
    }

    // Filter by status
    if (selectedStatus === 'active') {
      filtered = filtered.filter(game => game.is_active);
    } else if (selectedStatus === 'completed') {
      filtered = filtered.filter(game => !game.is_active);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(game =>
        game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.home_team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        game.away_team.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort games
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.game_date).getTime() - new Date(b.game_date).getTime();
        case 'date-desc':
          return new Date(b.game_date).getTime() - new Date(a.game_date).getTime();
        case 'entry-fee':
          return a.entry_fee - b.entry_fee;
        case 'entry-fee-desc':
          return b.entry_fee - a.entry_fee;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredGames(filtered);
  };

  const getGameStatus = (game: any) => {
    const now = new Date();
    const gameDate = new Date(game.game_date);

    if (!game.is_active) return 'completed';
    if (gameDate < now) return 'live';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-[#1E3A8A]/30 border-[#39FF14] text-[#39FF14]';
      case 'live': return 'bg-[#FF4500]/30 border-[#FF4500] text-[#FF4500] animate-pulse-glow';
      case 'completed': return 'bg-white/10 border-white/30 text-gray-400';
      default: return 'bg-[#39FF14]/30 border-[#39FF14] text-[#39FF14]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return '🔜 UPCOMING';
      case 'live': return '🔴 LIVE NOW';
      case 'completed': return '✓ COMPLETED';
      default: return 'ACTIVE';
    }
  };

  const timeUntilGame = (gameDate: string) => {
    const now = new Date();
    const game = new Date(gameDate);
    const diff = game.getTime() - now.getTime();

    if (diff < 0) return 'STARTED';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}D ${hours}H`;
    if (hours > 0) return `${hours}H ${minutes}M`;
    return `${minutes}M`;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-[#050818] to-[#0A1128]">
        <motion.div
          className="relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-32 h-32 border-4 border-[#FF4500] border-t-transparent rounded-full"></div>
          <div className="absolute inset-0 w-32 h-32 border-4 border-[#39FF14] border-b-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
        </motion.div>
        <motion.p
          className="mt-8 text-white text-xl font-bold text-display"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          LOADING GAMES...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050818] via-[#0A1128] to-[#1E3A8A] grid-pattern">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <motion.div
          className="flex flex-col md:flex-row md:items-center md:justify-between mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white text-display mb-2">
              ALL <span className="text-[#FF4500]">GAMES</span>
            </h1>
            <p className="text-xl text-gray-400">
              Choose your game. Claim your squares. <span className="text-[#FFD700] font-bold">Win big.</span>
            </p>
          </div>
          {user && (
            <motion.div
              className="mt-4 md:mt-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#39FF14] to-[#00FF41] text-[#0A1128] text-lg font-bold rounded-lg glow-green transition-all"
              >
                MY DASHBOARD →
              </Link>
            </motion.div>
          )}
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-r from-[#FF4500]/20 to-[#FF6B35]/20 border-l-4 border-[#FF4500] p-6 rounded-r-lg mb-8 backdrop-blur-sm"
          >
            <div className="flex items-start">
              <svg className="h-6 w-6 text-[#FF4500]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-white font-semibold">
                  Error loading games. Please refresh the page.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Statistics Bar */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <motion.div
            className="bg-gradient-to-br from-[#FF4500]/20 to-[#FF6B35]/20 backdrop-blur-sm rounded-xl p-6 border border-[#FF4500]/30 glow-orange"
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="text-4xl font-bold text-[#FF4500] text-glow-orange text-display">
              {games.filter(g => g.is_active).length}
            </div>
            <div className="text-sm text-white uppercase tracking-wider mt-1">Active Games</div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-[#39FF14]/20 to-[#00FF41]/20 backdrop-blur-sm rounded-xl p-6 border border-[#39FF14]/30 glow-green"
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="text-4xl font-bold text-[#39FF14] text-glow-green text-display">
              {games.filter(g => g.sport === 'NFL').length}
            </div>
            <div className="text-sm text-white uppercase tracking-wider mt-1">🏈 NFL Games</div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-[#FFA500]/20 to-[#FFD700]/20 backdrop-blur-sm rounded-xl p-6 border border-[#FFA500]/30 glow-gold"
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="text-4xl font-bold text-[#FFD700] text-glow-gold text-display">
              {games.filter(g => g.sport === 'NBA').length}
            </div>
            <div className="text-sm text-white uppercase tracking-wider mt-1">🏀 NBA Games</div>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <div className="text-4xl font-bold text-white text-display">
              {games.filter(g => !g.is_active).length}
            </div>
            <div className="text-sm text-gray-400 uppercase tracking-wider mt-1">Completed</div>
          </motion.div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          className="bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/80 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
                🔍 Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Team or game name..."
                className="w-full px-4 py-3 bg-[#0A1128]/80 border-2 border-[#FF4500]/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FF4500] focus:glow-orange transition-all"
              />
            </div>

            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
                🏆 Sport
              </label>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A1128]/80 border-2 border-[#39FF14]/30 rounded-lg text-white focus:outline-none focus:border-[#39FF14] focus:glow-green transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Sports</option>
                <option value="NFL">🏈 NFL</option>
                <option value="NBA">🏀 NBA</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
                📊 Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A1128]/80 border-2 border-[#FFD700]/30 rounded-lg text-white focus:outline-none focus:border-[#FFD700] focus:glow-gold transition-all appearance-none cursor-pointer"
              >
                <option value="all">All Games</option>
                <option value="active">Active Only</option>
                <option value="completed">Completed Only</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">
                ⚡ Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A1128]/80 border-2 border-white/30 rounded-lg text-white focus:outline-none focus:border-white focus:shadow-lg transition-all appearance-none cursor-pointer"
              >
                <option value="date">Date (Earliest First)</option>
                <option value="date-desc">Date (Latest First)</option>
                <option value="entry-fee">Entry Fee (Low to High)</option>
                <option value="entry-fee-desc">Entry Fee (High to Low)</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 font-semibold uppercase tracking-wide">
            <span className="text-[#39FF14]">{filteredGames.length}</span> of <span className="text-white">{games.length}</span> games
          </p>
        </div>

        {/* Games Grid */}
        {filteredGames.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="inline-block p-8 bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/80 backdrop-blur-sm rounded-2xl border border-white/10">
              <svg className="mx-auto h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-2xl font-bold text-white text-display mb-2">NO GAMES FOUND</h3>
              <p className="text-gray-400">
                Try adjusting your filters or search terms.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredGames.map((game: any, index: number) => {
              const status = getGameStatus(game);
              const totalPayout = (game.payout_q1 || 0) + (game.payout_q2 || 0) + (game.payout_q3 || 0) + (game.payout_final || 0);

              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="group"
                >
                  <Link href={`/games/${game.id}`}>
                    <div className="relative bg-gradient-to-br from-[#1E3A8A]/40 to-[#0A1128]/90 backdrop-blur-sm rounded-xl overflow-hidden border border-[#FF4500]/20 hover:border-[#FF4500]/60 transition-all duration-300 hover:glow-orange h-full">
                      {/* PLACEHOLDER: Background gradient - will be replaced with game card images */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${game.sport === 'NFL' ? 'from-[#39FF14]/10 to-transparent' : 'from-[#FFA500]/10 to-transparent'} opacity-50`}></div>

                      {/* Content */}
                      <div className="relative z-10 p-6">
                        {/* Header: Sport & Status */}
                        <div className="flex items-start justify-between mb-4">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            game.sport === 'NFL'
                              ? 'bg-[#39FF14]/30 text-[#39FF14] border border-[#39FF14]/50'
                              : 'bg-[#FFA500]/30 text-[#FFA500] border border-[#FFA500]/50'
                          }`}>
                            {game.sport === 'NFL' ? '🏈 NFL' : '🏀 NBA'}
                          </span>
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </span>
                        </div>

                        {/* Game Title */}
                        <h3 className="text-xl font-bold text-white text-display mb-3 group-hover:text-[#FF4500] transition-colors">
                          {game.name}
                        </h3>

                        {/* Teams Matchup */}
                        <div className="flex items-center justify-center text-center mb-4 py-4 bg-black/30 rounded-lg">
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm uppercase tracking-wide">{game.home_team}</p>
                          </div>
                          <div className="px-3">
                            <span className="text-[#FF4500] font-bold text-xl">VS</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm uppercase tracking-wide">{game.away_team}</p>
                          </div>
                        </div>

                        {/* Game Details Grid */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 uppercase tracking-wide">Date:</span>
                            <span className="text-white font-semibold">
                              {new Date(game.game_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 uppercase tracking-wide">Time:</span>
                            <span className="text-white font-semibold">
                              {new Date(game.game_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          {status === 'upcoming' && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-400 uppercase tracking-wide">Starts In:</span>
                              <span className="text-[#39FF14] font-bold text-glow-green">
                                {timeUntilGame(game.game_date)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 uppercase tracking-wide">Entry Fee:</span>
                            <span className={`font-bold ${game.entry_fee === 0 ? 'text-[#39FF14]' : 'text-[#FFD700]'}`}>
                              {game.entry_fee === 0 ? 'FREE' : `${game.entry_fee} HC`}
                            </span>
                          </div>
                        </div>

                        {/* Prize Pool - Big Highlight */}
                        <div className="bg-gradient-to-r from-[#FFD700]/20 to-[#FFA500]/20 border border-[#FFD700]/50 rounded-lg p-4 mb-4 glow-gold">
                          <div className="text-center">
                            <p className="text-xs text-[#FFD700] uppercase tracking-wider mb-1">Total Prize Pool</p>
                            <p className="text-3xl font-extrabold text-[#FFD700] text-display text-glow-gold">
                              {totalPayout} HC
                            </p>
                          </div>
                        </div>

                        {/* Numbers Status */}
                        <div className="flex items-center justify-center">
                          <span className={`text-xs px-3 py-1 rounded-lg font-bold uppercase tracking-wider ${
                            game.numbers_assigned
                              ? 'bg-[#39FF14]/30 text-[#39FF14] border border-[#39FF14]/50'
                              : 'bg-[#FFA500]/30 text-[#FFA500] border border-[#FFA500]/50'
                          }`}>
                            {game.numbers_assigned ? '✓ Numbers Assigned' : '⏱ Numbers Pending'}
                          </span>
                        </div>

                        {/* CTA */}
                        <div className="mt-6">
                          <div className="w-full bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-center py-3 rounded-lg font-bold uppercase tracking-wide group-hover:glow-orange transition-all">
                            {status === 'completed' ? 'VIEW RESULTS →' : 'JOIN GAME →'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Call to Action - Not Logged In */}
        {!user && (
          <motion.div
            className="mt-16 bg-gradient-to-br from-[#FF4500]/20 via-[#1E3A8A]/20 to-[#39FF14]/20 backdrop-blur-sm rounded-2xl p-12 text-center border border-[#FF4500]/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-4xl font-extrabold text-white text-display mb-4">
              READY TO <span className="text-[#FF4500]">PLAY?</span>
            </h3>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Create an account in seconds and start claiming squares. Real money. Real games. Real excitement.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/signup"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-xl font-bold rounded-lg glow-orange"
                >
                  SIGN UP NOW
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/login"
                  className="inline-flex items-center px-8 py-4 bg-white/10 border-2 border-white/30 text-white text-xl font-bold rounded-lg hover:bg-white/20 transition-all"
                >
                  LOG IN
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
