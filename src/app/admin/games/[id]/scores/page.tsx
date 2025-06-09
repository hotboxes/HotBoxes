'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Game } from '@/types';

interface ScoresPageProps {
  params: {
    id: string;
  };
}

export default function ScoresPage({ params }: ScoresPageProps) {
  const { id } = params;
  const [game, setGame] = useState<Game | null>(null);
  const [homeScores, setHomeScores] = useState<number[]>([0, 0, 0, 0]);
  const [awayScores, setAwayScores] = useState<number[]>([0, 0, 0, 0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [winners, setWinners] = useState<any[]>([]);
  const router = useRouter();

  const periodLabels = ['1st Quarter', 'Halftime', '3rd Quarter', 'Final'];

  useEffect(() => {
    checkAdminAndLoadGame();
  }, []);

  const checkAdminAndLoadGame = async () => {
    setLoading(true);
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
      
      // Scores loaded successfully
      
      // Set existing scores if any
      if (gameData.home_scores && gameData.home_scores.length > 0) {
        const loadedHomeScores = [...gameData.home_scores, ...Array(4 - gameData.home_scores.length).fill(0)].slice(0, 4);
        // Setting home scores
        setHomeScores(loadedHomeScores);
      } else {
        // No home scores found, using defaults
        setHomeScores([0, 0, 0, 0]);
      }
      
      if (gameData.away_scores && gameData.away_scores.length > 0) {
        const loadedAwayScores = [...gameData.away_scores, ...Array(4 - gameData.away_scores.length).fill(0)].slice(0, 4);
        // Setting away scores
        setAwayScores(loadedAwayScores);
      } else {
        // No away scores found, using defaults
        setAwayScores([0, 0, 0, 0]);
      }
    } catch (err) {
      setError('Failed to load game');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (team: 'home' | 'away', period: number, value: string) => {
    const score = parseInt(value) || 0;
    if (team === 'home') {
      const newScores = [...homeScores];
      newScores[period] = score;
      setHomeScores(newScores);
    } else {
      const newScores = [...awayScores];
      newScores[period] = score;
      setAwayScores(newScores);
    }
  };

  const calculateWinners = () => {
    if (!game?.home_numbers || !game?.away_numbers) return [];
    
    const calculatedWinners = [];
    for (let i = 0; i < homeScores.length; i++) {
      if (homeScores[i] > 0 || awayScores[i] > 0) {
        const homeDigit = homeScores[i] % 10;
        const awayDigit = awayScores[i] % 10;
        
        const homeRow = game.home_numbers.indexOf(homeDigit);
        const awayCol = game.away_numbers.indexOf(awayDigit);
        
        if (homeRow !== -1 && awayCol !== -1) {
          calculatedWinners.push({
            period: periodLabels[i],
            homeScore: homeScores[i],
            awayScore: awayScores[i],
            homeDigit,
            awayDigit,
            gridPosition: { row: homeRow, col: awayCol },
            boxId: `${game.id}-${homeRow}-${awayCol}`
          });
        }
      }
    }
    return calculatedWinners;
  };

  const handleSaveScores = async () => {
    if (!game) {
      alert('No game loaded!');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // FORCE EXACT VALUES - NO BULLSHIT
      const exactHomeScores = [
        parseInt(homeScores[0]) || 0,
        parseInt(homeScores[1]) || 0,
        parseInt(homeScores[2]) || 0,
        parseInt(homeScores[3]) || 0
      ];
      const exactAwayScores = [
        parseInt(awayScores[0]) || 0,
        parseInt(awayScores[1]) || 0,
        parseInt(awayScores[2]) || 0,
        parseInt(awayScores[3]) || 0
      ];

      // Saving scores to database

      const response = await fetch(`/api/games/${id}/update-scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          homeScores: exactHomeScores,
          awayScores: exactAwayScores,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update scores');
      }

      // Update local state
      setGame(prev => ({
        ...prev,
        home_scores: exactHomeScores,
        away_scores: exactAwayScores
      }));

      // Scores saved successfully
    } catch (err: any) {
      alert('ERROR: ' + err.message);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentWinners = calculateWinners();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Game not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Update Scores</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {game.name} - {game.home_team} vs {game.away_team}
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

      {!game.numbers_assigned && (
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Numbers must be assigned before updating scores.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Entry */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Score Entry</h2>
          
          <div className="space-y-6">
            {periodLabels.map((period, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 items-center">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {period}
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {game.home_team}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={homeScores[index]}
                    onChange={(e) => handleScoreChange('home', index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {game.away_team}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={awayScores[index]}
                    onChange={(e) => handleScoreChange('away', index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex space-x-4">
            <button
              onClick={handleSaveScores}
              disabled={saving || !game.numbers_assigned}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {saving ? 'Saving...' : 'Save Scores'}
            </button>
            <button
              onClick={() => router.push(`/admin/games/${id}`)}
              className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md"
            >
              Back to Game
            </button>
          </div>
        </div>

        {/* Winners Preview */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Winners Preview</h2>
          
          {game.numbers_assigned ? (
            <div className="space-y-4">
              {currentWinners.length > 0 ? (
                currentWinners.map((winner, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {winner.period}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Score: {game.home_team} {winner.homeScore} - {game.away_team} {winner.awayScore}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Winning digits: {winner.homeDigit} - {winner.awayDigit}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          Grid: ({winner.gridPosition.row}, {winner.gridPosition.col})
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Enter scores to see winners
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Numbers must be assigned first
            </p>
          )}
        </div>
      </div>

      {/* Current Numbers Display */}
      {game.numbers_assigned && (
        <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Grid Numbers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {game.home_team} (Rows)
              </h3>
              <div className="flex flex-wrap gap-2">
                {game.home_numbers?.map((num, index) => (
                  <div key={index} className="w-8 h-8 bg-blue-100 dark:bg-blue-900 flex items-center justify-center rounded text-sm font-medium">
                    {num}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {game.away_team} (Columns)
              </h3>
              <div className="flex flex-wrap gap-2">
                {game.away_numbers?.map((num, index) => (
                  <div key={index} className="w-8 h-8 bg-orange-100 dark:bg-orange-900 flex items-center justify-center rounded text-sm font-medium">
                    {num}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}