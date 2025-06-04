'use client';

  import { useState } from 'react';
  import { useRouter } from 'next/navigation';
  import { supabase } from '@/lib/supabase';

  export default function CreateGamePage() {
    const [name, setName] = useState('');
    const [homeTeam, setHomeTeam] = useState('');
    const [awayTeam, setAwayTeam] = useState('');
    const [sport, setSport] = useState<'NFL' | 'NBA'>('NFL');
    const [gameDate, setGameDate] = useState('');
    const [entryFee, setEntryFee] = useState(5);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        const { data: game } = await supabase
          .from('games')
          .insert([{
            name,
            home_team: homeTeam,
            away_team: awayTeam,
            sport,
            game_date: gameDate,
            entry_fee: entryFee,
            home_scores: [],
            away_scores: [],
            is_active: true,
            numbers_assigned: false,
            home_numbers: [],
            away_numbers: [],
          }])
          .select()
          .single();

        if (game) {
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
          await supabase.from('boxes').insert(boxes);
          router.push(`/admin/games/${game.id}`);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Create New Game</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label>Sport</label>
            <select value={sport} onChange={(e) => setSport(e.target.value as 'NFL' |
  'NBA')}>
              <option value="NFL">NFL</option>
              <option value="NBA">NBA</option>
            </select>
          </div>
          <div>
            <label>Game Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label>Home Team</label>
            <input value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}
  required />
          </div>
          <div>
            <label>Away Team</label>
            <input value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}
  required />
          </div>
          <div>
            <label>Game Date</label>
            <input type="datetime-local" value={gameDate} onChange={(e) =>
  setGameDate(e.target.value)} required />
          </div>
          <div>
            <label>Entry Fee</label>
            <select value={entryFee} onChange={(e) =>
  setEntryFee(Number(e.target.value))}>
              <option value={1}>1 HC</option>
              <option value={5}>5 HC</option>
              <option value={10}>10 HC</option>
            </select>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Game'}
          </button>
        </form>
      </div>
    );
  }
