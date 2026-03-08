'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: 'My Sets' },
    { href: '/create', label: 'Create' },
    { href: '/search', label: 'Search' },
  ];

  const isHome = pathname === '/';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isHome ? 'bg-transparent' : 'glass'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-lg flex items-center justify-center font-bold text-white text-sm group-hover:scale-110 transition-transform">
              Q
            </div>
            <span className="text-xl font-bold text-white">
              Quiz<span className="gradient-text">Feast</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-brand-500/20 text-brand-300'
                    : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/create" className="btn-primary text-sm py-2">
              + New Study Set
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  pathname === link.href
                    ? 'bg-brand-500/20 text-brand-300'
                    : 'text-dark-400 hover:text-dark-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/create"
              onClick={() => setMobileOpen(false)}
              className="block mt-2 btn-primary text-sm text-center"
            >
              + New Study Set
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
