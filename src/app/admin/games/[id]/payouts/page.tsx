'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Game } from '@/types';

interface PayoutsPageProps {
  params: {
    id: string;
  };
}

export default function PayoutsPage({ params }: PayoutsPageProps) {
  const { id } = params;
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payoutResult, setPayoutResult] = useState<any>(null);
  const [boxes, setBoxes] = useState<any[]>([]);
  const router = useRouter();

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

      // Load boxes with user info
      const { data: boxData, error: boxError } = await supabase
        .from('boxes')
        .select(`
          *,
          profiles (username, email)
        `)
        .eq('game_id', id)
        .not('user_id', 'is', null);

      if (boxError) {
        console.error('Error loading boxes:', boxError);
      } else {
        setBoxes(boxData || []);
      }
    } catch (err) {
      setError('Failed to load game');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayouts = async () => {
    if (!game) return;

    setProcessing(true);
    setError(null);
    setPayoutResult(null);

    try {
      const response = await fetch(`/api/games/${id}/process-payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payouts');
      }

      setPayoutResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const calculateGameStats = () => {
    if (!game || !boxes) return null;

    const totalBoxesSold = boxes.length;
    const totalRevenue = totalBoxesSold * (game.entry_fee || 0);
    const prizePool = Math.floor(totalRevenue * 0.9);
    const houseCut = totalRevenue - prizePool;
    const prizePerPeriod = Math.floor(prizePool / 4);

    return {
      totalBoxesSold,
      totalRevenue,
      prizePool,
      houseCut,
      prizePerPeriod
    };
  };

  const calculateWinners = () => {
    if (!game?.home_scores || !game?.away_scores || !game?.home_numbers || !game?.away_numbers) {
      return [];
    }

    const winners = [];
    const periodLabels = ['1st Quarter', 'Halftime', '3rd Quarter', 'Final'];

    for (let period = 0; period < game.home_scores.length; period++) {
      const homeScore = game.home_scores[period];
      const awayScore = game.away_scores[period];
      
      const homeDigit = homeScore % 10;
      const awayDigit = awayScore % 10;
      
      const homeRow = game.home_numbers.indexOf(homeDigit);
      const awayCol = game.away_numbers.indexOf(awayDigit);
      
      if (homeRow !== -1 && awayCol !== -1) {
        const winningBox = boxes?.find(box => 
          box.row === homeRow && box.col === awayCol
        );
        
        winners.push({
          period: periodLabels[period] || `Period ${period + 1}`,
          homeScore,
          awayScore,
          homeDigit,
          awayDigit,
          gridPosition: { row: homeRow, col: awayCol },
          winningBox,
          winner: winningBox?.profiles
        });
      }
    }

    return winners;
  };

  const gameStats = calculateGameStats();
  const winners = calculateWinners();

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Process Payouts</h1>
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

      {payoutResult && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 p-4">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Payouts Processed Successfully!
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {payoutResult.message}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Game Stats */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Game Statistics</h2>
          
          {gameStats && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Boxes Sold</span>
                <span className="font-medium text-gray-900 dark:text-white">{gameStats.totalBoxesSold} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Revenue</span>
                <span className="font-medium text-gray-900 dark:text-white">{gameStats.totalRevenue} HC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Prize Pool (90%)</span>
                <span className="font-medium text-green-600 dark:text-green-400">{gameStats.prizePool} HC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">House Cut (10%)</span>
                <span className="font-medium text-gray-900 dark:text-white">{gameStats.houseCut} HC</span>
              </div>
              <div className="flex justify-between border-t pt-4">
                <span className="text-gray-600 dark:text-gray-400">Prize per Period</span>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">{gameStats.prizePerPeriod} HC</span>
              </div>
            </div>
          )}

          <div className="mt-6">
            <button
              onClick={handleProcessPayouts}
              disabled={processing || !game.numbers_assigned || !game.home_scores || game.home_scores.length === 0}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {processing ? 'Processing Payouts...' : 'Process Payouts'}
            </button>
            {(!game.numbers_assigned || !game.home_scores || game.home_scores.length === 0) && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Numbers must be assigned and scores entered first
              </p>
            )}
          </div>
        </div>

        {/* Winners */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Winners</h2>
          
          {winners.length > 0 ? (
            <div className="space-y-4">
              {winners.map((winner, index) => (
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
                      {winner.winner && (
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                          Winner: {winner.winner.username || winner.winner.email}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {gameStats?.prizePerPeriod} HC
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Grid: ({winner.gridPosition.row}, {winner.gridPosition.col})
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {!game.home_scores || game.home_scores.length === 0 
                ? "Enter scores to see winners" 
                : "No winners yet"}
            </p>
          )}
        </div>
      </div>

      {/* Payout Results */}
      {payoutResult && payoutResult.payouts && (
        <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Payout Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Winner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Digits</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {payoutResult.payouts.map((payout: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {payout.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {payout.winner?.username || payout.winner?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payout.homeScore} - {payout.awayScore}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {payout.homeDigit} - {payout.awayDigit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                      {payout.amount} HC
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          onClick={() => router.push(`/admin/games/${id}`)}
          className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md"
        >
          Back to Game
        </button>
      </div>
    </div>
  );
}