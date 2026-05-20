import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-dark-800 py-10 mt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="text-xs text-dark-500 leading-relaxed">
            <strong className="text-dark-400">QuizFeast</strong> is a free community-driven study reference for
            CBT and certification exams. Operated by Nightshift Labs LLC. Not affiliated with the U.S. Department
            of Defense, JKO, CompTIA, or any other organization referenced on the site. All trademarks
            are property of their respective owners. Answers are community-sourced and may be wrong &mdash; always
            verify with your official training portal.
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-dark-800/60">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-brand-400 to-brand-600 rounded-md flex items-center justify-center font-bold text-white text-xs">Q</div>
              <span className="text-sm text-dark-500">&copy; {new Date().getFullYear()} Nightshift Labs LLC</span>
            </div>
            <div className="flex items-center flex-wrap gap-x-5 gap-y-1 text-sm text-dark-500">
              <Link href="/study" className="hover:text-dark-300">AI Study</Link>
              <Link href="/answers" className="hover:text-dark-300">Answer Keys</Link>
              <Link href="/search" className="hover:text-dark-300">Search</Link>
              <Link href="/disclaimer" className="hover:text-dark-300">Disclaimer</Link>
              <Link href="/terms" className="hover:text-dark-300">Terms</Link>
              <Link href="/privacy" className="hover:text-dark-300">Privacy</Link>
              <Link href="/dmca" className="hover:text-dark-300">DMCA</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
