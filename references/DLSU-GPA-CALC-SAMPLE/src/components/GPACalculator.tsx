import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from 'lucide-react';
interface Course {
  id: number;
  code: string;
  units: number;
  grade: number;
}
const GPACalculator = () => {
  const [courses, setCourses] = useState<Course[]>([{
    id: 1,
    code: '',
    units: 3.0,
    grade: 0
  }]);
  const [nextId, setNextId] = useState(2);
  const addCourse = () => {
    setCourses([...courses, {
      id: nextId,
      code: '',
      units: 3.0,
      grade: 0
    }]);
    setNextId(nextId + 1);
  };
  const removeCourse = (id: number) => {
    if (courses.length > 1) {
      setCourses(courses.filter(course => course.id !== id));
    }
  };
  const updateCourse = (id: number, field: string, value: string | number) => {
    setCourses(courses.map(course => course.id === id ? {
      ...course,
      [field]: value
    } : course));
  };
  const calculateGPA = () => {
    let totalUnits = 0;
    let totalGradePoints = 0;
    courses.forEach(course => {
      if (course.units && course.grade) {
        totalUnits += course.units;
        totalGradePoints += course.units * course.grade;
      }
    });
    if (totalUnits === 0) return 0;
    return (totalGradePoints / totalUnits).toFixed(3);
  };
  const totalUnits = courses.reduce((sum, course) => sum + (course.units || 0), 0);
  const gpa = calculateGPA();
  return <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#006f51] mb-4">
          GPA Calculator v1.07
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your courses, units, and grades to calculate your GPA.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#00a651] text-white">
              <th className="px-4 py-2 text-left">Course Code</th>
              <th className="px-4 py-2 text-center">Units</th>
              <th className="px-4 py-2 text-center">Grade</th>
              <th className="px-4 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {courses.map(course => <tr key={course.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-2">
                  <input type="text" value={course.code} onChange={e => updateCourse(course.id, 'code', e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="e.g., NUMMRS" />
                </td>
                <td className="px-4 py-2">
                  <select value={course.units} onChange={e => updateCourse(course.id, 'units', parseFloat(e.target.value))} className="w-full p-2 border border-gray-300 rounded">
                    <option value={0}>0.0</option>
                    <option value={1}>1.0</option>
                    <option value={2}>2.0</option>
                    <option value={3}>3.0</option>
                    <option value={4}>4.0</option>
                    <option value={5}>5.0</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <select value={course.grade} onChange={e => updateCourse(course.id, 'grade', parseFloat(e.target.value))} className="w-full p-2 border border-gray-300 rounded">
                    <option value={0}>0.0</option>
                    <option value={1}>1.0</option>
                    <option value={1.5}>1.5</option>
                    <option value={2}>2.0</option>
                    <option value={2.5}>2.5</option>
                    <option value={3}>3.0</option>
                    <option value={3.5}>3.5</option>
                    <option value={4}>4.0</option>
                  </select>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => removeCourse(course.id)} className="p-1 text-red-500 hover:text-red-700 rounded">
                    <TrashIcon size={18} />
                  </button>
                </td>
              </tr>)}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-medium">
              <td className="px-4 py-2">Total Units</td>
              <td className="px-4 py-2 text-center">{totalUnits.toFixed(1)}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <button onClick={addCourse} className="flex items-center px-4 py-2 bg-[#00a651] text-white rounded hover:bg-[#008f45] transition-colors">
          <PlusIcon size={18} className="mr-1" />
          Add Course
        </button>
        <div className="text-right">
          <div className="text-lg font-bold">
            GPA: <span className="text-xl">{gpa}</span>
          </div>
          {parseFloat(gpa) >= 3.4 && <div className="text-sm text-[#00a651]">
              First Honors Dean's Lister
            </div>}
          {parseFloat(gpa) >= 3.0 && parseFloat(gpa) < 3.4 && <div className="text-sm text-[#00a651]">
              Second Honors Dean's Lister
            </div>}
        </div>
      </div>
    </div>;
};
export default GPACalculator;