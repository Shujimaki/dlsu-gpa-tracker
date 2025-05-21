import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from 'lucide-react';
interface GradeCategory {
  id: number;
  name: string;
  weight: number;
  percentage: number;
}
const GradeCalculator = () => {
  const [passingGrade, setPassingGrade] = useState(70);
  const [categories, setCategories] = useState<GradeCategory[]>([{
    id: 1,
    name: 'Quizzes',
    weight: 20,
    percentage: 0
  }, {
    id: 2,
    name: 'Assignments',
    weight: 30,
    percentage: 0
  }, {
    id: 3,
    name: 'Midterm',
    weight: 20,
    percentage: 0
  }, {
    id: 4,
    name: 'Final Exam',
    weight: 30,
    percentage: 0
  }]);
  const [nextId, setNextId] = useState(5);
  const addCategory = () => {
    setCategories([...categories, {
      id: nextId,
      name: '',
      weight: 0,
      percentage: 0
    }]);
    setNextId(nextId + 1);
  };
  const removeCategory = (id: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter(category => category.id !== id));
    }
  };
  const updateCategory = (id: number, field: string, value: string | number) => {
    setCategories(categories.map(category => category.id === id ? {
      ...category,
      [field]: field === 'weight' || field === 'percentage' ? parseFloat(value as string) || 0 : value
    } : category));
  };
  const totalWeight = categories.reduce((sum, category) => sum + category.weight, 0);
  const calculateFinalGrade = () => {
    let finalGrade = 0;
    categories.forEach(category => {
      finalGrade += category.weight / 100 * category.percentage;
    });
    return finalGrade.toFixed(2);
  };
  const finalGrade = calculateFinalGrade();
  const letterGradeMap: {
    [key: string]: number;
  } = {
    'A+': 4.0,
    A: 4.0,
    'A-': 3.7,
    'B+': 3.3,
    B: 3.0,
    'B-': 2.7,
    'C+': 2.3,
    C: 2.0,
    'C-': 1.7,
    'D+': 1.3,
    D: 1.0,
    F: 0.0
  };
  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 93) return 'A';
    if (percentage >= 90) return 'A-';
    if (percentage >= 87) return 'B+';
    if (percentage >= 83) return 'B';
    if (percentage >= 80) return 'B-';
    if (percentage >= 77) return 'C+';
    if (percentage >= 73) return 'C';
    if (percentage >= 70) return 'C-';
    if (percentage >= 67) return 'D+';
    if (percentage >= 60) return 'D';
    return 'F';
  };
  const getNumericGrade = (percentage: number): number => {
    const letterGrade = getLetterGrade(percentage);
    return letterGradeMap[letterGrade] || 0;
  };
  const renderGradeRange = () => {
    const ranges = [{
      grade: 'A',
      min: 93,
      max: 100,
      gpa: 4.0
    }, {
      grade: 'A-',
      min: 90,
      max: 92.99,
      gpa: 3.7
    }, {
      grade: 'B+',
      min: 87,
      max: 89.99,
      gpa: 3.3
    }, {
      grade: 'B',
      min: 83,
      max: 86.99,
      gpa: 3.0
    }, {
      grade: 'B-',
      min: 80,
      max: 82.99,
      gpa: 2.7
    }, {
      grade: 'C+',
      min: 77,
      max: 79.99,
      gpa: 2.3
    }, {
      grade: 'C',
      min: 73,
      max: 76.99,
      gpa: 2.0
    }, {
      grade: 'C-',
      min: 70,
      max: 72.99,
      gpa: 1.7
    }, {
      grade: 'D+',
      min: 67,
      max: 69.99,
      gpa: 1.3
    }, {
      grade: 'D',
      min: 60,
      max: 66.99,
      gpa: 1.0
    }, {
      grade: 'F',
      min: 0,
      max: 59.99,
      gpa: 0.0
    }];
    return <div className="hidden md:block md:w-64 md:ml-6">
        <h3 className="text-lg font-semibold mb-3">Grade Scale</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="space-y-2">
            {ranges.map(range => <div key={range.grade} className={`flex justify-between items-center p-2 rounded ${parseFloat(finalGrade) >= range.min && parseFloat(finalGrade) <= range.max ? 'bg-[#006f51] text-white' : ''}`}>
                <span className="font-medium">{range.grade}</span>
                <span className="text-sm">
                  {range.min}-{range.max}%
                </span>
                <span className="text-sm">{range.gpa.toFixed(1)}</span>
              </div>)}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Passing Grade:</span>
                <span>{passingGrade}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>;
  };
  return <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#006f51] mb-4">
          Grade Calculator v1.04
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Calculate your final grade based on weighted categories.
        </p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Passing Grade:
          </label>
          <input type="number" value={passingGrade} onChange={e => setPassingGrade(parseFloat(e.target.value) || 0)} className="w-24 p-2 border border-gray-300 rounded" min="0" max="100" />
        </div>
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="flex-1">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#00a651] text-white">
                  <th className="px-4 py-2 text-left">Category</th>
                  <th className="px-4 py-2 text-center">Weight (%)</th>
                  <th className="px-4 py-2 text-center">Your Percentage</th>
                  <th className="px-4 py-2 text-center">Final Percentage</th>
                  <th className="px-4 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map(category => <tr key={category.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <input type="text" value={category.name} onChange={e => updateCategory(category.id, 'name', e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="e.g., Quizzes" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={category.weight} onChange={e => updateCategory(category.id, 'weight', e.target.value)} className="w-full p-2 border border-gray-300 rounded" min="0" max="100" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" value={category.percentage} onChange={e => updateCategory(category.id, 'percentage', e.target.value)} className="w-full p-2 border border-gray-300 rounded" min="0" max="100" />
                    </td>
                    <td className="px-4 py-2 text-center">
                      {(category.weight / 100 * category.percentage).toFixed(2)}
                      %
                    </td>
                    <td className="px-4 py-2">
                      <button onClick={() => removeCategory(category.id)} className="p-1 text-red-500 hover:text-red-700 rounded">
                        <TrashIcon size={18} />
                      </button>
                    </td>
                  </tr>)}
              </tbody>
              <tfoot>
                <tr className={`border-t-2 border-gray-300 font-medium ${totalWeight !== 100 ? 'text-red-500' : ''}`}>
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-center">{totalWeight}%</td>
                  <td></td>
                  <td className="px-4 py-2 text-center">{finalGrade}%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        {renderGradeRange()}
      </div>
      {totalWeight !== 100 && <div className="mt-2 text-red-500 text-sm">
          Warning: Category weights should add up to 100%
        </div>}
      <div className="mt-4 flex justify-between items-center">
        <button onClick={addCategory} className="flex items-center px-4 py-2 bg-[#00a651] text-white rounded hover:bg-[#008f45] transition-colors">
          <PlusIcon size={18} className="mr-1" />
          Add Category
        </button>
        <div className="text-right">
          <div className="text-lg font-bold">
            Grade:{' '}
            <span className="text-xl">
              {getNumericGrade(parseFloat(finalGrade))}
            </span>
            <span className="ml-2 text-gray-600">
              ({getLetterGrade(parseFloat(finalGrade))})
            </span>
          </div>
          <div className={`text-sm ${parseFloat(finalGrade) >= passingGrade ? 'text-green-600' : 'text-red-600'}`}>
            {parseFloat(finalGrade) >= passingGrade ? 'Passing' : 'Not Passing'}
          </div>
        </div>
      </div>
    </div>;
};
export default GradeCalculator;