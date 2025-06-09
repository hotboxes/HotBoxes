'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FixBoxesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGames();
  }, []);

  const loadGames = async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setGames(data);
    setLoading(false);
  };

  const createBoxesForGame = async (gameId: string) => {
    try {
      // Check if boxes already exist
      const { data: existingBoxes } = await supabase
        .from('boxes')
        .select('id')
        .eq('game_id', gameId);

      if (existingBoxes && existingBoxes.length > 0) {
        alert('Boxes already exist for this game');
        return;
      }

      // Create 100 boxes (10x10 grid)
      const boxes = [];
      for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 10; col++) {
          boxes.push({
            id: `${gameId}_${row}_${col}`,
            row,
            col,
            game_id: gameId,
            user_id: null
          });
        }
      }

      const { error } = await supabase
        .from('boxes')
        .insert(boxes);

      if (error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('Boxes created successfully!');
        loadGames();
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Fix Game Boxes</h1>
      
      <div className="space-y-4">
        {games.map((game) => (
          <div key={game.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{game.name}</h3>
                <p className="text-sm text-gray-600">
                  {game.home_team} vs {game.away_team}
                </p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(game.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => createBoxesForGame(game.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              >
                Create Boxes
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}