import { useState, useRef, useEffect } from 'react';
import { Bell, BookOpen, HelpCircle, Info, LogIn, LogOut, User } from 'lucide-react';

interface HeaderProps {
  user: { email?: string | null; displayName?: string | null; uid?: string } | null;
  onLogin: () => void;
  onLogout: () => void;
  onShowUpdates: () => void;
  onShowTutorial: () => void;
  onShowDeansList: () => void;
  onShowGPACalculation: () => void;
  onShowWarnings: () => void;
  hasWarnings: boolean;
}

const Header = ({ user, onLogin, onLogout, onShowUpdates, onShowTutorial, onShowDeansList, onShowGPACalculation, onShowWarnings, hasWarnings }: HeaderProps) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!helpOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHelpOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [helpOpen]);
  const formatUserIdentifier = (user: { email?: string | null; displayName?: string | null; uid?: string }): string => {
    if (user.displayName) return user.displayName;
    if (user.email) return user.email;
    if (user.uid) return `User ${user.uid.substring(0, 6)}...`;
    return 'User';
  };

  return (
    <header className="glass sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <a
            href="/"
            className="flex items-center gap-3 flex-shrink-0 min-w-0"
          >
            <img
              src="/greendex-icon.svg"
              alt="Greendex"
              className="w-8 h-8 flex-shrink-0"
              style={{ minWidth: '2rem', minHeight: '2rem' }}
            />
            <div className="flex flex-col min-w-0">
              <h1 className="font-display font-bold text-base sm:text-lg tracking-tight text-dlsu-slate leading-none truncate">
                Greendex
              </h1>
              <span className="text-[0.6rem] text-gray-500 font-medium tracking-wider uppercase leading-tight hidden sm:block truncate">
                DLSU GPA Tracker
              </span>
            </div>
          </a>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Utility buttons */}
            <button
              onClick={onShowUpdates}
              className="btn-icon btn-ghost rounded-lg p-2 text-gray-400 hover:text-dlsu-green hover:bg-dlsu-green/10 transition-all"
              aria-label="Updates"
              title="Updates"
            >
              <Bell size={17} />
            </button>

            {/* Help section - grouped "?" button with dropdown */}
            <div className="relative" ref={helpRef}>
              <button
                onClick={() => setHelpOpen((open) => !open)}
                className="btn-icon btn-ghost rounded-lg p-2 text-gray-400 hover:text-dlsu-green hover:bg-dlsu-green/10 transition-all"
                aria-label="Help"
                aria-haspopup="menu"
                aria-expanded={helpOpen}
                title="Help"
              >
                <HelpCircle size={17} />
              </button>
              {helpOpen && (
                <div
                  className="absolute right-0 top-full mt-1 bg-[#111916] rounded-lg shadow-lg border border-[#1E2B24] py-1 w-48"
                  role="menu"
                  aria-label="Help menu"
                >
                  <button
                    role="menuitem"
                    onClick={() => { onShowTutorial(); setHelpOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    <BookOpen size={14} />
                    <span>How to use</span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { onShowDeansList(); setHelpOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Info size={14} />
                    <span>Dean&apos;s List rules</span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { onShowGPACalculation(); setHelpOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Info size={14} />
                    <span>How GPA is calculated</span>
                  </button>
                </div>
              )}
            </div>

            {hasWarnings && (
              <button
                onClick={onShowWarnings}
                className="btn-icon rounded-lg p-2 text-amber-400 hover:bg-amber-400/10 transition-all relative"
                aria-label="Warnings"
                title="Warnings"
              >
                <Info size={17} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              </button>
            )}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-700 mx-1 hidden sm:block"></div>

            {/* Auth section */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-dlsu-green/10">
                  <div className="w-6 h-6 rounded-full bg-dlsu-green/20 flex items-center justify-center">
                    <User size={13} className="text-dlsu-green" />
                  </div>
                  <span className="text-xs font-medium text-dlsu-green max-w-[140px] truncate">
                    {formatUserIdentifier(user)}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="btn btn-ghost btn-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 gap-1.5"
                  title="Log out"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline text-xs">Log out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="btn btn-primary btn-sm gap-1.5"
                style={{ boxShadow: '0 0 12px rgba(0,224,154,0.2)' }}
              >
                <LogIn size={15} />
                <span className="text-xs">Log in</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gradient bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-dlsu-green/40 to-transparent"></div>
    </header>
  );
};

export default Header;
