'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      // Get current user
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        setError(`User error: ${userError.message}`);
        return;
      }
      
      setUser(authUser);

      if (authUser) {
        // Get profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileError) {
          setError(`Profile error: ${profileError.message}`);
          return;
        }

        setProfile(profileData);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const testRLSPolicy = async () => {
    try {
      setError(null);
      
      // Test the RLS policy directly
      const { data: policyTest, error: policyError } = await supabase
        .rpc('check_admin_status');

      if (policyError) {
        setError(`Policy test error: ${policyError.message}`);
      } else {
        setError(`Policy test result: ${JSON.stringify(policyTest)}`);
      }
    } catch (err: any) {
      setError(`Policy catch error: ${err.message}`);
    }
  };

  const testGameCreation = async () => {
    try {
      setError(null);
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setError('No authenticated user');
        return;
      }

      // First check if we can query profiles
      const { data: profileCheck, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id, is_admin')
        .eq('id', authUser.id)
        .single();

      if (profileCheckError) {
        setError(`Profile check error: ${profileCheckError.message}`);
        return;
      }

      setError(`Profile check passed. Admin status: ${profileCheck.is_admin}. Now trying game creation...`);

      // Try to create a test game without created_by field first
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert([
          {
            name: 'Debug Test Game',
            home_team: 'Team A',
            away_team: 'Team B',
            sport: 'NBA',
            game_date: new Date().toISOString(),
            entry_fee: 1,
            home_scores: [],
            away_scores: [],
            is_active: true,
            numbers_assigned: false,
            home_numbers: [],
            away_numbers: [],
          },
        ])
        .select()
        .single();

      if (gameError) {
        setError(`Game creation error: ${gameError.message}`);
      } else {
        setError(`Success! Game created with ID: ${game.id}`);
      }
    } catch (err: any) {
      setError(`Catch error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">Debug User Status</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">User Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Test Game Creation</h2>
          <div className="space-x-4">
            <button
              onClick={testGameCreation}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Create Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}