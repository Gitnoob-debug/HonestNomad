'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui';

export function Header() {
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">H</span>
            </div>
            <span className="font-semibold text-xl text-gray-900">
              HonestNomad
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href="/flash"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full font-medium hover:bg-primary-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Flash
                    </Link>
                    <Link
                      href="/discover"
                      className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Discover
                    </Link>
                    <Link
                      href="/bookings"
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      My Bookings
                    </Link>
                    <Link
                      href="/settings"
                      className="text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Settings
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                      >
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {user.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </button>
                      {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1">
                          <div className="px-4 py-2 border-b">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.email}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              signOut();
                              setMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Sign out
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login">
                      <Button variant="ghost">Log in</Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button>Sign up</Button>
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t">
            {!loading && (
              <div className="space-y-2">
                {user ? (
                  <>
                    <Link
                      href="/flash"
                      className="flex items-center gap-2 px-4 py-2 text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg font-medium"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Flash Vacation
                    </Link>
                    <Link
                      href="/discover"
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Discover
                    </Link>
                    <Link
                      href="/bookings"
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Bookings
                    </Link>
                    <Link
                      href="/settings"
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="block px-4 py-2 text-primary-600 font-medium hover:bg-gray-100 rounded-lg"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
