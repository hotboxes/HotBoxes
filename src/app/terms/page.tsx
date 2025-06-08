'use client';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Terms of Service
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              By accessing and using HotBoxes ("the Platform," "we," "us," or "our"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              These Terms of Service ("Terms") govern your use of our website located at playhotboxes.com and any related services provided by HotBoxes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Eligibility and Account Requirements</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Age Requirement:</strong> You must be at least 18 years of age to create an account and use our services.</p>
              <p><strong>Legal Capacity:</strong> You must have the legal capacity to enter into binding agreements.</p>
              <p><strong>Jurisdiction:</strong> You are responsible for ensuring that your use of our services complies with all applicable laws in your jurisdiction.</p>
              <p><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
              <p><strong>Accurate Information:</strong> You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. HotCoins and Virtual Currency</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Virtual Currency:</strong> HotCoins (HC) are virtual credits used within our platform. 1 HotCoin equals $1 USD in value.</p>
              <p><strong>Purchase Terms:</strong> HotCoins can be purchased using real money through approved payment methods (currently CashApp only). Minimum purchase is $10.</p>
              <p><strong>Real Money Backing:</strong> HotCoins represent real USD value and can be withdrawn as actual cash to your CashApp account.</p>
              <p><strong>No Refunds:</strong> HotCoin purchases are generally non-refundable except in cases of proven technical errors or fraud.</p>
              <p><strong>Withdrawal Rights:</strong> You may withdraw your HotCoin balance as real money, subject to our withdrawal policies and limits.</p>
              <p><strong>Account Closure:</strong> Upon account closure, any remaining HotCoin balance may be withdrawn according to our withdrawal procedures.</p>
              <p><strong>Tax Obligations:</strong> You are solely responsible for reporting HotCoin winnings and transactions to relevant tax authorities.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Payment and Withdrawal Terms</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Payment Methods:</strong> We currently accept payments via CashApp to our designated account ($playhotboxes). Minimum purchase is $10.</p>
              <p><strong>Payment Verification:</strong> All payments require transaction ID verification. Duplicate transaction IDs will be rejected to prevent fraud.</p>
              <p><strong>Auto-Approval:</strong> Payments of $100 and under are automatically approved and HotCoins credited instantly. Larger amounts require manual verification within 24 hours.</p>
              <p><strong>Real Money Transactions:</strong> All HotCoin purchases involve actual USD transactions through CashApp. Payments are non-reversible once processed.</p>
              <p><strong>Withdrawal Limits:</strong> Minimum withdrawal is $25. Maximum daily withdrawal is $500 per user for fraud prevention.</p>
              <p><strong>Withdrawal Processing:</strong> Withdrawals are processed within 24-48 hours. Your HotCoins are immediately deducted to prevent double-spending. We reserve the right to request additional verification for large withdrawals.</p>
              <p><strong>Anti-Money Laundering:</strong> We monitor all transactions for suspicious activity and maintain records for regulatory compliance. Large or unusual transactions may trigger additional verification requirements.</p>
              <p><strong>Transaction Fees:</strong> We do not charge fees for deposits or withdrawals, but third-party payment processors may charge their own fees.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Gameplay and Game Rules</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Game Mechanics:</strong> Games are based on the final scores of NFL and NBA games. Winners are determined by matching the last digit of team scores at the end of each quarter.</p>
              <p><strong>Number Assignment:</strong> Numbers are randomly assigned using a Fisher-Yates shuffle algorithm exactly 10 minutes before each game starts. This process is automated and cannot be influenced.</p>
              <p><strong>Entry Fees:</strong> Games may have variable entry fees (Free, 1, 2, 5, 10, 20, or 50 HotCoins per box). Entry fees are clearly displayed before participation.</p>
              <p><strong>Payout Structure:</strong> Custom payout amounts for each quarter are set by administrators and clearly displayed on each game page before participation.</p>
              <p><strong>Game Integrity:</strong> We use official sports league scores and maintain complete records of all game outcomes. Scores are manually verified before payouts are processed.</p>
              <p><strong>Free Games:</strong> Some games may be offered at no cost while still providing real HotCoin prize opportunities. These prizes are funded by our administrators.</p>
              <p><strong>Real-Time Updates:</strong> Game grids update live using secure database connections. You must maintain internet connectivity for proper functionality.</p>
              <p><strong>Game Cancellation:</strong> In the event a sports game is cancelled or postponed, we will refund entry fees or reschedule according to our policies.</p>
              <p><strong>Dispute Resolution:</strong> All game outcomes are final once officially scored. Disputes must be raised within 48 hours with supporting documentation.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Prohibited Activities</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p>You agree not to:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Use the platform for any illegal purposes or in violation of local laws</li>
                <li>Create multiple accounts to circumvent limits or gain unfair advantages (limit: one account per person)</li>
                <li>Use fraudulent payment methods or provide false transaction information</li>
                <li>Submit duplicate transaction IDs or attempt payment fraud</li>
                <li>Attempt to manipulate, hack, or interfere with the platform's operation or number assignment algorithms</li>
                <li>Engage in money laundering or other financial crimes</li>
                <li>Share your account credentials with others or allow account access by minors</li>
                <li>Use automated software, bots, or scripts to interact with our services</li>
                <li>Attempt to reverse engineer or exploit our systems, including real-time database connections</li>
                <li>Circumvent daily withdrawal limits through coordination with other accounts</li>
                <li>Provide false identity information or age verification</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Account Suspension and Termination</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Grounds for Suspension:</strong> We may suspend or terminate accounts for violations of these terms, suspicious activity, multiple account creation, fraudulent payments, or regulatory compliance requirements.</p>
              <p><strong>Investigation Period:</strong> During investigations, account access and withdrawals may be restricted while we review activities. This may include verification of identity and transaction history.</p>
              <p><strong>Immediate Suspension:</strong> Accounts may be immediately suspended for suspected fraud, money laundering, underage access, or attempts to manipulate game outcomes.</p>
              <p><strong>Right to Terminate:</strong> We reserve the right to terminate any account at our discretion with or without cause, especially for violations of the one-account-per-person policy.</p>
              <p><strong>Final Settlement:</strong> Upon termination, we will process legitimate withdrawal requests for verified account balances after investigation completion. Fraudulent balances may be forfeited.</p>
              <p><strong>Appeal Process:</strong> Users may appeal account actions by contacting our support team with relevant information and documentation.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Privacy and Data Protection</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Data Collection:</strong> We collect only necessary information for account operation and regulatory compliance.</p>
              <p><strong>Data Security:</strong> We implement industry-standard security measures to protect your personal and financial information.</p>
              <p><strong>Information Sharing:</strong> We do not sell or share personal information with third parties except as required by law.</p>
              <p><strong>Data Retention:</strong> We retain account information for regulatory compliance and may be required to provide information to authorities.</p>
              <p><strong>Cookies:</strong> Our website may use cookies to enhance user experience and track usage patterns.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Disclaimers and Limitations of Liability</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Service Availability:</strong> We strive for 100% uptime but cannot guarantee uninterrupted service availability.</p>
              <p><strong>Technical Issues:</strong> We are not liable for losses due to technical failures, internet connectivity issues, or force majeure events.</p>
              <p><strong>Investment Risk:</strong> Participation in our games involves risk of loss. You should only participate with money you can afford to lose.</p>
              <p><strong>Third-Party Services:</strong> We are not responsible for issues with third-party payment processors or their services.</p>
              <p><strong>Limitation of Damages:</strong> Our total liability to you for any claim is limited to the amount in your account balance.</p>
              <p><strong>No Warranty:</strong> Our services are provided "as is" without warranties of any kind, express or implied.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Intellectual Property</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Platform Content:</strong> All content, trademarks, and intellectual property on our platform are owned by us or our licensors.</p>
              <p><strong>User License:</strong> We grant you a limited, non-exclusive license to use our platform for its intended purpose.</p>
              <p><strong>Restrictions:</strong> You may not copy, modify, distribute, or create derivative works from our platform content.</p>
              <p><strong>User Content:</strong> Any content you submit to our platform may be used by us for operational purposes.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Dispute Resolution</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Customer Support:</strong> For any disputes, first contact our support team at playhotboxeslive@gmail.com.</p>
              <p><strong>Resolution Timeline:</strong> We will attempt to resolve disputes within 30 days of receipt.</p>
              <p><strong>Governing Law:</strong> These terms are governed by the laws of the United States and the state where our company is incorporated.</p>
              <p><strong>Arbitration:</strong> Any unresolved disputes may be subject to binding arbitration in accordance with applicable arbitration rules.</p>
              <p><strong>Class Action Waiver:</strong> You agree to resolve disputes individually and waive the right to participate in class action lawsuits.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Responsible Gaming</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Age Requirement:</strong> You must be at least 18 years old to use our platform. We prohibit minors from creating accounts and may request age verification documentation.</p>
              <p><strong>Real Money Risk:</strong> This platform involves real money transactions with risk of financial loss. Only participate with money you can afford to lose.</p>
              <p><strong>Self-Limitation:</strong> Users are encouraged to set personal spending limits and play responsibly. We may implement account limits for responsible gaming purposes.</p>
              <p><strong>Problem Gaming:</strong> If you believe you have a gambling problem, please seek professional help and consider self-exclusion. Contact playhotboxeslive@gmail.com for self-exclusion requests.</p>
              <p><strong>Geographic Restrictions:</strong> Online gaming with real money may be illegal in some jurisdictions. You are responsible for ensuring compliance with your local laws.</p>
              <p><strong>Support Resources:</strong> We can provide information about responsible gaming resources and professional help organizations upon request.</p>
              <p><strong>Daily Limits:</strong> Our $500 daily withdrawal limit serves as a responsible gaming measure to prevent excessive losses.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">13. Anti-Money Laundering (AML) and Compliance</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Identity Verification:</strong> We may require additional identity verification for large transactions, unusual activity patterns, or regulatory compliance. This may include government-issued ID verification.</p>
              <p><strong>Transaction Monitoring:</strong> We monitor all transactions for unusual patterns using automated systems and may report suspicious activity to relevant authorities as required by law.</p>
              <p><strong>Record Keeping:</strong> We maintain detailed records of all financial transactions, including CashApp transaction IDs, timestamps, amounts, and user information for regulatory compliance and audit purposes.</p>
              <p><strong>Regulatory Cooperation:</strong> We cooperate fully with law enforcement and regulatory authorities as required, including providing transaction records and user information when legally compelled.</p>
              <p><strong>Large Transaction Reporting:</strong> Transactions over certain thresholds may be reported to financial authorities as required by anti-money laundering regulations.</p>
              <p><strong>Source of Funds:</strong> We may request documentation regarding the source of large deposits to ensure compliance with AML requirements.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">14. Changes to Terms</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Modification Rights:</strong> We reserve the right to modify these terms at any time.</p>
              <p><strong>Notice:</strong> Material changes will be posted on our website and users will be notified.</p>
              <p><strong>Continued Use:</strong> Continued use of our platform after changes constitutes acceptance of new terms.</p>
              <p><strong>Version Control:</strong> The current version date is displayed at the top of this document.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">15. Contact Information</h2>
            <div className="space-y-3 text-gray-600 dark:text-gray-400">
              <p><strong>Support Email:</strong> playhotboxeslive@gmail.com</p>
              <p><strong>Platform Website:</strong> playhotboxes.com</p>
              <p><strong>Response Time:</strong> We typically respond to inquiries within 24 hours during business days.</p>
              <p><strong>Legal Notices:</strong> All legal notices should be sent to our support email address.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">16. Severability</h2>
            <p className="text-gray-600 dark:text-gray-400">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the remaining terms will remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">17. Entire Agreement</h2>
            <p className="text-gray-600 dark:text-gray-400">
              These Terms, along with our Privacy Policy and any additional terms applicable to specific services, constitute the complete and exclusive understanding and agreement between you and HotBoxes regarding your use of our platform.
            </p>
          </section>

          <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg mt-8">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
              ⚠️ Critical Real Money Gaming Notice
            </h3>
            <div className="text-red-800 dark:text-red-200 text-sm space-y-2">
              <p><strong>REAL MONEY TRANSACTIONS:</strong> This platform involves actual USD payments through CashApp ($playhotboxes) and real cash withdrawals to your personal accounts.</p>
              <p><strong>FINANCIAL RISK:</strong> You may lose real money. Only participate with funds you can afford to lose completely.</p>
              <p><strong>AGE REQUIREMENT:</strong> You must be 18+ years old. Creating an account confirms you meet this requirement.</p>
              <p><strong>LEGAL COMPLIANCE:</strong> Online gaming with real money may be illegal in your jurisdiction. You are solely responsible for compliance with local laws.</p>
              <p><strong>TAX OBLIGATIONS:</strong> You must report winnings to tax authorities. We maintain transaction records for your reporting needs.</p>
              <p><strong>NO GUARANTEES:</strong> We do not guarantee winnings, platform availability, or withdrawal processing times beyond our stated policies.</p>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900 p-6 rounded-lg mt-4">
            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100 mb-2">
              Legal Agreement
            </h3>
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              By creating an account and using HotBoxes, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. You confirm that you are at least 18 years of age, that online real-money gaming is legal in your jurisdiction, and that your use of our platform complies with all applicable laws. If you do not agree with any part of these terms, you must discontinue use of our platform immediately.
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400">
            Questions about our Terms of Service?{' '}
            <a href="mailto:playhotboxeslive@gmail.com" className="text-indigo-600 hover:text-indigo-800">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}