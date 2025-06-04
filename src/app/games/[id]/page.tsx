'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Grid from '@/components/Grid';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [game, setGame] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGameData();
  }, [id]);

  const loadGameData = async () => {
    try {
      // Get user information
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      
      // Fetch game details
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (gameError || !gameData) {
        setError('Game not found');
        setLoading(false);
        return;
      }

      setGame(gameData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error: {error}</h1>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Game not found</h1>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{game.name}</h1>
          <p className="mt-1 text-lg text-gray-500 dark:text-gray-400">
            {game.home_team} vs {game.away_team}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2">
          {game.is_active ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
              Closed
            </span>
          )}
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Game Details
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Select your boxes to participate
          </p>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200 dark:sm:divide-gray-700">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Home Team
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {game.home_team}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Away Team
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {game.away_team}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Entry Fee
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                {game.entry_fee === 0 ? 'Free' : `${game.entry_fee} HotCoins per box`}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Prize Structure
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="font-semibold">1st Quarter</div>
                    <div className="text-indigo-600 dark:text-indigo-400">
                      {game.entry_fee === 0 ? 
                        `${game.payout_q1 || 25}%` : 
                        `${Math.floor(game.entry_fee * 100 * 0.9 * (game.payout_q1 || 25) / 100)} HC`
                      }
                    </div>
                  </div>
                  <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="font-semibold">Halftime</div>
                    <div className="text-indigo-600 dark:text-indigo-400">
                      {game.entry_fee === 0 ? 
                        `${game.payout_q2 || 25}%` : 
                        `${Math.floor(game.entry_fee * 100 * 0.9 * (game.payout_q2 || 25) / 100)} HC`
                      }
                    </div>
                  </div>
                  <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="font-semibold">3rd Quarter</div>
                    <div className="text-indigo-600 dark:text-indigo-400">
                      {game.entry_fee === 0 ? 
                        `${game.payout_q3 || 25}%` : 
                        `${Math.floor(game.entry_fee * 100 * 0.9 * (game.payout_q3 || 25) / 100)} HC`
                      }
                    </div>
                  </div>
                  <div className="text-center bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <div className="font-semibold">Final</div>
                    <div className="text-indigo-600 dark:text-indigo-400">
                      {game.entry_fee === 0 ? 
                        `${game.payout_final || 25}%` : 
                        `${Math.floor(game.entry_fee * 100 * 0.9 * (game.payout_final || 25) / 100)} HC`
                      }
                    </div>
                  </div>
                </div>
                {game.entry_fee === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Free game - Winners receive bragging rights!
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Total prize pool: {Math.floor(game.entry_fee * 100 * 0.9)} HotCoins
                  </p>
                )}
              </dd>
            </div>
            {game.home_scores && game.home_scores.length > 0 && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Current Score
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {game.home_team}: {game.home_scores[game.home_scores.length - 1]} - {game.away_team}: {game.away_scores[game.away_scores.length - 1]}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-2 sm:p-6">
        <Grid 
          gameId={id} 
          userId={user?.id} 
          homeScores={game.home_scores || []}
          awayScores={game.away_scores || []}
          readOnly={!game.is_active}
          homeNumbers={game.home_numbers || []}
          awayNumbers={game.away_numbers || []}
          numbersAssigned={game.numbers_assigned || false}
          entryFee={game.entry_fee || 0}
          homeTeam={game.home_team}
          awayTeam={game.away_team}
        />
      </div>
      
      {!user && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You need to be logged in to select boxes.
          </p>
          <a
            href="/login"
            className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Log in
          </a>
        </div>
      )}
    </div>
  );
}