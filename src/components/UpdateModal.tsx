import { X } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpdateModal = ({ isOpen, onClose }: UpdateModalProps) => {
  const handleClose = () => {
    // Save that the user has seen this update
    sessionStorage.setItem('lastUpdateSeen', '2025-05-23');
    onClose();
  };

  // Don't render anything if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-dlsu-green">Major App Update 🎉</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-gray-600">May 23, 2025</p>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-dlsu-green">Storage Simplification:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-1">
                <li>Simplified data storage to session-only for anonymous users</li>
                <li>Removed localStorage completely for cleaner data management</li>
                <li>Anonymous users now start fresh on page refresh</li>
                <li>Improved sync between anonymous and authenticated states</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-dlsu-green">Term Management:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-1">
                <li>Always display Terms 1-12 as standard terms</li>
                <li>Fixed term creation, display, and deletion</li>
                <li>Added a 21-term maximum limit</li>
                <li>Improved handling of custom terms (13+)</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-dlsu-green">Performance & Bug Fixes:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-1">
                <li>Strengthen data security with proper timeout handling</li>
                <li>Enhanced error handling throughout the application</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleClose}
            className="bg-dlsu-green text-white px-4 py-2 rounded hover:bg-dlsu-green/90 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateModal; 