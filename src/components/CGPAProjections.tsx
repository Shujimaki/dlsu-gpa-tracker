import { useState, useEffect, useMemo } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';


interface CGPAProjectionsProps {
  user?: FirebaseUser | null;
  authInitialized?: boolean;
}

const CGPAProjections = ({}: CGPAProjectionsProps) => {
  // State for user inputs
  const [targetCGPA, setTargetCGPA] = useState<number>(3.5);
  const [totalUnits, setTotalUnits] = useState<number>(180); // Default total units to graduate
  const [totalUnitsInput, setTotalUnitsInput] = useState<string>("180"); // String state for input field
  
  // State for data from CGPA Calculator
  const [currentCGPA, setCurrentCGPA] = useState<number>(0);
  const [earnedUnits, setEarnedUnits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load CGPA data from sessionStorage
  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get CGPA data from session storage
      const cgpaData = sessionStorage.getItem('cgpa_data');
      
      if (cgpaData) {
        const { cgpa, totalUnits } = JSON.parse(cgpaData);
        setCurrentCGPA(parseFloat(cgpa) || 0);
        setEarnedUnits(totalUnits || 0);
      } else {
        // If no data in session storage, set defaults
        setCurrentCGPA(0);
        setEarnedUnits(0);
        setError('No CGPA data found. Please visit the CGPA Calculator tab first.');
      }
    } catch (error) {
      console.error('Error loading CGPA data:', error);
      setError('Failed to load CGPA data. Please visit the CGPA Calculator tab first.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle total units input change
  const handleTotalUnitsChange = (value: string) => {
    setTotalUnitsInput(value);
    
    // Convert to number for calculations
    const numValue = parseInt(value) || 0;
    setTotalUnits(Math.max(0, numValue));
  };

  // Calculate remaining units and projected GPA
  const { remainingUnits, projectedGPA, isAchievable } = useMemo(() => {
    const remaining = Math.max(0, totalUnits - earnedUnits);
    
    // Calculate projected GPA using the formula
    let projected = 0;
    let achievable = false;
    
    if (remaining > 0) {
      projected = (targetCGPA * (earnedUnits + remaining) - currentCGPA * earnedUnits) / remaining;
      // Check if the projected GPA is achievable (between 0.0 and 4.0)
      achievable = projected >= 0 && projected <= 4.0;
    }
    
    return {
      remainingUnits: remaining,
      projectedGPA: projected,
      isAchievable: achievable
    };
  }, [currentCGPA, earnedUnits, targetCGPA, totalUnits]);

  // Format GPA to 3 decimal places
  const formatGPA = (gpa: number): string => {
    return gpa.toFixed(3);
  };

  // Get color class based on projected GPA
  const getGPAColorClass = (gpa: number): string => {
    if (!isAchievable) return 'text-red-600';
    if (gpa >= 3.5) return 'text-green-600';
    if (gpa >= 3.0) return 'text-blue-600';
    if (gpa >= 2.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dlsu-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CGPA Projections Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-dlsu-green mb-4 md:mb-0">CGPA Projections</h2>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'cgpa' }))}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors flex items-center"
          >
            <span className="mr-1">←</span> Back to CGPA Calculator
          </button>
        </div>
        <p className="text-gray-600">
          Calculate the GPA you need to achieve in your remaining terms to reach your target CGPA.
        </p>
      </div>

      {/* Current Status and Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Current Status</h3>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Current CGPA</p>
              <p className="text-2xl font-bold text-dlsu-green">{formatGPA(currentCGPA)}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-1">Earned Units</p>
              <p className="text-2xl font-bold text-gray-700">{earnedUnits}</p>
            </div>
          </div>
        </div>

        {/* User Inputs */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Target Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="targetCGPA" className="block text-sm text-gray-500 mb-1">
                Target CGPA
              </label>
              <input
                type="number"
                id="targetCGPA"
                value={targetCGPA}
                onChange={(e) => setTargetCGPA(Math.max(0, Math.min(4, parseFloat(e.target.value) || 0)))}
                min="0"
                max="4"
                step="0.1"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-dlsu-green focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="totalUnits" className="block text-sm text-gray-500 mb-1">
                Total Units to Graduate
              </label>
              <input
                type="text"
                id="totalUnits"
                value={totalUnitsInput}
                onChange={(e) => handleTotalUnitsChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-dlsu-green focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Projection Results */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Projection Results</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Remaining Units</p>
            <p className="text-2xl font-bold text-gray-700">{remainingUnits}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 mb-1">Required GPA for Remaining Units</p>
            <p className={`text-2xl font-bold ${getGPAColorClass(projectedGPA)}`}>
              {isAchievable ? formatGPA(projectedGPA) : 'Not achievable'}
            </p>
          </div>
        </div>
      </div>

      {/* Formula Explanation */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">How is this calculated?</h3>
        <p className="text-gray-600 mb-4">
          The required GPA for your remaining units is calculated using this formula:
        </p>
        <div className="bg-white p-4 rounded border border-gray-300 font-mono text-sm overflow-x-auto">
          Required GPA = (Target CGPA × Total Units - Current CGPA × Earned Units) ÷ Remaining Units
        </div>
      </div>
    </div>
  );
};

export default CGPAProjections; 