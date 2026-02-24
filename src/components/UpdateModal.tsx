import { X } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpdateModal = ({ isOpen, onClose }: UpdateModalProps) => {
  const handleClose = () => {
    sessionStorage.setItem('lastUpdateSeen', '2025-08-16');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-display font-semibold text-base text-dlsu-slate">App Updates</h2>
          <button
            onClick={handleClose}
            className="btn-icon btn-ghost rounded-lg p-1.5 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge badge-green">v2.1</span>
            <span className="text-xs text-gray-400">August 16, 2025</span>
          </div>

          <h3 className="text-sm font-display font-semibold text-dlsu-green mb-3">Today's changes</h3>

          <ul className="space-y-2.5">
            {[
              'Users who sign in now stay signed in after refresh or closing the browser.',
              'Sign-in explicitly saves the login method so the app doesn\'t lose the user session.',
              'Anonymous (not-logged-in) data is cleared when you are not signed in so the app shows default values.',
              'Logging out still clears your data and keeps you signed out on refresh.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                <div className="w-1.5 h-1.5 rounded-full bg-dlsu-emerald mt-1.5 flex-shrink-0"></div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={handleClose} className="btn btn-primary btn-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateModal;