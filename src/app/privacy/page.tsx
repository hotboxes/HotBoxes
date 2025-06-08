import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/"
          className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Home
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Content */}
      <div className="prose dark:prose-invert max-w-none">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 mb-3">🔒 Your Privacy Matters</h2>
          <p className="text-blue-700 dark:text-blue-300">
            HotBoxes is committed to protecting your privacy and ensuring the security of your personal information. 
            This Privacy Policy explains how we collect, use, and protect your data when you use our real-money gaming platform.
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Information We Collect</h2>
          
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Personal Information</h3>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>Email address (required for account registration)</li>
            <li>Username (optional, chosen by you)</li>
            <li>Birth date (required for age verification)</li>
            <li>CashApp username (required for withdrawals)</li>
            <li>Password (encrypted and never stored in plain text)</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Financial Information</h3>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>Transaction amounts and dates</li>
            <li>Payment method details (CashApp transaction IDs)</li>
            <li>Account balance and transaction history</li>
            <li>Withdrawal requests and payment verifications</li>
          </ul>

          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Usage Information</h3>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>Game participation and betting history</li>
            <li>Login times and activity patterns</li>
            <li>Device information and IP addresses</li>
            <li>Website navigation and usage analytics</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. How We Use Your Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">✅ Service Operations</h3>
              <ul className="text-green-700 dark:text-green-300 text-sm space-y-1">
                <li>• Account management and authentication</li>
                <li>• Processing payments and withdrawals</li>
                <li>• Game management and prize distribution</li>
                <li>• Customer support and issue resolution</li>
              </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">🔒 Legal Compliance</h3>
              <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1">
                <li>• Age verification (18+ requirement)</li>
                <li>• Anti-fraud and security monitoring</li>
                <li>• Regulatory compliance and reporting</li>
                <li>• Terms of service enforcement</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Information Sharing and Disclosure</h2>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">🚫 We DO NOT Sell Your Data</h3>
            <p className="text-red-700 dark:text-red-300 text-sm">
              HotBoxes never sells, rents, or trades your personal information to third parties for marketing purposes.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3">Limited Sharing Scenarios</h3>
          <ul className="list-disc list-inside space-y-2 mb-4">
            <li><strong>Payment Processors:</strong> Transaction data shared with CashApp for payment processing</li>
            <li><strong>Legal Requirements:</strong> Information disclosed when required by law or legal process</li>
            <li><strong>Fraud Prevention:</strong> Data shared with security services to prevent fraud and abuse</li>
            <li><strong>Business Transfers:</strong> Information may be transferred in case of merger or acquisition</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Data Security</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">🔐 Technical Safeguards</h3>
              <ul className="text-purple-700 dark:text-purple-300 text-sm space-y-1">
                <li>• SSL/TLS encryption for all data transmission</li>
                <li>• Encrypted password storage</li>
                <li>• Secure database with access controls</li>
                <li>• Regular security updates and monitoring</li>
              </ul>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">🛡️ Operational Security</h3>
              <ul className="text-orange-700 dark:text-orange-300 text-sm space-y-1">
                <li>• Limited employee access to personal data</li>
                <li>• Regular security audits and assessments</li>
                <li>• Incident response and breach notification procedures</li>
                <li>• Secure development and deployment practices</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Your Privacy Rights</h2>
          
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">📧 Access and Correction</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                You can access and update your personal information through your account settings. 
                Contact us if you need assistance with data corrections or have questions about your information.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">🗑️ Account Deletion</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                You may request account deletion at any time. Please note that we may retain certain information 
                as required by law or for legitimate business purposes (e.g., transaction records for tax compliance).
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">📊 Data Portability</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                You can request a copy of your personal data in a structured, commonly used format. 
                Contact our support team to initiate a data export request.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Cookies and Tracking</h2>
          
          <p className="mb-4">
            HotBoxes uses cookies and similar technologies to enhance your experience and maintain session security:
          </p>

          <ul className="list-disc list-inside space-y-2 mb-4">
            <li><strong>Essential Cookies:</strong> Required for authentication and security</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Analytics Cookies:</strong> Help us understand usage patterns and improve our service</li>
          </ul>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            You can control cookie settings through your browser, but disabling essential cookies may affect site functionality.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Responsible Gambling and Privacy</h2>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">🎯 Spending Limit Enforcement</h3>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-2">
              We monitor your gambling activity to enforce responsible gambling limits you set. This includes:
            </p>
            <ul className="text-yellow-700 dark:text-yellow-300 text-sm space-y-1 list-disc list-inside">
              <li>Daily and weekly spending limits</li>
              <li>Session time tracking</li>
              <li>Self-exclusion period enforcement</li>
              <li>Pattern recognition for problem gambling indicators</li>
            </ul>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. International Users</h2>
          
          <p className="mb-4">
            HotBoxes operates primarily in the United States. If you access our service from outside the US:
          </p>

          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>Your data may be transferred to and processed in the United States</li>
            <li>You are responsible for compliance with local gambling laws</li>
            <li>Different privacy laws may apply in your jurisdiction</li>
            <li>Contact us if you have specific international privacy concerns</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Children's Privacy</h2>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">🔞 Age Restriction</h3>
            <p className="text-red-700 dark:text-red-300">
              HotBoxes is intended only for users 18 years and older. We do not knowingly collect personal information 
              from children under 18. If we discover that we have collected information from a child under 18, 
              we will delete that information immediately.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Changes to This Privacy Policy</h2>
          
          <p className="mb-4">
            We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. 
            When we make significant changes:
          </p>

          <ul className="list-disc list-inside space-y-2 mb-4">
            <li>We will notify you via email or through the platform</li>
            <li>We will update the "Last updated" date at the top of this policy</li>
            <li>Continued use of our service constitutes acceptance of the updated policy</li>
            <li>Material changes will require explicit consent where required by law</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Contact Information</h2>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 mb-3">📞 Get in Touch</h3>
            
            <p className="text-indigo-700 dark:text-indigo-300 mb-4">
              If you have questions about this Privacy Policy or how we handle your personal information, please contact us:
            </p>

            <div className="space-y-2 text-indigo-700 dark:text-indigo-300">
              <p><strong>Email:</strong> privacy@playhotboxes.com</p>
              <p><strong>Support:</strong> <Link href="/help" className="underline hover:text-indigo-600">Contact Form</Link></p>
              <p><strong>Mailing Address:</strong> HotBoxes Privacy Team<br />
                [Address to be provided]<br />
                United States
              </p>
            </div>

            <div className="mt-4 text-sm text-indigo-600 dark:text-indigo-400">
              <p><strong>Response Time:</strong> We aim to respond to privacy inquiries within 30 days.</p>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            This Privacy Policy is effective as of {new Date().toLocaleDateString()} and governs your use of HotBoxes.
            By using our service, you acknowledge that you have read and understood this Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}