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

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin
  Dashboard</h1>
        </div>

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
  rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 
  rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Closed
                          </span>
                        )}
                        <Link
                          href={`/admin/games/${game.id}`}
                          className="text-indigo-600 hover:text-indigo-500 text-sm 
  font-medium"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-gray-500">No games yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
