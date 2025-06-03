import { X } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpdateModal = ({ isOpen, onClose }: UpdateModalProps) => {
  const handleClose = () => {
    // Save that the user has seen this update
    sessionStorage.setItem('lastUpdateSeen', '2025-06-01');
    onClose();
  };

  // Don't render anything if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-md max-w-md w-full">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base font-medium text-gray-900">App Updates</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-xs text-gray-500 mb-2">June 1, 2025</p>
          
          <h3 className="text-sm font-medium text-dlsu-green mb-2">
            New Features
          </h3>
          
          <ul className="text-sm text-gray-700 space-y-2 mb-4">
            <li className="flex items-start">
              <span className="text-dlsu-green mr-2">•</span>
              <span>Added CGPA Projections calculator to help you plan future terms</span>
            </li>
            <li className="flex items-start">
              <span className="text-dlsu-green mr-2">•</span>
              <span>Improved mobile experience with better layouts and controls</span>
            </li>
            <li className="flex items-start">
              <span className="text-dlsu-green mr-2">•</span>
              <span>Added data synchronization across devices when logged in</span>
            </li>
          </ul>
          
          <h3 className="text-sm font-medium text-dlsu-green mb-2">
            Improvements
          </h3>
          
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-start">
              <span className="text-dlsu-green mr-2">•</span>
              <span>Redesigned the interface for a cleaner, more focused experience</span>
            </li>
            <li className="flex items-start">
              <span className="text-dlsu-green mr-2">•</span>
              <span>Fixed several bugs related to term management</span>
            </li>
          </ul>
        </div>
        
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 bg-dlsu-green text-white text-sm rounded hover:bg-dlsu-dark-green transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateModal; 