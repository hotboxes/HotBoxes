'use client';

import Link from 'next/link';

export default function FAQ() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-white text-display mb-4">
            FREQUENTLY ASKED <span className="text-[#FF4500]">QUESTIONS</span>
          </h1>
          <p className="text-xl text-gray-300 font-semibold">
            Everything you need to know about HotBoxes
          </p>
        </div>

        <div className="space-y-16">
          {/* How to Play Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">How to Play</h2>
            <div className="space-y-4">
              {/* Repeatable FAQ Cards */}
              <FAQCard
                question="What is HotBoxes?"
                answer="HotBoxes is a modern version of Super Bowl Squares for NFL and NBA games. Players purchase squares on a 10x10 grid and win cash prizes based on game scores."
              />
              <FAQCard
                question="How do I play a game?"
                answer={
                  <>
                    <p>1. Browse available games on the <Link href="/games" className="text-indigo-600 hover:text-indigo-800">Games page</Link></p>
                    <p>2. Select a game and click on empty squares to purchase them</p>
                    <p>3. Numbers are randomly assigned 10 minutes before game start</p>
                    <p>4. Win prizes based on the last digit of each team's score at the end of each quarter</p>
                    <p>5. Winnings are automatically credited to your HotCoin balance</p>
                  </>
                }
              />
              <FAQCard
                question="How do I win?"
                answer="You win if your square matches the last digit of both teams' scores at the end of any quarter. For example, if the score is 14-7, the winning square is where row 4 meets column 7. Each game typically pays out for all four quarters (Q1, Q2, Q3, and Final)."
              />
              <FAQCard
                question="Where can I see the prizes for each game?"
                answer="Prize amounts are displayed on each individual game page. Click on any game from the Games page to see the exact HotCoin amounts you can win for each quarter."
              />
              <FAQCard
                question="What are free games?"
                answer={
                  <>
                    <p>Free games don't require HotCoins to participate - you can claim squares at no cost.</p>
                    <p>You can still win real HotCoin prizes that can be withdrawn as cash.</p>
                    <p><strong>Box limit:</strong> You can claim up to 2 boxes per free game to ensure fair participation for all users.</p>
                    <p><strong>Admin-funded:</strong> Prize pools are funded by our administrators as promotional offerings.</p>
                  </>
                }
              />
              <FAQCard
                question="How many boxes can I purchase in each game?"
                answer={
                  <>
                    <p><strong>Free games:</strong> Maximum of 2 boxes per user per game</p>
                    <p><strong>Paid games:</strong> Unlimited boxes (as many as you can afford with your HotCoin balance)</p>
                    <p>The box limit for free games ensures fair participation and prevents abuse of promotional offerings.</p>
                  </>
                }
              />
              <FAQCard
                question="When are numbers assigned to my squares?"
                answer={
                  <>
                    <p>Numbers are automatically assigned exactly <strong>10 minutes before each game starts</strong>.</p>
                    <p>We use a Fisher-Yates shuffle algorithm to ensure completely fair and random number distribution.</p>
                    <p>Once assigned, numbers are displayed on the grid and cannot be changed.</p>
                  </>
                }
              />
              <FAQCard
                question="What happens if a game is cancelled?"
                answer="If a sports game is cancelled or postponed, we will either reschedule the grid for the new game time or provide full refunds of entry fees to all participants."
              />
              <FAQCard
                question="Where do game scores come from?"
                answer="We use official sports league scores and update them manually through our admin system. All scores are verified for accuracy before payouts are processed."
              />
              <FAQCard
                question="Where can I see my HotCoin balance?"
                answer={
                  <>
                    Your current HotCoin balance is always displayed in the top navigation bar when you're logged in. You can also view detailed transaction history on your <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800">Dashboard</Link> or <Link href="/hotcoins" className="text-indigo-600 hover:text-indigo-800">HotCoins page</Link>.
                  </>
                }
              />
            </div>
          </section>

          {/* Account & Technical Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account & Technical</h2>
            <div className="space-y-4">
              <FAQCard
                question="How do I create an account?"
                answer="Click 'Sign Up' in the top navigation, provide your email and create a password. You'll receive a confirmation email to verify your account before you can start playing."
              />
              <FAQCard
                question="Can I change my username?"
                answer="Currently, usernames cannot be changed after account creation. If you need to update your username, please contact support."
              />
              <FAQCard
                question="Is my personal information secure?"
                answer="Yes, we use industry-standard security measures to protect your data. We don't store payment information - all transactions go through CashApp's secure platform."
              />
              <FAQCard
                question="What browsers do you support?"
                answer="HotBoxes works on all modern browsers including Chrome, Firefox, Safari, and Edge. The platform is also optimized for mobile devices."
              />
            </div>
          </section>

          {/* Technical Requirements Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Technical Requirements</h2>
            <div className="space-y-4">
              <FAQCard
                question="What devices and browsers work with HotBoxes?"
                answer={
                  <>
                    <p><strong>Supported browsers:</strong> Chrome, Firefox, Safari, Edge (latest versions)</p>
                    <p><strong>Mobile devices:</strong> Fully optimized for iOS and Android devices</p>
                    <p><strong>Internet connection:</strong> Stable internet required for real-time grid updates</p>
                    <p><strong>JavaScript:</strong> Must be enabled for full functionality</p>
                  </>
                }
              />
              <FAQCard
                question="Do you have a mobile app?"
                answer="HotBoxes is a web-based platform optimized for mobile browsers. You don't need to download an app - simply visit playhotboxes.com on any device."
              />
              <FAQCard
                question="What happens during maintenance?"
                answer="We perform maintenance during low-traffic periods and will notify users in advance. During maintenance, game participation may be temporarily unavailable, but your account and balance remain secure."
              />
            </div>
          </section>

          {/* Support Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Support</h2>
            <div className="space-y-4">
              <FAQCard
                question="How do I contact support?"
                answer={
                  <>
                    For any questions, issues, or support needs, email us at{' '}
                    <a href="mailto:playhotboxeslive@gmail.com" className="text-indigo-600 hover:text-indigo-800">
                      playhotboxeslive@gmail.com
                    </a>. We typically respond within 24 hours.
                  </>
                }
              />
              <FAQCard
                question="What should I include in a support email?"
                answer={
                  <>
                    <p>Please include:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>Your account email address</li>
                      <li>A clear description of the issue</li>
                      <li>Any relevant transaction IDs or game information</li>
                      <li>Screenshots if applicable</li>
                    </ul>
                  </>
                }
              />
              <FAQCard
                question="Can I get a refund?"
                answer="Refunds are handled on a case-by-case basis. If you believe you deserve a refund due to a technical issue or error, please contact support with details about your situation."
              />
            </div>
          </section>

          {/* Age & Legal Section */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Age & Legal Requirements</h2>
            <div className="space-y-4">
              <FAQCard
                question="Do I need to be 18 to play?"
                answer="Yes, you must be at least 18 years old to create an account and participate in HotBoxes. By creating an account, you confirm that you meet this age requirement."
              />
              <FAQCard
                question="Is this legal gambling?"
                answer="HotBoxes operates as a skill-based gaming platform with elements of chance. Please check your local laws and regulations regarding online gaming in your jurisdiction."
              />
            </div>
          </section>
        </div>

        {/* Real Money Warning */}
        <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg mt-8">
          <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
            ⚠️ Important Real Money Warning
          </h3>
          <div className="text-red-800 dark:text-red-200 text-sm space-y-2">
            <p><strong>This platform involves real money transactions.</strong> Only participate with money you can afford to lose.</p>
            <p><strong>You must be 18 or older</strong> and gambling must be legal in your jurisdiction.</p>
            <p><strong>Tax obligations:</strong> You are responsible for reporting winnings to tax authorities.</p>
            <p><strong>Responsible gaming:</strong> Set personal limits and seek help if you have a gambling problem.</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12 p-6 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
          <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-100 mb-2">
            Still have questions?
          </h2>
          <p className="text-indigo-700 dark:text-indigo-300 mb-4">
            We're here to help! Contact us anytime.
          </p>
          <a
            href="mailto:playhotboxeslive@gmail.com"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
}

// Helper component
function FAQCard({ question, answer }: { question: string; answer: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-br from-[#1E3A8A]/30 to-[#0A1128]/80 backdrop-blur-sm rounded-xl p-6 border border-[#39FF14]/20 hover:border-[#39FF14]/50 transition-all">
      <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wider">{question}</h3>
      <div className="text-gray-300 space-y-2">{answer}</div>
    </div>
  );
}
