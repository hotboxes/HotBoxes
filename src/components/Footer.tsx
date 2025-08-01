import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main footer content */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          {/* Left side - Company info */}
          <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-8">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">HotBoxes</h3>
            </div>
            <div className="flex space-x-6 text-sm">
              <Link href="/games" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                Games
              </Link>
              <Link href="/faq" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                FAQ
              </Link>
              <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                Terms
              </Link>
              <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                Privacy
              </Link>
              <Link href="/help" className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">
                Help
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom section - Legal notice */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0 text-xs text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} HotBoxes. All rights reserved.</p>
            <p className="text-center md:text-right">
              <strong>18+ Only.</strong> Play responsibly. Check local laws.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
