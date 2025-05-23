import { X } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpdateModal = ({ isOpen, onClose }: UpdateModalProps) => {
  const handleClose = () => {
    // Save that the user has seen this update
    localStorage.setItem('lastUpdateSeen', '2024-05-22');
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
          <p className="text-gray-600">May 22, 2025</p>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-dlsu-green">Account & Storage Improvements:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-1">
                <li>Fixed Firebase authentication issues</li>
                <li>Added proper error handling for login/registration</li>
                <li>Implemented session persistence (no auto-login after browser restart)</li>
                <li>New accounts now start with a clean slate</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-dlsu-green">Data Management:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-1">
                <li>Added "Use local storage only" option for offline usage</li>
                <li>Improved data synchronization between devices</li>
                <li>Enhanced error handling for Firestore operations</li>
                <li>Fixed data migration issues between login sessions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-dlsu-green">User Experience:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-1">
                <li>Better saving status indicators</li>
                <li>Improved loading states throughout the app</li>
                <li>Enhanced form validation and error messages</li>
                <li>Fixed NAS handling and grade calculations</li>
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