import { X, CheckCircle, BookOpen } from 'lucide-react';
import type { ReactNode } from 'react';

export interface InstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

const ModalShell = ({ isOpen, onClose, title, icon, children }: ModalShellProps) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-[#1E2B24] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-display font-semibold text-base text-dlsu-slate">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-icon btn-ghost rounded-lg p-1.5 text-gray-500 hover:text-gray-300"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        <div className="px-5 py-4 border-t border-[#1E2B24] flex justify-end">
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const BULLET_DOT = (
  <svg width="6" height="6" viewBox="0 0 6 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-1.5 flex-shrink-0">
    <circle cx="3" cy="3" r="3" fill="#006f51" />
  </svg>
);

export const DeansListModal = ({ isOpen, onClose }: InstructionModalProps) => {
  const requirements = [
    'Must be enrolled in at least 12 academic units',
    'No grade below 2.0 in any academic subject',
    'No failing grade (0.0 or F) in any subject, including non-academic subjects',
    'First Honors: GPA of 3.4 or higher',
    'Second Honors: GPA of 3.0 to 3.39',
    'Must not have been found guilty of academic dishonesty',
  ];

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title={"Dean's List Requirements"} icon={<CheckCircle className="text-dlsu-green" size={18} />}>
      <div className="space-y-3">
        {requirements.map((item) => {
          const isFirstHonors = item.includes('3.4');
          const isSecondHonors = item.includes('3.0 to 3.39');
          return (
            <div
              key={item}
              className={`flex items-start gap-2.5 text-sm ${
                isFirstHonors
                  ? 'text-amber-300 font-medium bg-amber-500/10 p-2 rounded-lg'
                  : isSecondHonors
                    ? 'text-dlsu-green font-medium bg-dlsu-green/5 p-2 rounded-lg'
                    : 'text-gray-300'
              }`}
            >
              {isFirstHonors || isSecondHonors ? (
                <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />
              ) : BULLET_DOT}
              {isFirstHonors && (
                <span className="inline-block px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wider bg-amber-500/20 text-amber-300 rounded font-semibold">
                  First
                </span>
              )}
              {isSecondHonors && (
                <span className="inline-block px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wider bg-green-500/20 text-green-400 rounded font-semibold">
                  Second
                </span>
              )}
              <span>{item.replace('First Honors: ', '').replace('Second Honors: ', '')}</span>
            </div>
          );
        })}
        <div className="alert alert-warning mt-2" role="alert">
          <span>
            <strong>Note:</strong> Academic dishonesty includes cheating, plagiarism, and other
            forms of academic misconduct as defined in the DLSU Student Handbook.
          </span>
        </div>
      </div>
    </ModalShell>
  );
};

export const GPACalculationModal = ({ isOpen, onClose }: InstructionModalProps) => {
  const definitions = [
    ['Grade', 'Numerical grade (4.0, 3.5, 3.0, etc.)'],
    ['Units', 'Number of units for each course'],
    ['Total Units', 'Sum of all course units'],
  ];

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="How GPA is Calculated" icon={<BookOpen size={18} className="text-dlsu-green" />}>
      <div className="space-y-4">
        <p className="text-sm text-gray-300">
          GPA is calculated using the following formula:
        </p>
        <div className="bg-[#162019] p-4 rounded-lg border border-[#1E2B24]">
          <p className="font-mono text-sm text-gray-200 font-medium text-center">
            GPA = Σ(Grade × Units) ÷ Total Units
          </p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-200">Where:</p>
          {definitions.map(([label, desc]) => (
            <div key={label} className="flex items-start gap-2 text-sm text-gray-300">
              {BULLET_DOT}
              <span>
                <strong>{label}:</strong> {desc}
              </span>
            </div>
          ))}
        </div>
        <div className="alert alert-warning" role="alert">
          <span>
            <strong>Note:</strong>{' '}
            <strong>Non-Academic Subjects (NAS)</strong> are{' '}
            <u>not</u> included in GPA calculations, but are considered for Dean{"'"}s List eligibility.
          </span>
        </div>
      </div>
    </ModalShell>
  );
};
