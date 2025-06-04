'use client';

  import { useState, useEffect } from 'react';
  import { useRouter } from 'next/navigation';
  import { supabase } from '@/lib/supabase';

  export default function CreateGamePage() {
    const [name, setName] = useState('');
    const [homeTeam, setHomeTeam] = useState('');
    const [awayTeam, setAwayTeam] = useState('');
    const [sport, setSport] = useState<'NFL' | 'NBA'>('NFL');
    const [gameDate, setGameDate] = useState('');
    const [entryFee, setEntryFee] = useState(0);
    const [payoutQ1, setPayoutQ1] = useState(25);
    const [payoutQ2, setPayoutQ2] = useState(25);
    const [payoutQ3, setPayoutQ3] = useState(25);
    const [payoutFinal, setPayoutFinal] = useState(25);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
      checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
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
      }
    };

    const validatePayouts = () => {
      const total = payoutQ1 + payoutQ2 + payoutQ3 + payoutFinal;
      return total === 100;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      // Validate payout percentages
      if (!validatePayouts()) {
        setError('Payout percentages must add up to exactly 100%');
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError('You must be logged in');
          setLoading(false);
          return;
        }

        const { data: game, error: gameError } = await supabase
          .from('games')
          .insert([
            {
              name,
              home_team: homeTeam,
              away_team: awayTeam,
              sport,
              game_date: gameDate,
              entry_fee: entryFee,
              home_scores: [],
              away_scores: [],
              home_numbers: [],
              away_numbers: [],
              payout_q1: payoutQ1,
              payout_q2: payoutQ2,
              payout_q3: payoutQ3,
              payout_final: payoutFinal,
              is_active: true,
              numbers_assigned: false,
              created_by: user.id,
            },
          ])
          .select()
          .single();

        if (gameError) {
          console.error('Game creation error:', gameError);
          setError(`Database error: ${gameError.message}`);
          setLoading(false);
          return;
        }

        // Create boxes for the game
        const boxes = [];
        for (let row = 0; row < 10; row++) {
          for (let col = 0; col < 10; col++) {
            boxes.push({
              id: `${game.id}-${row}-${col}`,
              row,
              col,
              user_id: null,
              game_id: game.id,
            });
          }
        }

        const { error: boxesError } = await supabase
          .from('boxes')
          .insert(boxes);

        if (boxesError) {
          console.error('Boxes creation error:', boxesError);
          // Don't fail if boxes creation fails
        }

        alert(`Game created: ${game.name}`);
        router.push('/admin');

      } catch (err: any) {
        console.error('Full error:', err);
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New
  Game</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Add a new {sport} game for users to play squares
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 
  p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 
  dark:text-gray-300 mb-2">
                  Sport
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="NFL"
                      checked={sport === 'NFL'}
                      onChange={(e) => setSport(e.target.value as 'NFL')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">🏈
  NFL</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="NBA"
                      checked={sport === 'NBA'}
                      onChange={(e) => setSport(e.target.value as 'NBA')}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">🏀
  NBA</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium 
  text-gray-700 dark:text-gray-300">
                  Game Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Week 1 - Chiefs vs Bills"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300
  dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500
  focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="homeTeam" className="block text-sm font-medium 
  text-gray-700 dark:text-gray-300">
                  Home Team
                </label>
                <input
                  type="text"
                  id="homeTeam"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  placeholder="e.g., Kansas City Chiefs"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300
  dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500
  focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="awayTeam" className="block text-sm font-medium 
  text-gray-700 dark:text-gray-300">
                  Away Team
                </label>
                <input
                  type="text"
                  id="awayTeam"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  placeholder="e.g., Buffalo Bills"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300
  dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500
  focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="gameDate" className="block text-sm font-medium 
  text-gray-700 dark:text-gray-300">
                  Game Date & Time
                </label>
                <input
                  type="datetime-local"
                  id="gameDate"
                  value={gameDate}
                  onChange={(e) => setGameDate(e.target.value)}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300
  dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500
  focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="entryFee" className="block text-sm font-medium 
  text-gray-700 dark:text-gray-300">
                  Entry Fee (HotCoins per box)
                </label>
                <select
                  id="entryFee"
                  value={entryFee}
                  onChange={(e) => setEntryFee(Number(e.target.value))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300
  dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500
  focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value={0}>Free (No HotCoins required)</option>
                  <option value={1}>1 HotCoin</option>
                  <option value={2}>2 HotCoins</option>
                  <option value={5}>5 HotCoins</option>
                  <option value={10}>10 HotCoins</option>
                  <option value={20}>20 HotCoins</option>
                  <option value={50}>50 HotCoins</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {entryFee === 0 ? (
                    "Free game - No entry fee required"
                  ) : (
                    `Total pool: ${entryFee * 100} HotCoins • Payouts: ${Math.floor(entryFee * 100 * 0.9)} HotCoins`
                  )}
                </p>
              </div>
            </div>

            {/* Payout Structure Configuration */}
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Payout Structure (must total 100%)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="payoutQ1" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    1st Quarter %
                  </label>
                  <input
                    type="number"
                    id="payoutQ1"
                    min="0"
                    max="100"
                    value={payoutQ1}
                    onChange={(e) => setPayoutQ1(Number(e.target.value))}
                    className="mt-1 block w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="payoutQ2" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Halftime %
                  </label>
                  <input
                    type="number"
                    id="payoutQ2"
                    min="0"
                    max="100"
                    value={payoutQ2}
                    onChange={(e) => setPayoutQ2(Number(e.target.value))}
                    className="mt-1 block w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="payoutQ3" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    3rd Quarter %
                  </label>
                  <input
                    type="number"
                    id="payoutQ3"
                    min="0"
                    max="100"
                    value={payoutQ3}
                    onChange={(e) => setPayoutQ3(Number(e.target.value))}
                    className="mt-1 block w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="payoutFinal" className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    Final %
                  </label>
                  <input
                    type="number"
                    id="payoutFinal"
                    min="0"
                    max="100"
                    value={payoutFinal}
                    onChange={(e) => setPayoutFinal(Number(e.target.value))}
                    className="mt-1 block w-full px-2 py-1 border border-gray-300 dark:border-gray-700 rounded text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <p className={`mt-2 text-xs ${validatePayouts() ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                Total: {payoutQ1 + payoutQ2 + payoutQ3 + payoutFinal}% {validatePayouts() ? '✓' : '(Must equal 100%)'}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white 
  mb-3">Prize Structure Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">1st Quarter</div>
                  <div className="text-indigo-600 dark:text-indigo-400">
                    {entryFee === 0 ? `${payoutQ1} HC` : `${Math.floor(entryFee * 100 * 0.9 * payoutQ1 / 100)} HC`}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">Halftime</div>
                  <div className="text-indigo-600 dark:text-indigo-400">
                    {entryFee === 0 ? `${payoutQ2} HC` : `${Math.floor(entryFee * 100 * 0.9 * payoutQ2 / 100)} HC`}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">3rd Quarter</div>
                  <div className="text-indigo-600 dark:text-indigo-400">
                    {entryFee === 0 ? `${payoutQ3} HC` : `${Math.floor(entryFee * 100 * 0.9 * payoutQ3 / 100)} HC`}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900 dark:text-white">Final</div>
                  <div className="text-indigo-600 dark:text-indigo-400">
                    {entryFee === 0 ? `${payoutFinal} HC` : `${Math.floor(entryFee * 100 * 0.9 * payoutFinal / 100)} HC`}
                  </div>
                </div>
              </div>
              {entryFee === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  🎉 Free Game - Fixed HotCoin prizes for winners!
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  House fee: {entryFee * 100 * 0.1} HotCoins (10%) • Total payout: {Math.floor(entryFee * 100 * 0.9)} HC
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700
  rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white
  dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm 
  text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none 
  focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Game'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
