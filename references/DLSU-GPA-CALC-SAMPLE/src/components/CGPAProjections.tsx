import React, { useEffect, useState } from 'react';
interface CGPAProjectionsProps {
  cgpaData: {
    cgpa: number;
    totalUnits: number;
  };
}
const CGPAProjections = ({
  cgpaData
}: CGPAProjectionsProps) => {
  const [currentCGPA, setCurrentCGPA] = useState(cgpaData.cgpa || 3.418);
  const [targetCGPA, setTargetCGPA] = useState(3.4);
  const [unitsEarned, setUnitsEarned] = useState(cgpaData.totalUnits || 107);
  const [unitsRemaining, setUnitsRemaining] = useState(93);
  const [useCalculatedData, setUseCalculatedData] = useState(false);
  useEffect(() => {
    if (useCalculatedData && cgpaData.cgpa > 0) {
      setCurrentCGPA(cgpaData.cgpa);
      setUnitsEarned(cgpaData.totalUnits);
    }
  }, [cgpaData, useCalculatedData]);
  const calculateRequiredGPA = () => {
    if (unitsRemaining <= 0) return 0;
    const totalUnits = unitsEarned + unitsRemaining;
    const targetTotalPoints = targetCGPA * totalUnits;
    const currentPoints = currentCGPA * unitsEarned;
    const requiredPoints = targetTotalPoints - currentPoints;
    const requiredGPA = requiredPoints / unitsRemaining;
    return requiredGPA;
  };
  const requiredGPA = calculateRequiredGPA();
  const isAchievable = requiredGPA <= 4.0;
  return <div>
      <div className="mb-6">
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={useCalculatedData} onChange={e => setUseCalculatedData(e.target.checked)} className="rounded border-gray-300 text-[#006f51] focus:ring-[#006f51]" />
          <span className="text-sm text-gray-700">
            Use data from CGPA Calculator
          </span>
        </label>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-[#006f51] mb-4">
            Current Status
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CGPA as of the Current Term
              </label>
              <input type="number" value={currentCGPA} onChange={e => setCurrentCGPA(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-gray-300 rounded" step="0.001" min="0" max="4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Number of Units Earned
              </label>
              <input type="number" value={unitsEarned} onChange={e => setUnitsEarned(parseInt(e.target.value) || 0)} className="w-full p-2 border border-gray-300 rounded" min="0" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-[#006f51] mb-4">Target</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Final CGPA
              </label>
              <input type="number" value={targetCGPA} onChange={e => setTargetCGPA(parseFloat(e.target.value) || 0)} className="w-full p-2 border border-gray-300 rounded" step="0.001" min="0" max="4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Units Remaining
              </label>
              <input type="number" value={unitsRemaining} onChange={e => setUnitsRemaining(parseInt(e.target.value) || 0)} className="w-full p-2 border border-gray-300 rounded" min="0" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 bg-gray-100 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Results</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-medium">
              GPA Needed for the Rest of Your Stay in DLSU
            </div>
            <div className="text-sm text-gray-600 mt-1">
              To achieve your target CGPA of {targetCGPA.toFixed(3)}
            </div>
          </div>
          <div className={`text-2xl font-bold px-6 py-3 rounded-lg ${isAchievable ? 'bg-[#006f51] text-white' : 'bg-red-100 text-red-800'}`}>
            {requiredGPA <= 0 ? '0.000' : requiredGPA > 4 ? '> 4.000' : requiredGPA.toFixed(3)}
          </div>
        </div>
        {!isAchievable && <div className="mt-4 text-red-600 bg-red-50 p-3 rounded border border-red-200">
            <p>
              <strong>Not achievable:</strong> The required GPA exceeds the
              maximum possible GPA of 4.0. Consider adjusting your target CGPA
              or taking more units.
            </p>
          </div>}
        {targetCGPA < currentCGPA && <div className="mt-4 text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
            <p>
              <strong>Note:</strong> Your target CGPA is lower than your current
              CGPA. You can achieve this target with any passing grades.
            </p>
          </div>}
      </div>
    </div>;
};
export default CGPAProjections;