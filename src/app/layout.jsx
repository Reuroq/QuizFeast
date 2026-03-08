import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'QuizFeast — Free AI Study Tools That Actually Work',
  description: 'Free AI-powered study tools that actually work. Upload any document, get instant flashcards. Smart study with spaced repetition. No ads, no paywalls, ever.',
  keywords: 'study, flashcards, quiz, free study tools, AI study, spaced repetition, study app',
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
