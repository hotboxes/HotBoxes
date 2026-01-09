'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section - STADIUM BACKGROUND */}
        <div className="relative overflow-hidden">
          {/* Stadium Background Image */}
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: 'url(/hero-bg.png)',
              }}
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0A1128]/70 via-[#0A1128]/60 to-[#0A1128]/90"></div>
            {/* Animated Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF4500]/20 via-transparent to-[#39FF14]/20 animate-shimmer opacity-30"></div>

            {/* Floating Elements */}
            {mounted && (
              <>
                <motion.div
                  className="absolute top-20 left-10 w-32 h-32 rounded-full bg-[#FF4500]/30 blur-3xl"
                  animate={{
                    y: [0, -30, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                <motion.div
                  className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-[#39FF14]/30 blur-3xl"
                  animate={{
                    y: [0, 30, 0],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </>
            )}
          </div>

          {/* Hero Content */}
          <div className="relative z-10 py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-extrabold text-white text-display mb-6">
                CLAIM YOUR
                <span className="block text-[#FF4500] text-glow-orange mt-2">
                  SQUARE
                </span>
              </h1>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#39FF14] text-glow-green mb-4">
                WIN BIG. GET HOT.
              </p>
              <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Real money. Real games. Real-time action on NFL & NBA matchups.
                <span className="text-[#FFD700] font-semibold"> Join the heat.</span>
              </p>

              {/* CTA Buttons */}
              <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/games"
                  className="group relative px-8 py-4 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-xl font-bold rounded-lg overflow-hidden transition-all transform hover:scale-105 glow-orange"
                >
                  <span className="relative z-10">BROWSE GAMES</span>
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                </Link>

                <Link
                  href="/signup"
                  className="px-8 py-4 bg-transparent border-2 border-[#39FF14] text-[#39FF14] text-xl font-bold rounded-lg transition-all transform hover:scale-105 hover:bg-[#39FF14]/10 glow-green"
                >
                  CREATE ACCOUNT
                </Link>
              </div>

              {/* Live Stats Ticker (Placeholder) */}
              <motion.div
                className="mt-16 flex flex-wrap justify-center gap-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <div className="px-6 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-[#FF4500]/30">
                  <div className="text-3xl font-bold text-[#FFD700] text-glow-gold">$12,450</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">Paid This Week</div>
                </div>
                <div className="px-6 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-[#39FF14]/30">
                  <div className="text-3xl font-bold text-[#39FF14] text-glow-green">1,247</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">Active Players</div>
                </div>
                <div className="px-6 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-[#FF6B35]/30">
                  <div className="text-3xl font-bold text-[#FF4500] text-glow-orange">18</div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">Live Games</div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Bottom Fade */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050818] to-transparent"></div>
        </div>

        {/* How It Works Section */}
        <div className="relative bg-[#050818] py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-5xl font-bold text-white text-display mb-4">
                HOW IT <span className="text-[#FF4500]">WORKS</span>
              </h2>
              <div className="h-1 w-32 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] mx-auto rounded-full"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <motion.div
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="relative bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/80 backdrop-blur-sm rounded-xl p-8 border border-[#FF4500]/20 overflow-hidden transition-all duration-300 group-hover:border-[#FF4500]/60 group-hover:shadow-2xl group-hover:shadow-[#FF4500]/20">
                  <div className="absolute top-0 right-0 text-[120px] font-bold text-[#FF4500]/10 leading-none">1</div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-xl flex items-center justify-center mb-6 glow-orange">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 text-sports">
                      CREATE ACCOUNT
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      Sign up in 30 seconds. Verify your age. Load HotCoins via CashApp. Start playing.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <div className="relative bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/80 backdrop-blur-sm rounded-xl p-8 border border-[#39FF14]/20 overflow-hidden transition-all duration-300 group-hover:border-[#39FF14]/60 group-hover:shadow-2xl group-hover:shadow-[#39FF14]/20">
                  <div className="absolute top-0 right-0 text-[120px] font-bold text-[#39FF14]/10 leading-none">2</div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#39FF14] to-[#00FF41] rounded-xl flex items-center justify-center mb-6 glow-green">
                      <svg className="w-8 h-8 text-[#0A1128]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 text-sports">
                      CLAIM SQUARES
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      Pick your lucky squares on the 10x10 grid. Watch numbers get assigned. Wait for kickoff.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <div className="relative bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/80 backdrop-blur-sm rounded-xl p-8 border border-[#FFD700]/20 overflow-hidden transition-all duration-300 group-hover:border-[#FFD700]/60 group-hover:shadow-2xl group-hover:shadow-[#FFD700]/20">
                  <div className="absolute top-0 right-0 text-[120px] font-bold text-[#FFD700]/10 leading-none">3</div>

                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-xl flex items-center justify-center mb-6 glow-gold">
                      <svg className="w-8 h-8 text-[#0A1128]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 text-sports">
                      WIN CASH
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      Match the score digits each quarter. Win HotCoins. Cash out to your CashApp instantly.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* CTA Banner */}
            <motion.div
              className="mt-20 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-block bg-gradient-to-r from-[#FF4500]/20 to-[#FF6B35]/20 backdrop-blur-sm border border-[#FF4500]/30 rounded-2xl px-12 py-8">
                <p className="text-3xl font-bold text-white mb-4 text-display">
                  READY TO PLAY?
                </p>
                <p className="text-gray-400 mb-6 text-lg">
                  18+ only. Play responsibly. Check your local laws.
                </p>
                <Link
                  href="/signup"
                  className="inline-block px-10 py-4 bg-gradient-to-r from-[#FF4500] to-[#FF6B35] text-white text-xl font-bold rounded-lg transition-all transform hover:scale-105 glow-orange"
                >
                  JOIN NOW
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}