'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
      case 'upcoming': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'live': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'completed': return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
      default: return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'live': return 'Live';
      case 'completed': return 'Completed';
      default: return 'Active';
    }
  };

  const timeUntilGame = (gameDate: string) => {
    const now = new Date();
    const game = new Date(gameDate);
    const diff = game.getTime() - now.getTime();
    
    if (diff < 0) return 'Started';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Games</h1>
          <p className="mt-1 text-lg text-gray-500 dark:text-gray-400">
            Browse and join Super Bowl Squares games
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-4">
          {user && (
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              My Dashboard
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                Error loading games. Please try again later.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {games.filter(g => g.is_active).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Active Games</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {games.filter(g => g.sport === 'NFL').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">NFL Games</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {games.filter(g => g.sport === 'NBA').length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">NBA Games</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {games.filter(g => !g.is_active).length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Games
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by team or game name..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
            />
          </div>

          {/* Sport Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sport
            </label>
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="all">All Sports</option>
              <option value="NFL">🏈 NFL</option>
              <option value="NBA">🏀 NBA</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="all">All Games</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="date">Date (Earliest First)</option>
              <option value="date-desc">Date (Latest First)</option>
              <option value="entry-fee">Entry Fee (Low to High)</option>
              <option value="entry-fee-desc">Entry Fee (High to Low)</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredGames.length} of {games.length} games
        </p>
      </div>

      {/* Games Grid */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No games found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Try adjusting your filters or search terms.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game: any) => {
            const status = getGameStatus(game);
            return (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="block hover:shadow-lg transition-shadow duration-200"
              >
                <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate flex-1">
                        {game.name}
                      </h3>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        game.sport === 'NFL' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
                      }`}>
                        {game.sport}
                      </span>
                    </div>
                    
                    <div className="mt-3 space-y-3">
                      {/* Teams */}
                      <div className="flex justify-center items-center text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{game.home_team}</span>
                        <span className="mx-2">vs</span>
                        <span className="font-medium">{game.away_team}</span>
                      </div>

                      {/* Status and Timing */}
                      <div className="flex justify-between items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                        {status === 'upcoming' && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Starts in {timeUntilGame(game.game_date)}
                          </span>
                        )}
                      </div>

                      {/* Game Details */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Date:</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(game.game_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Time:</span>
                          <span className="text-gray-900 dark:text-white">
                            {new Date(game.game_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Entry Fee:</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                            {game.entry_fee} HC per box
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Numbers:</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            game.numbers_assigned 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                              : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                          }`}>
                            {game.numbers_assigned ? 'Assigned' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-4 sm:px-6">
                    <div className="text-sm">
                      <span className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">
                        {status === 'completed' ? 'View results' : 'Join game'} →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Call to Action */}
      {!user && (
        <div className="mt-12 bg-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Ready to Play?
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Create an account to join games and start winning HotCoins!
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/signup"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign Up Now
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-700 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Log In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}