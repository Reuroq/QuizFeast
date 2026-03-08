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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
