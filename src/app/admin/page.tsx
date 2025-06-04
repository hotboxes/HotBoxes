 'use client';

  import { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import { supabase } from '@/lib/supabase';
  import Link from 'next/link';

  export default function AdminPage() {
    const [user, setUser] = useState<any>(null);
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

        const { data: gamesData } = await supabase
          .from('games')
          .select('*')
          .order('game_date', { ascending: false })
          .limit(10);

        setGames(gamesData || []);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteGame = async (gameId: string, gameName: string) => {
      if (!confirm(`Are you sure you want to delete the game "${gameName}"? This action cannot be undone.`)) {
        return;
      }

      try {
        // First delete all boxes for this game
        const { error: boxesError } = await supabase
          .from('boxes')
          .delete()
          .eq('game_id', gameId);

        if (boxesError) {
          console.error('Error deleting boxes:', boxesError);
          alert('Failed to delete game boxes. Please try again.');
          return;
        }

        // Then delete the game
        const { error: gameError } = await supabase
          .from('games')
          .delete()
          .eq('id', gameId);

        if (gameError) {
          console.error('Error deleting game:', gameError);
          alert('Failed to delete game. Please try again.');
          return;
        }

        // Refresh the games list
        await loadAdminData();
        alert(`Game "${gameName}" has been deleted successfully.`);
      } catch (error) {
        console.error('Error deleting game:', error);
        alert('An error occurred while deleting the game.');
      }
    };

    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 
  border-indigo-600"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    const activeGames = games.filter(g => g.is_active).length;
    const totalGames = games.length;
    const totalRevenue = games.reduce((sum, game) => {
      return sum + (game.entry_fee * 100);
    }, 0);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin
  Dashboard</h1>
          <Link
            href="/admin/games/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 
  rounded-md text-sm font-medium"
          >
            Add New Game
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center 
  justify-center">
                    <span className="text-white text-sm font-bold">🎮</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400
   truncate">
                      Active Games
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {activeGames}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center 
  justify-center">
                    <span className="text-white text-sm font-bold">💰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400
   truncate">
                      Potential Revenue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {totalRevenue} HC
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center 
  justify-center">
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400
   truncate">
                      Total Games
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {totalGames}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md 
  mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 
  dark:text-white">
              Quick Actions
            </h3>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              <Link
                href="/admin/games/create"
                className="bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 
  dark:hover:bg-indigo-900/50 p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">🏈</div>
                <div className="text-sm font-medium text-indigo-700 
  dark:text-indigo-300">
                  Add NFL Game
                </div>
              </Link>
              <Link
                href="/admin/games/create?sport=NBA"
                className="bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 
  dark:hover:bg-orange-900/50 p-4 rounded-lg text-center transition-colors"
              >
                <div className="text-2xl mb-2">🏀</div>
                <div className="text-sm font-medium text-orange-700 
  dark:text-orange-300">
                  Add NBA Game
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Games */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden 
  sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 
  dark:text-white">
              Recent Games
            </h3>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            {games && games.length > 0 ? (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {games.map((game) => (
                  <li key={game.id}>
                    <div className="px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-0.5 
  rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 
  dark:text-blue-200">
                            {game.sport}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 
  dark:text-white">
                            {game.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {game.home_team} vs {game.away_team} • {game.entry_fee} HC
  per box
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {game.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 
  rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 
  dark:text-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 
  rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 
  dark:text-gray-200">
                            Closed
                          </span>
                        )}
                        <Link
                          href={`/admin/games/${game.id}`}
                          className="text-indigo-600 dark:text-indigo-400 
  hover:text-indigo-500 text-sm font-medium"
                        >
                          Manage
                        </Link>
                        <button
                          onClick={() => handleDeleteGame(game.id, game.name)}
                          className="text-red-600 dark:text-red-400 hover:text-red-500 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No games yet. Create
  your first game!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
