'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminGamePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [game, setGame] = useState<any>(null);
  const [boxes, setBoxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPayouts, setEditingPayouts] = useState(false);
  const [payoutValues, setPayoutValues] = useState({
    payout_q1: 0,
    payout_q2: 0,
    payout_q3: 0,
    payout_final: 0
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAdminGameData();
  }, [id]);

  const loadAdminGameData = async () => {
    try {
      // Check admin access
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
      
      // Set payout values for editing
      setPayoutValues({
        payout_q1: gameData.payout_q1 || 0,
        payout_q2: gameData.payout_q2 || 0,
        payout_q3: gameData.payout_q3 || 0,
        payout_final: gameData.payout_final || 0
      });

      // Fetch game boxes and user info
      const { data: boxesData } = await supabase
        .from('boxes')
        .select(`
          *,
          profiles (username, email)
        `)
        .eq('game_id', id);

      setBoxes(boxesData || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('games')
        .update({
          payout_q1: payoutValues.payout_q1,
          payout_q2: payoutValues.payout_q2,
          payout_q3: payoutValues.payout_q3,
          payout_final: payoutValues.payout_final
        })
        .eq('id', id);

      if (error) throw error;

      // Update local game state
      setGame(prev => ({
        ...prev,
        payout_q1: payoutValues.payout_q1,
        payout_q2: payoutValues.payout_q2,
        payout_q3: payoutValues.payout_q3,
        payout_final: payoutValues.payout_final
      }));

      setEditingPayouts(false);
      alert('Payout amounts updated successfully!');
    } catch (err: any) {
      console.error('Error updating payouts:', err);
      alert('Failed to update payout amounts. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePayoutCancel = () => {
    // Reset to original values
    setPayoutValues({
      payout_q1: game?.payout_q1 || 0,
      payout_q2: game?.payout_q2 || 0,
      payout_q3: game?.payout_q3 || 0,
      payout_final: game?.payout_final || 0
    });
    setEditingPayouts(false);
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

  if (!user || !game) {
    return null;
  }

  // Calculate stats
  const totalBoxes = boxes.length || 0;
  const occupiedBoxes = boxes.filter(box => box.user_id).length || 0;
  const totalRevenue = occupiedBoxes * game.entry_fee;
  const payoutPool = Math.floor(totalRevenue * 0.9);
  const houseCut = totalRevenue - payoutPool;

  // Get unique participants
  const participants = boxes?.filter(box => box.user_id)
    .reduce((acc: any[], box: any) => {
      if (!acc.find(p => p.user_id === box.user_id)) {
        acc.push({
          user_id: box.user_id,
          username: box.profiles?.username || box.profiles?.email || 'Unknown',
          boxCount: boxes.filter(b => b.user_id === box.user_id).length
        });
      }
      return acc;
    }, []) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{game.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{game.home_team} vs {game.away_team}</p>
        </div>
        <div className="flex space-x-4">
          <Link
            href={`/games/${game.id}`}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            View Public Page
          </Link>
          <Link
            href="/admin"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Admin
          </Link>
        </div>
      </div>

      {/* Game Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Boxes Sold
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {occupiedBoxes} / {totalBoxes}
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
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Revenue
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
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🏆</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Prize Pool
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {payoutPool} HC
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
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Participants
                  </dt>
                  <dd className="text-lg font-medium text-gray-900 dark:text-white">
                    {participants.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Game Information
            </h3>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <dl>
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Sport</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {game.sport}
                </dd>
              </div>
              <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Game Date</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {new Date(game.game_date).toLocaleString()}
                </dd>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Entry Fee</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {game.entry_fee} HotCoins per box
                </dd>
              </div>
              <div className="bg-white dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {game.is_active ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                      Closed
                    </span>
                  )}
                </dd>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Numbers Assigned</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white sm:mt-0 sm:col-span-2">
                  {game.numbers_assigned ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Prize Breakdown */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Prize Breakdown
            </h3>
            {!editingPayouts && (
              <button
                onClick={() => setEditingPayouts(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm font-medium"
              >
                Edit Payouts
              </button>
            )}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 p-6">
            {editingPayouts ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      1st Quarter
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={payoutValues.payout_q1}
                      onChange={(e) => setPayoutValues(prev => ({ ...prev, payout_q1: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Halftime (2nd Quarter)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={payoutValues.payout_q2}
                      onChange={(e) => setPayoutValues(prev => ({ ...prev, payout_q2: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      3rd Quarter
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={payoutValues.payout_q3}
                      onChange={(e) => setPayoutValues(prev => ({ ...prev, payout_q3: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Final Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={payoutValues.payout_final}
                      onChange={(e) => setPayoutValues(prev => ({ ...prev, payout_final: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Payout: {payoutValues.payout_q1 + payoutValues.payout_q2 + payoutValues.payout_q3 + payoutValues.payout_final} HC
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={handlePayoutCancel}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePayoutSave}
                      disabled={saving}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-md text-sm font-medium"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">1st Quarter</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {game?.payout_q1 || 0} HC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Halftime (2nd Quarter)</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {game?.payout_q2 || 0} HC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">3rd Quarter</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {game?.payout_q3 || 0} HC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Final Score</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {game?.payout_final || 0} HC
                  </span>
                </div>
                <hr className="border-gray-200 dark:border-gray-700" />
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Prize Pool</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {(game?.payout_q1 || 0) + (game?.payout_q2 || 0) + (game?.payout_q3 || 0) + (game?.payout_final || 0)} HC
                  </span>
                </div>
                {game?.entry_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Revenue vs Payouts</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {totalRevenue} HC collected → {(game?.payout_q1 || 0) + (game?.payout_q2 || 0) + (game?.payout_q3 || 0) + (game?.payout_final || 0)} HC prizes
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Participants */}
      {participants.length > 0 && (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md mb-8">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              Participants ({participants.length})
            </h3>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {participants.map((participant) => (
                <li key={participant.user_id} className="px-4 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {participant.username}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {participant.boxCount} {participant.boxCount === 1 ? 'box' : 'boxes'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Admin Actions */}
      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            Admin Actions
          </h3>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href={`/admin/games/${game.id}/assign-numbers`}
              className="bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 p-4 rounded-lg text-center transition-colors block"
            >
              <div className="text-2xl mb-2">🎲</div>
              <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {game.numbers_assigned ? 'View Numbers' : 'Assign Numbers'}
              </div>
            </Link>
            <Link
              href={`/admin/games/${game.id}/scores`}
              className="bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 p-4 rounded-lg text-center transition-colors block"
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                Update Scores
              </div>
            </Link>
            <Link
              href={`/admin/games/${game.id}/payouts`}
              className="bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 p-4 rounded-lg text-center transition-colors block"
            >
              <div className="text-2xl mb-2">💸</div>
              <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Process Payouts
              </div>
            </Link>
            <button className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 p-4 rounded-lg text-center transition-colors">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-sm font-medium text-red-700 dark:text-red-300">
                Close Game
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}