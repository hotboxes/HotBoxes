import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-[#0A1128] via-[#1E3A8A] to-[#0A1128] border-t border-[#FF4500]/20">
      {/* Background Pattern */}
      <div className="absolute inset-0 grid-pattern opacity-5"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main footer content */}
        <div className="flex flex-col lg:flex-row justify-between items-start space-y-8 lg:space-y-0 mb-8">
          {/* Left side - Branding */}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FF4500] to-[#FF6B35] rounded-lg flex items-center justify-center glow-orange">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <h3 className="text-3xl font-extrabold text-white text-display">
                HOT<span className="text-[#FF4500]">BOXES</span>
              </h3>
            </div>
            <p className="text-gray-400 max-w-md mb-4">
              Real money. Real games. Real-time action on NFL & NBA matchups. Join the heat and claim your square!
            </p>
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 bg-[#FF4500]/20 border border-[#FF4500]/50 rounded-lg">
                <span className="text-[#FF4500] font-bold text-sm uppercase tracking-wider">18+ Only</span>
              </div>
              <div className="px-3 py-1 bg-[#39FF14]/20 border border-[#39FF14]/50 rounded-lg">
                <span className="text-[#39FF14] font-bold text-sm uppercase tracking-wider">Play Responsibly</span>
              </div>
            </div>
          </div>

          {/* Center - Quick Links */}
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Links</h4>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/games" className="text-gray-300 hover:text-[#FF4500] transition-colors font-semibold">
                🎮 Games
              </Link>
              <Link href="/dashboard" className="text-gray-300 hover:text-[#FF4500] transition-colors font-semibold">
                📊 Dashboard
              </Link>
              <Link href="/hotcoins" className="text-gray-300 hover:text-[#FF4500] transition-colors font-semibold">
                💰 HotCoins
              </Link>
              <Link href="/settings" className="text-gray-300 hover:text-[#FF4500] transition-colors font-semibold">
                ⚙️ Settings
              </Link>
            </div>
          </div>

          {/* Right side - Legal & Support */}
          <div className="flex-1">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Legal & Support</h4>
            <div className="space-y-3">
              <Link href="/faq" className="block text-gray-300 hover:text-[#39FF14] transition-colors font-semibold">
                ❓ FAQ
              </Link>
              <Link href="/terms" className="block text-gray-300 hover:text-[#FFD700] transition-colors font-semibold">
                📋 Terms of Service
              </Link>
              <Link href="/privacy" className="block text-gray-300 hover:text-[#FFD700] transition-colors font-semibold">
                🔒 Privacy Policy
              </Link>
              <Link href="/help" className="block text-gray-300 hover:text-[#39FF14] transition-colors font-semibold">
                💬 Help & Support
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom section - Copyright & Legal notice */}
        <div className="pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              <p className="font-semibold">© {new Date().getFullYear()} HotBoxes. All rights reserved.</p>
            </div>
            <div className="text-sm text-gray-400 text-center md:text-right">
              <p className="font-bold text-[#FFD700]">
                ⚠️ 18+ Only. Play responsibly. Check your local laws.
              </p>
              <p className="text-xs mt-1">
                If you or someone you know has a gambling problem, call 1-800-GAMBLER
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
