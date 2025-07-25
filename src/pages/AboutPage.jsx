import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import GreenDriftfield from '../components/GreenDriftfield'; // ✅ use your custom green background

const faqs = [
  {
    question: '1. Is Stand Off gambling?',
    answer: `Stand Off is a skill-based PvP platform. You're not betting against a house or a random algorithm — you're facing another player. If you win, it's because you outplayed them.`,
  },
  {
    question: '2. How do I play?',
    answer: `There are four ways to start a match:
- Create a contract (set your game and wager — it becomes public for others to accept)
- Accept an existing contract from the public pool
- Challenge a player directly from the leaderboard, chat, friends list, or past opponents
- Accept a challenge sent to you by another player

Matches begin when both players agree to terms. Players who are currently online are shown with green dots — they’ll instantly receive a popup when challenged. You’ll match faster by targeting active users.`,
  },
  {
    question: '3. Why isn’t my withdrawal instant?',
    answer: `Some withdrawals are reviewed and approved by an admin before being released. This is done strictly for security reasons, especially to protect players from fraud or suspicious activity. We take both security and player balances seriously — every player is entitled to their funds, and we ensure that standard withdrawals are honored in full.`,
  },
  {
    question: '4. Is there a house edge?/Fee Chart.',
    answer: `No. We don’t play against you, and we don’t manipulate outcomes. All we take is a small rake from each match, based on wager size:
- $5–$24.99: 10% fee
- $25–$149.99: 4.5% fee
- $150+: 3% fee
- Rematch: 4% (coming soon)
- Leaderboard Rematch: 3%

The minimum wager to start or accept a match is $2.50.`,
  },
  {
    question: '5. Can I actually win real money?',
    answer: `Yes. Wagers are made in SOL, and payouts are sent directly to your connected wallet when you win. You’re always in control of your funds.`,
  },
  {
    question: '6. Is it fair? Can it be rigged?',
    answer: `No rigging. No hidden odds. No house AI. Every match is against another real player. If you win, it's because you earned it. If you lose, it’s because someone beat you — not because the system was against you.`,
  },
  {
    question: '7. What games can I play?',
    answer: `Right now, Stand Off supports multiple 1v1 games like “Stand Off” (FPS) and “Duel” (Rock-Paper-Scissors). More games are coming soon — and we build based on what players want. We always want your feedback and support. Feel free to share your thoughts, ideas, or concerns anytime in the Stand Off Discord.`,
  },
  {
    question: '8. What happens if someone disconnects or quits mid-match?',
    answer: `If a player disconnects, leaves, or force quits the game before it ends, the other player may automatically be awarded the win, depending on the situation. We log all match events and review edge cases to keep the outcome fair. Intentional quits may result in penalties.`,
  },
  {
    question: '9. Can I play on mobile?',
    answer: `Not yet — but mobile support is in the works. For now, we recommend using a desktop browser for the best experience. Announcements about mobile access will be posted on our Discord and socials.`,
  },
  {
    question: '10. What if I send a challenge and the other player doesn’t respond?',
    answer: `If the player you're challenging doesn’t have enough balance or isn’t online, the popup won’t show — but your challenge will still go through and be stored in their Active Challenges box. This means they can see it later and accept it at any time, as long as you still have the funds available. You’ll also see that pending challenge listed on your end until it’s accepted, declined, or canceled.`,
  },
  {
    question: '11. Can I cancel a contract or challenge after I send it?',
    answer: `You can cancel contracts — but not direct challenges. Contracts are open offers posted to the public, so you’re free to cancel them anytime before someone accepts. Direct challenges, on the other hand, are sent straight to a specific player. Once you issue one, it’s locked in — like stepping into the ring. If you want more flexibility, post or accept a contract instead.`,
  },
];

const AboutPage = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden">
      <GreenDriftfield />
      <div className="relative z-10 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-4">What Is Stand Off?</h1>
        <p className="mb-4">
          <strong>Stand Off</strong> is a crypto-powered, 1v1 skill-based wagering platform where players compete head-to-head for real stakes.
          The winner takes the pot. The platform takes a small fee. That’s it. No house games, no rigged odds — just skill, pressure, and a real opponent.
        </p>
        <p className="mb-4">
          Connect your Solana wallet, choose your wager, and enter a match.
          Games are fast, competitive, and unforgiving — you win or you don’t.
        </p>

        <h2 className="text-2xl font-semibold text-green-300 mt-6 mb-2">Why We Built It</h2>
        <p className="mb-4">
          We built Stand Off because we wanted something that didn’t exist — a fair, skill-based way to play for real stakes without the usual traps of gambling sites.
        </p>
        <p className="mb-4">
          In most platforms, the house always wins. The odds are stacked, and you're playing against hidden systems. That’s not what we wanted.
        </p>
        <p className="mb-4">
          Here, it’s simple: you play against another real person. If you win, it’s because you outplayed them. If you lose, it’s because they got the better of you. No luck, no rigging, just real matches.
        </p>
        <p className="mb-4">
          We’ll keep building, improving, and adding features — because this platform is for the community. Without you, there is no Stand Off.
        </p>

        <h2 className="text-2xl font-semibold text-green-300 mt-6 mb-2">🎯 Why Stand Off Over Traditional Platforms?</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-300">
          <li>Traditional wagering platforms often rely on house edges and random number generators.</li>
          <li>They’re designed so that, in the long run, the house wins.</li>
          <li><strong>Stand Off changes the rules.</strong></li>
          <li>Every game is player vs. player — not player vs. backend code</li>
          <li>Your chances aren’t fixed — they’re earned</li>
          <li>You’re not betting on randomness — you’re betting on yourself</li>
          <li>If you're confident, competitive, or just want a real shot — this is where you play.</li>
        </ul>

        <h2 className="text-2xl font-semibold text-green-300 mt-8 mb-4">❓ Commonly Asked Questions</h2>
        <div className="space-y-2">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-700 pb-2">
              <button
                onClick={() => toggle(index)}
                className="w-full text-left text-green-400 font-semibold hover:underline"
              >
                ❓ {faq.question}
              </button>
              {openIndex === index && (
                <div className="mt-2 whitespace-pre-line text-gray-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg text-sm text-gray-400">
          If you have any questions, feel free to reach out to the support chat on the Stand Off Discord.
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-block px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded shadow-md transition"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
