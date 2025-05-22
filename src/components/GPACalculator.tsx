import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, InfoIcon } from 'lucide-react';
import type { Course } from '../types';

// Helper to ensure loaded courses have 'nas' property
function ensureCoursesWithNAS(courses: unknown[]): Course[] {
  return courses.map((c) => {
    const course = c as Record<string, unknown>;
    return {
      id: course.id as string,
      code: course.code as string,
      name: course.name as string,
      units: course.units as number,
      grade: course.grade as number,
      nas: typeof course.nas === 'boolean' ? course.nas : false,
    };
  });
}

const GPACalculator = () => {
  const defaultCourse: Course = {
    id: crypto.randomUUID(),
    code: '',
    name: '',
    units: 3,
    grade: 0,
    nas: false,
  };
  const [courses, setCourses] = useState<Course[]>([defaultCourse]);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [maxTerm, setMaxTerm] = useState(12);
  const [showDeansListModal, setShowDeansListModal] = useState(false);
  const [showGPAModal, setShowGPAModal] = useState(false);

  // Load saved data when term changes
  useEffect(() => {
    const savedData = localStorage.getItem(`term_${selectedTerm}`);
    if (savedData) {
      setCourses(ensureCoursesWithNAS(JSON.parse(savedData)));
    } else {
      setCourses([{
        id: crypto.randomUUID(),
        code: '',
        name: '',
        units: 3,
        grade: 0,
        nas: false,
      }]);
    }
  }, [selectedTerm]);

  // Save data when courses change
  useEffect(() => {
    localStorage.setItem(`term_${selectedTerm}`, JSON.stringify(courses));
  }, [courses, selectedTerm]);

  const addCourse = () => {
    setCourses([...courses, {
      id: crypto.randomUUID(),
      code: '',
      name: '',
      units: 3,
      grade: 0,
      nas: false,
    }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter((course: Course) => course.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: string | number | boolean) => {
    setCourses(courses.map((course: Course) =>
      course.id === id ? { ...course, [field]: value } : course
    ));
  };

  const calculateGPA = () => {
    let totalUnits = 0;
    let totalGradePoints = 0;
    courses.forEach((course: Course) => {
      if (!course.nas && course.units !== 0 && course.grade !== undefined && course.grade !== null) {
        totalUnits += course.units;
        totalGradePoints += course.units * course.grade;
      }
    });
    return totalUnits === 0 ? 0 : Number((totalGradePoints / totalUnits).toFixed(3));
  };

  const addNewTerm = () => {
    setMaxTerm((prev: number) => prev + 1);
    setSelectedTerm(maxTerm + 1);
    setCourses([{
      id: crypto.randomUUID(),
      code: '',
      name: '',
      units: 3,
      grade: 0,
      nas: false,
    }]);
  };

  const totalAcademicUnits = courses.filter((c: Course) => !c.nas).reduce((sum: number, c: Course) => sum + (c.units || 0), 0);
  const totalNASUnits = courses.filter((c: Course) => c.nas).reduce((sum: number, c: Course) => sum + (c.units || 0), 0);
  const gpa = calculateGPA();
  const hasGradeBelow2 = courses.some(course => !course.nas && course.grade < 2.0 && course.grade >= 0);
  const isDeansLister = (totalAcademicUnits >= 12) && gpa >= 3.0 && !hasGradeBelow2;
  const isFirstHonors = (totalAcademicUnits >= 12) && gpa >= 3.4 && !hasGradeBelow2;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-dlsu-green mb-4">
          GPA Calculator
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your courses, units, and grades to calculate your GPA.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setShowDeansListModal(true)}
            className="text-sm text-dlsu-green hover:text-dlsu-light-green flex items-center gap-1"
          >
            <InfoIcon size={16} />
            Dean's List Rules
          </button>
          <button
            onClick={() => setShowGPAModal(true)}
            className="text-sm text-dlsu-green hover:text-dlsu-light-green flex items-center gap-1"
          >
            <InfoIcon size={16} />
            How GPA is Calculated
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Term
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'add') {
                addNewTerm();
              } else {
                setSelectedTerm(Number(value));
              }
            }}
            className="w-full md:w-48 p-2 border border-gray-300 rounded"
          >
            {Array.from({ length: maxTerm }, (_, i) => i + 1).map((term) => (
              <option key={term} value={term}>
                Term {term}
              </option>
            ))}
            <option value="add" className="text-dlsu-green font-medium">
              + Add Extra Term
            </option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto relative">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-dlsu-light-green text-white">
              <th className="px-4 py-2 text-left">Course Code</th>
              <th className="px-4 py-2 text-left">Course Name (Optional)</th>
              <th className="px-4 py-2 text-center min-w-[80px]">Units</th>
              <th className="px-4 py-2 text-center min-w-[80px]">Grade</th>
              <th className="px-4 py-2 text-center">Non-Academic Subject <span title='What is this?'>?</span></th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.id} className="border-b border-gray-200 hover:bg-gray-50 md:align-middle bg-white md:bg-transparent">
                <td className="px-4 py-3 align-middle min-w-[110px] flex-shrink-0">
                  <input
                    type="text"
                    value={course.code}
                    onChange={(e) => updateCourse(course.id, 'code', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-base min-w-[110px] flex-shrink-0"
                    maxLength={7}
                    placeholder="e.g., NUMMETS"
                  />
                </td>
                <td className="px-4 py-3 align-middle">
                  <input
                    type="text"
                    value={course.name}
                    onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded text-base"
                    placeholder="e.g., Numerical Methods"
                  />
                </td>
                <td className="px-4 py-3 align-middle min-w-[80px]">
                  <select
                    value={course.units}
                    onChange={e => updateCourse(course.id, 'units', Number(e.target.value))}
                    className="w-full p-2 pr-8 border border-gray-300 rounded text-base min-w-[80px]"
                  >
                    {course.nas
                      ? [0, 1, 2, 3].map(units => (
                          <option key={units} value={units}>
                            ({units})
                          </option>
                        ))
                      : [1, 2, 3, 4, 5].map(units => (
                          <option key={units} value={units}>
                            {units}
                          </option>
                        ))}
                  </select>
                </td>
                <td className="px-4 py-3 align-middle min-w-[80px]">
                  {course.nas && course.units === 0 ? (
                    <select
                      value={course.grade === 1 ? 'P' : 'F'}
                      onChange={e => updateCourse(course.id, 'grade', e.target.value === 'P' ? 1 : 0)}
                      className="w-full p-2 pr-8 border border-gray-300 rounded text-base min-w-[80px]"
                    >
                      <option value="P">P</option>
                      <option value="F">F</option>
                    </select>
                  ) : (
                    <select
                      value={course.grade}
                      onChange={e => updateCourse(course.id, 'grade', Number(e.target.value))}
                      className="w-full p-2 pr-8 border border-gray-300 rounded text-base min-w-[80px]"
                    >
                      {[4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.0].map(grade => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex justify-center items-center">
                    <input
                      type="checkbox"
                      checked={course.nas}
                      onChange={e => updateCourse(course.id, 'nas', e.target.checked)}
                      className="accent-dlsu-green"
                      aria-label="Non-Academic Subject"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 align-middle">
                  <button
                    onClick={() => removeCourse(course.id)}
                    className="p-2 text-red-500 hover:text-red-700 rounded"
                  >
                    <TrashIcon size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-medium">
              <td className="px-4 py-2">Total Units</td>
              <td></td>
              <td className="px-4 py-2 text-center" colSpan={1}>
                {totalAcademicUnits}
                {totalNASUnits > 0 && (
                  <span className="text-gray-500"> ({totalNASUnits})</span>
                )}
              </td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={addCourse}
          className="flex items-center px-4 py-2 bg-dlsu-light-green text-white rounded hover:bg-dlsu-green transition-colors"
        >
          <PlusIcon size={18} className="mr-1" />
          Add Course
        </button>
        <div className="text-right">
          <div className="text-lg font-bold">
            GPA: <span className="text-xl">{gpa}</span>
          </div>
          {isFirstHonors && (
            <div className="text-sm text-dlsu-green">
              First Honors Dean's Lister
            </div>
          )}
          {isDeansLister && !isFirstHonors && (
            <div className="text-sm text-dlsu-green">
              Second Honors Dean's Lister
            </div>
          )}
        </div>
      </div>

      {/* Dean's List Modal */}
      {showDeansListModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-bold mb-4">Dean's List Requirements</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>Must be enrolled in at least 12 academic units</li>
              <li>No grade below 2.0 in any subject</li>
              <li>First Honors: GPA of 3.4 or higher</li>
              <li>Second Honors: GPA of 3.0 to 3.39</li>
            </ul>
            <button
              onClick={() => setShowDeansListModal(false)}
              className="mt-4 px-4 py-2 bg-dlsu-green text-white rounded hover:bg-dlsu-light-green"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* GPA Calculation Modal */}
      {showGPAModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md">
            <h3 className="text-lg font-bold mb-4">How GPA is Calculated</h3>
            <p className="mb-4">GPA is calculated using the following formula:</p>
            <div className="bg-gray-50 p-4 rounded mb-4">
              <p className="font-mono">GPA = Σ(Grade × Units) ÷ Total Units</p>
            </div>
            <p className="mb-4">Where:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Grade: Numerical grade (4.0, 3.5, 3.0, etc.)</li>
              <li>Units: Number of units for each course</li>
              <li>Total Units: Sum of all course units</li>
            </ul>
            <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
              <strong>Note:</strong> Non-Academic Subjects (NAS) are <u>not</u> included in GPA calculations, but are considered for Dean's List eligibility.
            </div>
            <button
              onClick={() => setShowGPAModal(false)}
              className="mt-4 px-4 py-2 bg-dlsu-green text-white rounded hover:bg-dlsu-light-green"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPACalculator; 