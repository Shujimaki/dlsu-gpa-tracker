import { useState } from 'react';
import { Bell } from 'lucide-react';
import type { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onShowUpdateModal: () => void;
}

const Header = ({ user, onLoginClick, onLogout, onShowUpdateModal }: HeaderProps) => {
  // Function to truncate username/email if too long
  const formatUserIdentifier = (user: User) => {
    const displayName = user.displayName || user.email || 'User';
    return displayName.length > 20 ? `${displayName.substring(0, 17)}...` : displayName;
  };

  return (
    <header className="bg-dlsu-green text-white shadow-md">
      <div className="w-full px-6 py-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Top row with logo and notification bell */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Greendex</h1>
            </div>
            
            <button
              onClick={onShowUpdateModal}
              className="p-2 hover:bg-dlsu-light-green rounded-full transition-colors relative"
              aria-label="Updates"
            >
              <Bell size={24} className="text-dlsu-light-green" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
          
          {/* Bottom row with user info and login/logout button */}
          <div className="flex justify-end items-center w-full mt-2 sm:mt-0">
            {user ? (
              <div className="flex flex-wrap items-center gap-2 justify-end">
                <span className="text-sm max-w-[200px] truncate">{formatUserIdentifier(user)}</span>
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
    </header>
  );
};

export default Header; 