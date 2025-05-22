import { useEffect } from 'react';
import { X } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpdateModal = ({ isOpen, onClose }: UpdateModalProps) => {
  useEffect(() => {
    const lastUpdateSeen = localStorage.getItem('lastUpdateSeen');
    if (!lastUpdateSeen || lastUpdateSeen !== '2024-03-20') {
      // Show modal automatically if update hasn't been seen
      onClose();
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('lastUpdateSeen', '2024-03-20');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-dlsu-green">Latest Update</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <p className="text-gray-600">March 20, 2024</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Added flowchart exemption option for Dean's List eligibility</li>
            <li>Added failing grade check for both academic and non-academic subjects</li>
            <li>Added academic dishonesty warning to Dean's List modal</li>
            <li>Improved UI/UX with better spacing and visual feedback</li>
          </ul>
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