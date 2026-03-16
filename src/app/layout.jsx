import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'QuizFeast — Military CBT Answers & Free AI Study Tools',
  description: 'Free military CBT answers for Cyber Awareness Challenge, OPSEC, Insider Threat, Antiterrorism Level 1, HIPAA, Law of War, SERE 100.2, and more. 650+ questions and answers. No ads, no paywalls.',
  keywords: 'military CBT answers, cyber awareness challenge answers, OPSEC answers, insider threat awareness answers, antiterrorism level 1 answers, HIPAA training answers, law of war answers, SERE 100.2 answers, JKO answers, DoD training answers, military training answers, free study tools, AI study, flashcards',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
