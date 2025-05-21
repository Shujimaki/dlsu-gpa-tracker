import React, { useEffect, useState } from 'react';
import { PlusIcon, TrashIcon } from 'lucide-react';
interface Term {
  id: number;
  name: string;
  courses: Course[];
}
interface Course {
  id: number;
  code: string;
  units: number;
  grade: number;
}
interface CGPACalculatorProps {
  onUpdate: (cgpa: number, totalUnits: number) => void;
}
const CGPACalculator = ({
  onUpdate
}: CGPACalculatorProps) => {
  const [terms, setTerms] = useState<Term[]>([{
    id: 1,
    name: '1st Term',
    courses: [{
      id: 1,
      code: '',
      units: 3.0,
      grade: 0
    }]
  }]);
  const [nextTermId, setNextTermId] = useState(2);
  const [nextCourseId, setNextCourseId] = useState(2);
  const addTerm = () => {
    setTerms([...terms, {
      id: nextTermId,
      name: `Term ${nextTermId}`,
      courses: [{
        id: nextCourseId,
        code: '',
        units: 3.0,
        grade: 0
      }]
    }]);
    setNextTermId(nextTermId + 1);
    setNextCourseId(nextCourseId + 1);
  };
  const removeTerm = (termId: number) => {
    if (terms.length > 1) {
      setTerms(terms.filter(term => term.id !== termId));
    }
  };
  const addCourse = (termId: number) => {
    setTerms(terms.map(term => {
      if (term.id === termId) {
        return {
          ...term,
          courses: [...term.courses, {
            id: nextCourseId,
            code: '',
            units: 3.0,
            grade: 0
          }]
        };
      }
      return term;
    }));
    setNextCourseId(nextCourseId + 1);
  };
  const removeCourse = (termId: number, courseId: number) => {
    setTerms(terms.map(term => {
      if (term.id === termId && term.courses.length > 1) {
        return {
          ...term,
          courses: term.courses.filter(course => course.id !== courseId)
        };
      }
      return term;
    }));
  };
  const updateTerm = (termId: number, field: string, value: string) => {
    setTerms(terms.map(term => term.id === termId ? {
      ...term,
      [field]: value
    } : term));
  };
  const updateCourse = (termId: number, courseId: number, field: string, value: string | number) => {
    setTerms(terms.map(term => {
      if (term.id === termId) {
        return {
          ...term,
          courses: term.courses.map(course => course.id === courseId ? {
            ...course,
            [field]: value
          } : course)
        };
      }
      return term;
    }));
  };
  const calculateTermGPA = (courses: Course[]) => {
    let totalUnits = 0;
    let totalGradePoints = 0;
    courses.forEach(course => {
      if (course.units && course.grade) {
        totalUnits += course.units;
        totalGradePoints += course.units * course.grade;
      }
    });
    if (totalUnits === 0) return 0;
    return totalGradePoints / totalUnits;
  };
  const calculateCGPA = () => {
    let totalUnits = 0;
    let totalGradePoints = 0;
    terms.forEach(term => {
      term.courses.forEach(course => {
        if (course.units && course.grade) {
          totalUnits += course.units;
          totalGradePoints += course.units * course.grade;
        }
      });
    });
    if (totalUnits === 0) return 0;
    return totalGradePoints / totalUnits;
  };
  const calculateTermUnits = (courses: Course[]) => {
    return courses.reduce((sum, course) => sum + (course.units || 0), 0);
  };
  const cgpa = calculateCGPA();
  const totalUnits = terms.reduce((sum, term) => sum + term.courses.reduce((courseSum, course) => courseSum + (course.units || 0), 0), 0);
  // Update parent component whenever CGPA changes
  useEffect(() => {
    onUpdate(cgpa, totalUnits);
  }, [cgpa, totalUnits, onUpdate]);
  return <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#006f51] mb-4">
          Cumulative Grade Point Average (CGPA) Calculator v1.01
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Track your grades across multiple terms to calculate your CGPA.
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Do not include non-academic subjects (e.g.,
            PERSEF, NSTP, etc.). For subjects taken during summer, just place
            them under 3rd Term.
          </p>
        </div>
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">CGPA</h3>
            <div className="bg-[#006f51] text-white px-4 py-2 rounded font-bold text-xl">
              {cgpa.toFixed(3)}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Total Units: {totalUnits.toFixed(1)}
          </div>
        </div>
      </div>
      {terms.map(term => <div key={term.id} className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 p-4 flex justify-between items-center">
            <div className="flex items-center">
              <input type="text" value={term.name} onChange={e => updateTerm(term.id, 'name', e.target.value)} className="font-bold text-lg bg-transparent border-b border-gray-300 focus:border-[#006f51] focus:outline-none" />
            </div>
            {terms.length > 1 && <button onClick={() => removeTerm(term.id)} className="text-red-500 hover:text-red-700">
                <TrashIcon size={18} />
              </button>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#00a651] text-white">
                  <th className="px-4 py-2 text-left">Subject Code</th>
                  <th className="px-4 py-2 text-center">No. of Units</th>
                  <th className="px-4 py-2 text-center">Grade</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {term.courses.map(course => <tr key={course.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input type="text" value={course.code} onChange={e => updateCourse(term.id, course.id, 'code', e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="e.g., BASMATH" />
                    </td>
                    <td className="px-4 py-2">
                      <select value={course.units} onChange={e => updateCourse(term.id, course.id, 'units', parseFloat(e.target.value))} className="w-full p-2 border border-gray-300 rounded">
                        <option value={0}>0.0</option>
                        <option value={1}>1.0</option>
                        <option value={2}>2.0</option>
                        <option value={3}>3.0</option>
                        <option value={4}>4.0</option>
                        <option value={5}>5.0</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <select value={course.grade} onChange={e => updateCourse(term.id, course.id, 'grade', parseFloat(e.target.value))} className="w-full p-2 border border-gray-300 rounded">
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
                      <button onClick={() => removeCourse(term.id, course.id)} className="p-1 text-red-500 hover:text-red-700 rounded">
                        <TrashIcon size={18} />
                      </button>
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-100 p-4 flex justify-between items-center">
            <button onClick={() => addCourse(term.id)} className="flex items-center px-3 py-1 text-sm bg-[#00a651] text-white rounded hover:bg-[#008f45] transition-colors">
              <PlusIcon size={16} className="mr-1" />
              Add Course
            </button>
            <div className="text-right">
              <div className="text-sm">
                Total Units: {calculateTermUnits(term.courses).toFixed(1)}
              </div>
              <div className="font-bold">
                GPA: {calculateTermGPA(term.courses).toFixed(3)}
              </div>
            </div>
          </div>
        </div>)}
      <div className="mt-4">
        <button onClick={addTerm} className="flex items-center px-4 py-2 bg-[#006f51] text-white rounded hover:bg-[#005a42] transition-colors">
          <PlusIcon size={18} className="mr-1" />
          Add Term
        </button>
      </div>
    </div>;
};
export default CGPACalculator;