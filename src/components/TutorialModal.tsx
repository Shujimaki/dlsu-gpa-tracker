import { X, BookOpen, TrendingUp, Calculator, Award, Save } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TutorialModal = ({ isOpen, onClose }: TutorialModalProps) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: "GPA Calculator",
      icon: Calculator,
      id: "gpa-calculator",
      content: [
        "Input grades for each term to see your term GPA and Dean's List status.",
        "Use 'Select Term' to switch between terms or 'Add New Term' (up to 21).",
        "Click 'Add Course' to add subjects. Enter code, name (optional), units, and grade.",
        "Mark 'Non-Academic Subject' (NAS) if needed; these affect Dean's List but not GPA.",
        "Check 'Flowchart exempts...' if your course load is below 12 units but still eligible for Dean's List.",
        "To print term grades: Click 'Print Grades' at the bottom of the GPA Calculator tab.",
      ],
    },
    {
      title: "CGPA Calculator",
      icon: Award,
      id: "cgpa-calculator",
      content: [
        "View your Cumulative Grade Point Average (CGPA) across all terms.",
        "Terms are grouped by academic year (3 terms per year).",
        "Each term card shows the term GPA, total academic units, and a summary of courses.",
        "Click the pencil icon (Edit) on a term card to jump directly to that term in the GPA Calculator.",
        "If applicable to you, enter your 'Credited Units' from a previous school or degree. These are added to your total earned units but do not affect CGPA calculation within this app.",
        "Click 'View CGPA Projections' to plan for your future CGPA.",
      ],
    },
    {
      title: "CGPA Projections",
      icon: TrendingUp,
      id: "cgpa-projections",
      content: [
        "Plan how to achieve your target CGPA.",
        "Your current CGPA and earned units are automatically pulled from the CGPA Calculator.",
        "Enter your 'Target CGPA' (e.g., 3.4 for Cum Laude).",
        "Enter the 'Total Units to Graduate' according to your flowchart.",
        "The tool will calculate the GPA you need to achieve in your remaining units.",
        "If the required GPA is above 4.0, it will indicate 'Not achievable'.",
      ],
    },
    {
      title: "Grade Calculator",
      icon: BookOpen,
      id: "grade-calculator",
      content: [
        "Calculate final subject grades based on weighted components.",
        "Manage up to 8 subjects. Click 'Add Subject'.",
        "For each subject, add up to 8 weighted categories (e.g., Exams, Quizzes).",
        "Enter your score and total possible score for each item in a category.",
        "View raw percentage and final transmuted grade (default 50% passing).",
        "Adjust 'Passing Percentage' if your subject has a different threshold (e.g., 60%).",
      ],
    },
     {
      title: "Data Saving & Printing",
      icon: Save,
      id: "data-saving-printing",
      content: [
        "Anonymous Users: Data saves temporarily to your browser. It's lost if you close browser/tab. A warning appears if you have unsaved data.",
        "Logged-in Users: Data saves securely to your account (Google Firebase) and syncs across devices.",
        "Migration: If you use the app anonymously then log in, data for the current GPA Calculator term may migrate to your account if no cloud data exists for that term.",
        "Printing Grades (GPA Tab): In the GPA Calculator, use the 'Print Grades' button to generate a printable summary of the current term's grades.",
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-dlsu-green">How to Use Greendex</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            aria-label="Close tutorial"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id}>
              <div className="flex items-center mb-2">
                <section.icon className="w-6 h-6 text-dlsu-green mr-2" />
                <h3 id={section.id} className="text-lg font-semibold text-dlsu-green">
                  {section.title}
                </h3>
              </div>
              <ul className="list-disc list-inside space-y-1 text-gray-700 pl-2">
                {section.content.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="bg-dlsu-green text-white px-4 py-2 rounded hover:bg-dlsu-dark-green transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal; 