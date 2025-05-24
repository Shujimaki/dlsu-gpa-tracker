import { X } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpdateModal = ({ isOpen, onClose }: UpdateModalProps) => {
  const handleClose = () => {
    // Save that the user has seen this update
    sessionStorage.setItem('lastUpdateSeen', '2025-05-24');
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
          <p className="text-gray-600">May 24, 2025</p>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-dlsu-green">New Features for All Users:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-1">
                <li><strong>Clear Button for All Terms:</strong> You can now clear all courses from any term, including standard terms 1-12. Standard terms cannot be deleted, only cleared.</li>
                <li><strong>Improved Term Management:</strong> Custom terms (13+) can only be deleted if they are the last term. Otherwise, you can clear their data while keeping the term in your list.</li>
                <li><strong>Better Feedback:</strong> The app now gives clear explanations and confirmation dialogs for clearing or deleting terms, so you always know what will happen.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-dlsu-green">Print Grades Feature:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-1">
                <li>Print or download your term grades with one click</li>
                <li>Choose between standard paper size or social media story format</li>
                <li>Add your name and degree program to personalize your grade report</li>
                <li>Easily share your academic achievements with friends and family</li>
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