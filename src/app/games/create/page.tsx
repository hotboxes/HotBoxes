'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CreateGamePage() {
  const [name, setName] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to create a game');
      }

      // Create the game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert([
          {
            name,
            homeTeam,
            awayTeam,
            homeScores: [],
            awayScores: [],
            isActive: true,
            createdBy: user.id,
          },
        ])
        .select()
        .single();

      if (gameError) throw gameError;

      // Create boxes for the game
      const boxes = [];
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          boxes.push({
            id: `${game.id}-${row}-${col}`,
            row,
            column: col,
            userId: null,
            gameId: game.id,
          });
        }
      }

      const { error: boxesError } = await supabase
        .from('boxes')
        .insert(boxes);

      if (boxesError) throw boxesError;

      // Redirect to the new game page
      router.push(`/games/${game.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Create Game</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Set up a new Super Bowl Squares game for your friends to join.
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md overflow-hidden">
              <div className="px-4 py-5 bg-white dark:bg-gray-800 sm:p-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Game Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="home-team" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Home Team
                    </label>
                    <input
                      type="text"
                      name="home-team"
                      id="home-team"
                      value={homeTeam}
                      onChange={(e) => setHomeTeam(e.target.value)}
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="away-team" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Away Team
                    </label>
                    <input
                      type="text"
                      name="away-team"
                      id="away-team"
                      value={awayTeam}
                      onChange={(e) => setAwayTeam(e.target.value)}
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 dark:border-gray-700 rounded-md dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Game'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}