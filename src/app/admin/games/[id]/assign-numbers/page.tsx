'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface AssignNumbersPageProps {
  params: {
    id: string;
  };
}

export default function AssignNumbersPage({ params }: AssignNumbersPageProps) {
  const { id } = params;
  const [loading, setLoading] = useState(false);
  const [game, setGame] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminAndLoadGame();
  }, []);

  const checkAdminAndLoadGame = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/');
        return;
      }

      // Load game
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (gameError || !gameData) {
        setError('Game not found');
        return;
      }

      setGame(gameData);
    } catch (err) {
      setError('Failed to load game');
    }
  };

  const handleAssignNumbers = async () => {
    if (!game || game.numbersAssigned) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/games/${id}/assign-numbers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign numbers');
      }

      alert('Numbers assigned successfully!');
      router.push(`/admin/games/${id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!game) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assign Numbers</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Randomly assign numbers to the grid for: {game.name}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Game Information</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Game</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">{game.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Teams</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {game.homeTeam} vs {game.awayTeam}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Game Date</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {new Date(game.gameDate).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Numbers Status</dt>
                <dd className="mt-1 text-sm">
                  {game.numbersAssigned ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Already Assigned
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      Not Assigned
                    </span>
                  )}
                </dd>
              </div>
            </div>
          </div>

          {game.numbersAssigned ? (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Current Numbers</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Home Team ({game.homeTeam})
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    [{game.homeNumbers?.join(', ')}]
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Away Team ({game.awayTeam})
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    [{game.awayNumbers?.join(', ')}]
                  </dd>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Ready to Assign Numbers
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      This will randomly assign numbers 0-9 to both the home and away team rows/columns.
                      Once assigned, the numbers cannot be changed.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={handleAssignNumbers}
                      disabled={loading}
                      className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      {loading ? 'Assigning Numbers...' : 'Assign Numbers Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => router.push(`/admin/games/${id}`)}
              className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md"
            >
              Back to Game
            </button>
            {!game.numbersAssigned && (
              <button
                onClick={handleAssignNumbers}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading ? 'Assigning...' : 'Assign Numbers'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}