'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CronTestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
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

  const runCronJob = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/cron/assign-numbers');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Cron job failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cron Job Test</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Test the automated number assignment system
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <button
              onClick={runCronJob}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Running Cron Job...' : 'Run Number Assignment Cron Job'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 p-4">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Cron Job Result
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p><strong>Message:</strong> {result.message}</p>
                  <p><strong>Games Processed:</strong> {result.gamesProcessed}</p>
                  <p><strong>Total Games Checked:</strong> {result.totalGamesChecked}</p>
                  
                  {result.results && result.results.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium">Detailed Results:</h4>
                      <div className="mt-2 space-y-2">
                        {result.results.map((gameResult: any, index: number) => (
                          <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded border">
                            <p><strong>Game:</strong> {gameResult.gameName}</p>
                            <p><strong>Status:</strong> {gameResult.status}</p>
                            {gameResult.status === 'success' && (
                              <>
                                <p><strong>Home Numbers:</strong> [{gameResult.homeNumbers?.join(', ')}]</p>
                                <p><strong>Away Numbers:</strong> [{gameResult.awayNumbers?.join(', ')}]</p>
                              </>
                            )}
                            {gameResult.status === 'too_early' && (
                              <p><strong>Time until assignment:</strong> {gameResult.timeUntilAssignment} minutes</p>
                            )}
                            {gameResult.error && (
                              <p className="text-red-600 dark:text-red-400"><strong>Error:</strong> {gameResult.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">How It Works</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Checks all active games that don't have numbers assigned</li>
              <li>• If a game starts in 10 minutes or less, assigns random numbers</li>
              <li>• Updates the game with homeNumbers and awayNumbers</li>
              <li>• Sets numbersAssigned to true</li>
              <li>• In production, this would run every minute via a cron job</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => router.push('/admin')}
              className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-medium py-2 px-4 rounded-md"
            >
              Back to Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}