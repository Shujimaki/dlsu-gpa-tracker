import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon } from 'lucide-react';
import type { User, Course, Grade, Units } from '../types';

interface GPACalculatorProps {
  user: User | null;
}

const GPACalculator = ({ user }: GPACalculatorProps) => {
  const [courses, setCourses] = useState<Course[]>([{
    id: crypto.randomUUID(),
    code: '',
    name: '',
    units: 3,
    grade: 0
  }]);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [maxTerm, setMaxTerm] = useState(12);

  const addCourse = () => {
    setCourses([...courses, {
      id: crypto.randomUUID(),
      code: '',
      name: '',
      units: 3,
      grade: 0
    }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter(course => course.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: string | number) => {
    setCourses(courses.map(course => 
      course.id === id ? { ...course, [field]: value } : course
    ));
  };

  const calculateGPA = () => {
    let totalUnits = 0;
    let totalGradePoints = 0;

    courses.forEach(course => {
      if (course.units !== 0 && course.grade !== undefined && course.grade !== null) {
        totalUnits += course.units;
        totalGradePoints += course.units * course.grade;
      }
    });

    return totalUnits === 0 ? 0 : Number((totalGradePoints / totalUnits).toFixed(3));
  };

  const addNewTerm = () => {
    setMaxTerm(prev => prev + 1);
    setSelectedTerm(maxTerm + 1);
    setCourses([{
      id: crypto.randomUUID(),
      code: '',
      name: '',
      units: 3,
      grade: 0
    }]);
  };

  const totalUnits = courses.reduce((sum, course) => sum + (course.units || 0), 0);
  const gpa = calculateGPA();

  const hasGradeBelow2 = courses.some(course => course.grade < 2.0 && course.grade >= 0);
  const isDeansLister = totalUnits >= 12 && gpa >= 3.0 && !hasGradeBelow2;
  const isFirstHonors = totalUnits >= 12 && gpa >= 3.4 && !hasGradeBelow2;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-dlsu-green mb-4">
          GPA Calculator
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your courses, units, and grades to calculate your GPA.
        </p>
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-dlsu-light-green text-white">
              <th className="px-4 py-2 text-left">Course Code</th>
              <th className="px-4 py-2 text-left">Course Name (Optional)</th>
              <th className="px-4 py-2 text-center">Units</th>
              <th className="px-4 py-2 text-center">Grade</th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => (
              <tr key={course.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={course.code}
                    onChange={(e) => updateCourse(course.id, 'code', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g., NUMMETS"
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="text"
                    value={course.name}
                    onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g., Numerical Methods"
                  />
                </td>
                <td className="px-4 py-2">
                  <select
                    value={course.units}
                    onChange={(e) => updateCourse(course.id, 'units', Number(e.target.value))}
                    className="w-full p-2 pr-8 border border-gray-300 rounded"
                  >
                    {[1, 2, 3, 4, 5].map((units) => (
                      <option key={units} value={units}>
                        {units}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select
                    value={course.grade}
                    onChange={(e) => updateCourse(course.id, 'grade', Number(e.target.value))}
                    className="w-full p-2 pr-8 border border-gray-300 rounded"
                  >
                    {[4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.0].map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => removeCourse(course.id)}
                    className="p-1 text-red-500 hover:text-red-700 rounded"
                  >
                    <TrashIcon size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-medium">
              <td className="px-4 py-2">Total Units</td>
              <td></td>
              <td className="px-4 py-2 text-center">{totalUnits}</td>
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
    </div>
  );
};

export default GPACalculator; 