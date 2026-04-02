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
    <header className="glass sticky top-0 z-40 border-b border-white/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-dlsu-green flex items-center justify-center shadow-sm">
              <span className="text-white font-display font-bold text-sm">G</span>
            </div>
            <div className="flex flex-col">
              <h1 className="font-display font-bold text-base sm:text-lg tracking-tight text-dlsu-slate leading-none">
                Greendex
              </h1>
              <span className="text-[0.6rem] text-gray-400 font-medium tracking-wider uppercase leading-tight hidden sm:block">
                DLSU GPA Tracker
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Utility buttons */}
            <button
              onClick={onShowUpdates}
              className="btn-icon btn-ghost rounded-lg p-2 text-gray-500 hover:text-dlsu-green hover:bg-dlsu-green/5 transition-all"
              aria-label="Updates"
              title="Updates"
            >
              <Bell size={17} />
            </button>

            {/* Help section - grouped "?" button with dropdown */}
            <div className="relative" ref={helpRef}>
              <button
                onClick={() => setHelpOpen((open) => !open)}
                className="btn-icon btn-ghost rounded-lg p-2 text-gray-500 hover:text-dlsu-green hover:bg-dlsu-green/5 transition-all"
                aria-label="Help"
                aria-haspopup="menu"
                aria-expanded={helpOpen}
                title="Help"
              >
                <HelpCircle size={17} />
              </button>
              {helpOpen && (
                <div
                  className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-48"
                  role="menu"
                  aria-label="Help menu"
                >
                  <button
                    role="menuitem"
                    onClick={() => { onShowTutorial(); setHelpOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <BookOpen size={14} />
                    <span>How to use</span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { onShowDeansList(); setHelpOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Info size={14} />
                    <span>Dean's List rules</span>
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => { onShowGPACalculation(); setHelpOpen(false); }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
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
                className="btn-icon rounded-lg p-2 text-amber-600 hover:bg-amber-50 transition-all relative"
                aria-label="Warnings"
                title="Warnings"
              >
                <Info size={17} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
              </button>
            )}

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>

            {/* Auth section */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-dlsu-green/5">
                  <div className="w-6 h-6 rounded-full bg-dlsu-green/10 flex items-center justify-center">
                    <User size={13} className="text-dlsu-green" />
                  </div>
                  <span className="text-xs font-medium text-dlsu-green max-w-[140px] truncate">
                    {formatUserIdentifier(user)}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="btn btn-ghost btn-sm text-gray-500 hover:text-red-600 hover:bg-red-50 gap-1.5"
                  title="Log out"
                >
                  <LogOut size={15} />
                  <span className="hidden sm:inline text-xs">Log out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="btn btn-primary btn-sm gap-1.5 shadow-sm"
              >
                <LogIn size={15} />
                <span className="text-xs">Log in</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Gradient bottom border */}
      <div className="h-px bg-gradient-to-r from-transparent via-dlsu-green/20 to-transparent"></div>
    </header>
  );
};

export default Header;