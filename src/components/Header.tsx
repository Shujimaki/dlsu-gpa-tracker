import type { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

const Header = ({ user, onLoginClick, onLogout }: HeaderProps) => {
  return (
    <header className="bg-dlsu-green text-white">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">DLSU GPA Tracker</h1>
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm">{user.displayName || user.email}</span>
              <button
                onClick={onLogout}
                className="px-4 py-2 bg-white text-dlsu-green rounded hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-4 py-2 bg-white text-dlsu-green rounded hover:bg-gray-100 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 