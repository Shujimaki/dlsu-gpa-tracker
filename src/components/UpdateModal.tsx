import { X } from 'lucide-react';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpdateModal = ({ isOpen, onClose }: UpdateModalProps) => {
  const handleClose = () => {
    sessionStorage.setItem('lastUpdateSeen', '2026-04-18');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[#1E2B24] flex justify-between items-center">
          <h2 className="font-display font-semibold text-base text-dlsu-slate">App Updates</h2>
          <button
            onClick={handleClose}
            className="btn-icon btn-ghost rounded-lg p-1.5 text-gray-500 hover:text-gray-300"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge badge-green">v3.1</span>
            <span className="text-xs text-gray-400">April 18, 2026</span>
          </div>

          <h3 className="text-sm font-display font-semibold text-dlsu-green mb-3">What's new</h3>

          <ul className="space-y-2.5">
            {[
              'You can now choose 1.5 units in the GPA Calculator.',
              'Fixed a bug in the Grade Calculator where you couldn\'t clear the default 0 to type your score.',
              'Each term now has an "In CGPA" toggle so you can control exactly which terms count toward your CGPA.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-dlsu-emerald mt-1.5 flex-shrink-0"></div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 py-4 border-t border-[#1E2B24] flex justify-end">
          <button onClick={handleClose} className="btn btn-primary btn-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateModal;