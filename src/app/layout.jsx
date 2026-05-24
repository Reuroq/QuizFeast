import Script from 'next/script';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://quizfeast.onrender.com';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;  // e.g. G-XXXXXXXXXX — leave unset to disable

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'QuizFeast — CBT Answers & Free AI Study Tools',
  description: 'Free CBT answers for Cyber Awareness Challenge, OPSEC, Insider Threat, Antiterrorism Level 1, HIPAA, Law of War, SERE 100.2, and more. 650+ questions and answers. No ads, no paywalls.',
  keywords: 'CBT answers, cyber awareness challenge answers, OPSEC answers, insider threat awareness answers, antiterrorism level 1 answers, HIPAA training answers, law of war answers, SERE 100.2 answers, training answers, free study tools, AI study, flashcards',
  openGraph: {
    type: 'website',
    siteName: 'QuizFeast',
    title: 'QuizFeast — CBT Answers & Free AI Study Tools',
    description: 'Free CBT answers + AI study assistant. Cyber Awareness, OPSEC, SERE, SAPR, HIPAA, and 1,300+ more. No ads, no paywalls, no login.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QuizFeast — CBT Answers & Free AI Study Tools',
    description: 'Free CBT answers + AI study assistant. Cyber Awareness, OPSEC, SERE, SAPR, HIPAA, and 1,300+ more.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { anonymize_ip: true });`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
