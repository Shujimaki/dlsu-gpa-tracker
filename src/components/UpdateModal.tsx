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
              <h3 className="font-medium text-dlsu-green">New CGPA Projections Feature:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-1">
                <li>Calculate the GPA you need to achieve your target CGPA</li>
                <li>Set your total units to graduate and target CGPA</li>
                <li>Access directly from the CGPA Calculator tab</li>
                <li>See instantly if your target CGPA is achievable</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-dlsu-green">CGPA Calculator Improvements:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700 mt-1">
                <li>View all your terms in one place with a comprehensive overview</li>
                <li>Automatically calculate your cumulative GPA across all terms</li>
                <li>Terms are grouped by year for better organization</li>
                <li>Click the edit button to quickly jump to any term in the GPA Calculator</li>
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