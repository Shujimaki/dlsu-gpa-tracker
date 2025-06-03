import { Bell, AlertTriangle, HelpCircle } from 'lucide-react';
import type { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onShowUpdateModal: () => void;
  showWarningIndicator?: boolean;
  onShowWarning?: () => void;
  onShowTutorialModal: () => void;
}

const Header = ({ 
  user, 
  onLoginClick, 
  onLogout, 
  onShowUpdateModal, 
  showWarningIndicator = false,
  onShowWarning = () => {},
  onShowTutorialModal
}: HeaderProps) => {
  // Function to truncate username/email if too long
  const formatUserIdentifier = (user: User) => {
    const displayName = user.displayName || user.email || 'User';
    return displayName.length > 20 ? `${displayName.substring(0, 17)}...` : displayName;
  };

  return (
    <header className="bg-dlsu-green text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">Greendex</h1>
          </div>
          
          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* User section */}
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm hidden sm:inline max-w-[150px] truncate">{formatUserIdentifier(user)}</span>
                <button
                  onClick={onLogout}
                  className="text-sm bg-white text-dlsu-green hover:bg-gray-100 px-3 py-1.5 rounded transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="text-sm bg-white text-dlsu-green hover:bg-gray-100 px-3 py-1.5 rounded transition-colors"
              >
                Login
              </button>
            )}
            
            {/* Divider */}
            <div className="h-6 w-px bg-dlsu-light-green/50 mx-1"></div>
            
            {/* Action icons */}
            <div className="flex items-center gap-2">
              {/* Warning indicator */}
              {showWarningIndicator && (
                <button
                  onClick={onShowWarning}
                  className="p-1.5 hover:bg-dlsu-light-green rounded-full transition-colors relative"
                  aria-label="Show data warning"
                  title="Your data is only saved temporarily"
                >
                  <AlertTriangle size={20} />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"></span>
                </button>
              )}

              {/* Tutorial button */}
              <button
                onClick={onShowTutorialModal}
                className="p-1.5 hover:bg-dlsu-light-green rounded-full transition-colors"
                aria-label="Show tutorial"
                title="How to use Greendex"
              >
                <HelpCircle size={20} />
              </button>
              
              {/* Update notification bell */}
              <button
                onClick={onShowUpdateModal}
                className="p-1.5 hover:bg-dlsu-light-green rounded-full transition-colors relative"
                aria-label="Updates"
                title="View application updates"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 