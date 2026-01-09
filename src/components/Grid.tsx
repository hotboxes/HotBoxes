'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from '@/types';
import { supabase } from '@/lib/supabase';

interface GridProps {
  gameId: string;
  initialBoxes?: Box[];
  userId?: string | null;
  homeScores?: number[];
  awayScores?: number[];
  readOnly?: boolean;
  homeNumbers?: number[];
  awayNumbers?: number[];
  numbersAssigned?: boolean;
  entryFee?: number;
  homeTeam?: string;
  awayTeam?: string;
}

export default function Grid({
  gameId,
  initialBoxes = [],
  userId,
  homeScores = [],
  awayScores = [],
  readOnly = false,
  homeNumbers = [],
  awayNumbers = [],
  numbersAssigned = false,
  entryFee = 0,
  homeTeam = "Home Team",
  awayTeam = "Away Team"
}: GridProps) {
  const [boxes, setBoxes] = useState<Box[]>(initialBoxes);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Load boxes from database
  useEffect(() => {
    if (!gameId) return;

    const loadBoxes = async () => {
      const { data, error } = await supabase
        .from('boxes')
        .select('*')
        .eq('game_id', gameId);

      if (!error && data) {
        setBoxes(data.map(box => ({
          id: box.id,
          row: box.row,
          column: box.col,
          userId: box.user_id,
          gameId: box.game_id
        })));
      }
    };

    loadBoxes();
  }, [gameId]);

  // Set up real-time subscription for box updates
  useEffect(() => {
    if (!gameId) return;

    const subscription = supabase
      .channel(`public:boxes:gameId=eq.${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'boxes', filter: `gameId=eq.${gameId}` },
        (payload) => {
          const updatedBox = payload.new as Box;
          setBoxes((currentBoxes) =>
            currentBoxes.map((box) =>
              box.id === updatedBox.id ? updatedBox : box
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [gameId]);

  const handleBoxClick = async (box: Box) => {
    if (readOnly || !userId || box.userId || isSelecting) return;

    // For free games, check if user already has 2 boxes
    if (entryFee === 0) {
      const userBoxCount = boxes.filter(b => b.userId === userId).length;
      if (userBoxCount >= 2) {
        alert('You can only claim 2 boxes per free game. You have already reached the limit.');
        return;
      }
    }

    const confirmMessage = entryFee === 0
      ? `Claim this box for free?`
      : `Purchase this box for ${entryFee} HC?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setSelectedBox(box);
    setIsSelecting(true);

    try {
      // Check user's HotCoin balance (only for paid games)
      if (entryFee > 0) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('hotcoin_balance')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        if ((profile.hotcoin_balance || 0) < entryFee) {
          alert(`Insufficient HotCoins. You need ${entryFee} HC but only have ${profile.hotcoin_balance || 0} HC.`);
          return;
        }
      }

      // Deduct HotCoins (only for paid games)
      if (entryFee > 0) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('hotcoin_balance')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            hotcoin_balance: (profile.hotcoin_balance || 0) - entryFee
          })
          .eq('id', userId);

        if (updateError) throw updateError;
      }

      // Update the box in the database
      const { error: boxError } = await supabase
        .from('boxes')
        .update({ user_id: userId })
        .match({ id: box.id, game_id: gameId });

      if (boxError) throw boxError;

      // Record the transaction (only for paid games)
      if (entryFee > 0) {
        const { error: transactionError } = await supabase
          .from('hotcoin_transactions')
          .insert([{
            user_id: userId,
            type: 'bet',
            amount: -entryFee,
            description: `Purchased box for game: ${gameId}`,
            game_id: gameId,
          }]);

        if (transactionError) throw transactionError;
      }

      // Update local state
      setBoxes((currentBoxes) =>
        currentBoxes.map((b) =>
          b.id === box.id ? { ...b, userId } : b
        )
      );

      const successMessage = entryFee === 0
        ? `Box claimed successfully!`
        : `Box purchased successfully for ${entryFee} HC!`;
      alert(successMessage);
    } catch (error) {
      console.error('Error purchasing box:', error);
      alert('Failed to purchase box. Please try again.');
    } finally {
      setIsSelecting(false);
    }
  };

  const getBoxColor = (box: Box, isWinner: boolean) => {
    if (isWinner) {
      return 'bg-gradient-to-br from-[#FFD700] to-[#FFA500] glow-gold border-[#FFD700]';
    }
    if (!box.userId) {
      return 'bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/50 border-[#FF4500]/20 hover:border-[#FF4500]/60 hover:glow-orange';
    }
    if (box.userId === userId) {
      return 'bg-gradient-to-br from-[#FF4500]/30 to-[#FF6B35]/30 border-[#FF4500] glow-orange';
    }
    return 'bg-gradient-to-br from-white/5 to-white/10 border-white/20';
  };

  // Calculate user's box count for this game
  const userBoxCount = boxes.filter(b => b.userId === userId).length;
  const remainingBoxes = entryFee === 0 ? Math.max(0, 2 - userBoxCount) : null;

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      {/* Free Game Box Limit Indicator */}
      {entryFee === 0 && userId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-[#39FF14]/20 to-[#00FF41]/20 backdrop-blur-sm border-l-4 border-[#39FF14] p-4 rounded-r-lg"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-[#39FF14]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-white font-semibold">
                <span className="text-[#39FF14] uppercase tracking-wide">Free Game:</span> You can claim up to 2 boxes.
                {userBoxCount > 0 && (
                  <span className="block mt-1">
                    You have claimed <span className="text-[#39FF14] font-bold">{userBoxCount}</span> box{userBoxCount === 1 ? '' : 'es'}
                    {remainingBoxes > 0 ? ` - ${remainingBoxes} more available!` : ' - limit reached!'}
                  </span>
                )}
                {userBoxCount === 0 && (
                  <span className="block mt-1 text-[#39FF14]">Claim 2 free boxes now!</span>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Numbers Assignment Status */}
      {!numbersAssigned ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gradient-to-r from-[#FFA500]/20 to-[#FFD700]/20 backdrop-blur-sm border-l-4 border-[#FFA500] p-4 rounded-r-lg"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-[#FFD700]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-white">
                <span className="font-bold text-[#FFD700]">Numbers Not Assigned Yet!</span>
                <span className="block mt-1">Random numbers will be assigned 10 minutes before kickoff. The question marks (?) will be replaced with the actual numbers.</span>
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 bg-gradient-to-r from-[#39FF14]/20 to-[#00FF41]/20 backdrop-blur-sm border-l-4 border-[#39FF14] p-4 rounded-r-lg glow-green"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-[#39FF14]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-white">
                <span className="font-bold text-[#39FF14] uppercase">Numbers Assigned!</span>
                <span className="block mt-1">The grid is locked and ready. May the odds be in your favor!</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Team Labels with Stadium Style */}
      <div className="mb-6 flex items-center justify-center gap-8">
        <motion.div
          className="flex items-center space-x-3 bg-gradient-to-r from-[#FF4500]/20 to-[#FF6B35]/20 backdrop-blur-sm px-6 py-3 rounded-lg border border-[#FF4500]/30"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-3 h-3 bg-[#FF4500] rounded-full animate-pulse-glow"></div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            {homeTeam} <span className="text-[#FF4500]">→</span>
          </span>
        </motion.div>
        <div className="text-white/50 font-bold text-xl">VS</div>
        <motion.div
          className="flex items-center space-x-3 bg-gradient-to-r from-[#39FF14]/20 to-[#00FF41]/20 backdrop-blur-sm px-6 py-3 rounded-lg border border-[#39FF14]/30"
          whileHover={{ scale: 1.05 }}
        >
          <div className="w-3 h-3 bg-[#39FF14] rounded-full animate-pulse-glow"></div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">
            {awayTeam} <span className="text-[#39FF14]">↓</span>
          </span>
        </motion.div>
      </div>

      {/* PLACEHOLDER: Stadium-style background texture can be added here */}
      <div className="relative bg-gradient-to-br from-[#0A1128] to-[#1E3A8A] p-6 rounded-2xl shadow-2xl border border-[#FF4500]/20 grid-pattern">
        {/* Glow effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#FF4500]/5 via-transparent to-[#39FF14]/5 rounded-2xl pointer-events-none"></div>

        <div className="relative grid grid-cols-11 gap-2">
          {/* Empty top-left corner */}
          <div className="h-14 flex items-center justify-center font-bold bg-gradient-to-br from-[#1E3A8A]/50 to-[#0A1128]/80 text-[#FF4500] rounded-lg border border-white/10 backdrop-blur-sm">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
          </div>

          {/* Column headers (home team - horizontal) */}
          {Array.from({ length: 10 }, (_, i) => (
            <motion.div
              key={`col-${i}`}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-14 flex items-center justify-center font-bold bg-gradient-to-br from-[#FF4500] to-[#FF6B35] text-white rounded-lg border-2 border-[#FF4500]/50 backdrop-blur-sm text-xl glow-orange"
            >
              {numbersAssigned && homeNumbers.length > 0 ? homeNumbers[i] : '?'}
            </motion.div>
          ))}

          {/* Row headers (away team - vertical) and boxes */}
          {Array.from({ length: 10 }, (_, row) => (
            <React.Fragment key={`row-${row}`}>
              {/* Row header */}
              <motion.div
                key={`row-header-${row}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: row * 0.05 }}
                className="h-14 flex items-center justify-center font-bold bg-gradient-to-br from-[#39FF14] to-[#00FF41] text-[#0A1128] rounded-lg border-2 border-[#39FF14]/50 backdrop-blur-sm text-xl glow-green"
              >
                {numbersAssigned && awayNumbers.length > 0 ? awayNumbers[row] : '?'}
              </motion.div>

              {/* Boxes for this row */}
              {Array.from({ length: 10 }, (_, col) => {
                const box = boxes.find(b => b.row === row && b.column === col);
                if (!box) {
                  return (
                    <div
                      key={`empty-${row}-${col}`}
                      className="h-14 border rounded-lg bg-gradient-to-br from-white/5 to-white/10 border-white/10 flex items-center justify-center backdrop-blur-sm"
                    >
                      <span className="text-xs text-white/30 font-semibold">EMPTY</span>
                    </div>
                  );
                }

                // Calculate if this box is a winner
                let isWinner = false;

                if (numbersAssigned && homeNumbers.length > 0 && awayNumbers.length > 0) {
                  const homeNumber = homeNumbers[col];
                  const awayNumber = awayNumbers[row];

                  for (let i = 0; i < homeScores.length && i < awayScores.length; i++) {
                    const homeScore = homeScores[i];
                    const awayScore = awayScores[i];

                    if (homeScore === 0 && awayScore === 0) continue;

                    const homeDigit = homeScore % 10;
                    const awayDigit = awayScore % 10;

                    if (homeDigit === homeNumber && awayDigit === awayNumber) {
                      isWinner = true;
                      break;
                    }
                  }
                }

                return (
                  <motion.div
                    key={`box-${row}-${col}`}
                    className={`
                      h-14 border-2 rounded-lg cursor-pointer transition-all backdrop-blur-sm relative overflow-hidden
                      ${getBoxColor(box, isWinner)}
                      ${!box.userId && !readOnly ? 'hover:scale-105' : ''}
                      ${isWinner ? 'animate-pulse-glow scale-110 z-10' : ''}
                    `}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: isWinner ? 1.1 : 1 }}
                    transition={{ delay: (row * 10 + col) * 0.01 }}
                    whileHover={!box.userId && !readOnly ? { scale: 1.1, rotate: 2 } : {}}
                    whileTap={!box.userId && !readOnly ? { scale: 0.95 } : {}}
                    onClick={() => handleBoxClick(box)}
                  >
                    {/* Shimmer effect for available boxes */}
                    {!box.userId && !readOnly && (
                      <div className="absolute inset-0 animate-shimmer opacity-50"></div>
                    )}

                    <div className="w-full h-full flex items-center justify-center relative z-10">
                      {isWinner && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1, rotate: 360 }}
                          transition={{ duration: 0.5 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <svg className="w-8 h-8 text-[#0A1128]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </motion.div>
                      )}
                      {box.userId && !isWinner && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`w-4 h-4 rounded-full ${
                            box.userId === userId
                              ? 'bg-white shadow-lg'
                              : 'bg-white/50'
                          }`}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/50 border-2 border-[#FF4500]/20 rounded"></div>
          <span className="text-gray-400">Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-br from-[#FF4500]/30 to-[#FF6B35]/30 border-2 border-[#FF4500] rounded glow-orange"></div>
          <span className="text-white font-semibold">Your Boxes</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-br from-white/5 to-white/10 border-2 border-white/20 rounded"></div>
          <span className="text-gray-400">Claimed</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-br from-[#FFD700] to-[#FFA500] border-2 border-[#FFD700] rounded glow-gold"></div>
          <span className="text-[#FFD700] font-bold">WINNER!</span>
        </div>
      </div>
    </div>
  );
}
