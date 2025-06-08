import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              HotBoxes
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Super Bowl Squares reimagined for NFL and NBA games. Win real cash prizes with our modern take on the classic game.
            </p>
            <div className="flex space-x-4">
              <a
                href="mailto:playhotboxeslive@gmail.com"
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                <span className="sr-only">Email</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/games"
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
                >
                  Browse Games
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/hotcoins"
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
                >
                  Buy HotCoins
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
                >
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/faq"
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <a
                  href="mailto:playhotboxeslive@gmail.com"
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* How It Works */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              How It Works
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>1. Buy HotCoins with real money</li>
              <li>2. Purchase squares on game grids</li>
              <li>3. Win based on game scores</li>
              <li>4. Withdraw winnings as cash</li>
            </ul>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              1 HotCoin = $1 USD
            </p>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} HotBoxes. All rights reserved.
              </p>
              <Link
                href="/terms"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                Terms
              </Link>
              <Link
                href="/faq"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                FAQ
              </Link>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span>Contact:</span>
              <a
                href="mailto:playhotboxeslive@gmail.com"
                className="hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                playhotboxeslive@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            <strong>18+ Only.</strong> Please play responsibly. HotBoxes operates as a skill-based gaming platform. 
            Check your local laws regarding online gaming. For support or responsible gaming resources, contact{' '}
            <a href="mailto:playhotboxeslive@gmail.com" className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
              playhotboxeslive@gmail.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}