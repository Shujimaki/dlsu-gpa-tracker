import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import UpdateModal from './UpdateModal';
import type { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
}

const Header = ({ user, onLoginClick, onLogout }: HeaderProps) => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    const lastUpdateSeen = localStorage.getItem('lastUpdateSeen');
    if (!lastUpdateSeen || lastUpdateSeen !== '2024-03-20') {
      setShowUpdateModal(true);
    }
  }, []);

  return (
    <header className="bg-dlsu-green text-white shadow-md">
      <div className="w-full px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Greendex</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowUpdateModal(true)}
              className="p-2 hover:bg-dlsu-light-green rounded-full transition-colors relative"
            >
              <Bell size={24} className="text-dlsu-light-green" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

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
      </div>
      <UpdateModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} />
    </header>
  );
};

export default Header; 