import { X, TrendingUp, Calculator, Award, Save } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal = ({ isOpen, onClose }: TutorialModalProps) => {
  // Don't render anything if not open
  if (!isOpen) return null;
  
  const sections = [
    {
      id: 'gpa-calculator',
      title: 'GPA Calculator',
      icon: Calculator,
      content: [
        'Enter your courses, units, and grades to calculate your term GPA.',
        'Use the NAS (Non-Academic Subject) checkbox for subjects that don\'t count toward your GPA.',
        'Your data is saved automatically when logged in.'
      ]
    },
    {
      id: 'grade-calculator',
      title: 'Grade Calculator',
      icon: Award,
      content: [
        'Calculate your final grade based on assessment components.',
        'Choose from preset passing grades (50% to 70%).',
        'Add and remove components as needed.'
      ]
    },
    {
      id: 'cgpa-calculator',
      title: 'CGPA Calculator',
      icon: TrendingUp,
      content: [
        'View all your terms at once to see your cumulative GPA.',
        'Click the edit button to modify any term.',
        'Terms are organized by year for easier viewing.'
      ]
    },
    {
      id: 'cgpa-projections',
      title: 'CGPA Projections',
      icon: TrendingUp,
      content: [
        'Simulate future terms to see how they affect your CGPA.',
        'Helpful for planning what grades you need to reach your target CGPA.'
      ]
    },
    {
      id: 'saving-data',
      title: 'Saving Your Data',
      icon: Save,
      content: [
        'Create an account to save your data across devices.',
        'Without logging in, your data is only saved in this browser session.',
        'Closing the page or browser will lose unsaved data.'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-md max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-base font-medium text-gray-900">How to Use Greendex</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close tutorial"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          <div className="space-y-5">
            {sections.map((section) => (
              <section key={section.id} aria-labelledby={section.id}>
                <div className="flex items-center mb-1.5">
                  <section.icon className="w-4 h-4 text-dlsu-green mr-2" />
                  <h3 id={section.id} className="text-sm font-medium text-gray-900">
                    {section.title}
                  </h3>
                </div>
                <ul className="text-xs text-gray-600 space-y-1 ml-6">
                  {section.content.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-dlsu-green mr-2">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-dlsu-green text-white text-sm rounded hover:bg-dlsu-dark-green transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal; 