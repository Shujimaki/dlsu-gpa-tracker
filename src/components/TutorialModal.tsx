import { X, Calculator, Award, TrendingUp, Target, Save } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal = ({ isOpen, onClose }: TutorialModalProps) => {
  if (!isOpen) return null;

  const sections = [
    {
      id: 'gpa-calculator',
      title: 'GPA Calculator',
      icon: Calculator,
      color: 'bg-emerald-50 text-emerald-600',
      content: [
        'Enter your courses, units, and grades to calculate your term GPA.',
        'Use the NAS (Non-Academic Subject) checkbox for subjects that don\'t count toward your GPA.',
        'Your data is saved automatically when logged in.',
      ],
    },
    {
      id: 'grade-calculator',
      title: 'Grade Calculator',
      icon: Award,
      color: 'bg-amber-50 text-amber-600',
      content: [
        'Calculate your final grade based on assessment components.',
        'Choose from preset passing grades (50% to 70%).',
        'Add and remove components as needed.',
      ],
    },
    {
      id: 'cgpa-calculator',
      title: 'CGPA Calculator',
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600',
      content: [
        'View all your terms at once to see your cumulative GPA.',
        'Click the edit button to modify any term.',
        'Terms are organized by year for easier viewing.',
      ],
    },
    {
      id: 'cgpa-projections',
      title: 'CGPA Projections',
      icon: Target,
      color: 'bg-purple-50 text-purple-600',
      content: [
        'Simulate future terms to see how they affect your CGPA.',
        'Helpful for planning what grades you need to reach your target CGPA.',
      ],
    },
    {
      id: 'saving-data',
      title: 'Saving Your Data',
      icon: Save,
      color: 'bg-slate-50 text-slate-600',
      content: [
        'Create an account to save your data across devices.',
        'Without logging in, your data is only saved in this browser session.',
        'Closing the page or browser will lose unsaved data.',
      ],
    },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel max-w-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-display font-semibold text-base text-dlsu-slate">How to Use Greendex</h2>
          <button
            onClick={onClose}
            className="btn-icon btn-ghost rounded-lg p-1.5 text-gray-400 hover:text-gray-600"
            aria-label="Close tutorial"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[65vh]">
          <div className="space-y-5">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <section key={section.id} aria-labelledby={section.id}>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${section.color}`}>
                      <Icon size={15} />
                    </div>
                    <h3 id={section.id} className="font-display font-semibold text-sm text-dlsu-slate">
                      {section.title}
                    </h3>
                  </div>
                  <ul className="space-y-1.5 ml-[2.375rem]">
                    {section.content.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-500">
                        <div className="w-1 h-1 rounded-full bg-gray-300 mt-2 flex-shrink-0"></div>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;