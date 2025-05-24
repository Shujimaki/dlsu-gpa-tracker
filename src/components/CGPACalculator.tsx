import { useState, useEffect, useMemo } from 'react';
import { getUserTerms, loadUserData } from '../config/firestore';
import type { Course } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import { Edit } from 'lucide-react';

// Local implementation of loadSessionData
function loadSessionData(key: string): unknown | null {
  try {
    const sessionData = sessionStorage.getItem(key);
    if (sessionData === null) {
      return null;
    }
    return JSON.parse(sessionData);
  } catch (error) {
    console.error(`Error loading data for key ${key}:`, error);
    return null;
  }
}

interface CGPACalculatorProps {
  user?: FirebaseUser | null;
  authInitialized?: boolean;
  onEditTerm: (term: number) => void;
}

interface TermData {
  courses: Course[];
  isFlowchartExempt: boolean;
}

interface TermSummary {
  term: number;
  courses: Course[];
  gpa: string;
  totalUnits: number;
  totalNASUnits: number;
  isActive: boolean;
}

const CGPACalculator = ({ user, authInitialized = false, onEditTerm }: CGPACalculatorProps) => {
  const [termsData, setTermsData] = useState<TermSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate CGPA from all terms
  const { cgpa, totalTerms, totalUnits } = useMemo(() => {
    let totalPoints = 0;
    let totalUnits = 0;
    let activeTerms = 0;

    termsData.forEach((term) => {
      // Only include terms with academic units > 0
      if (term.isActive) {
        totalPoints += parseFloat(term.gpa) * term.totalUnits;
        totalUnits += term.totalUnits;
        activeTerms++;
      }
    });

    const cgpaValue = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(3) : '0.000';
    
    return {
      cgpa: cgpaValue,
      totalTerms: activeTerms,
      totalUnits
    };
  }, [termsData]);

  // Calculate GPA for a single term
  const calculateTermGPA = (courses: Course[]): { 
    gpa: string; 
    totalUnits: number; 
    totalNASUnits: number;
    isActive: boolean;
  } => {
    let totalPoints = 0;
    let totalUnits = 0;
    let totalNASUnits = 0;

    courses.forEach((course) => {
      if (course.nas) {
        totalNASUnits += course.units;
      } else {
        totalUnits += course.units;
        if (course.grade > 0) {
          totalPoints += course.grade * course.units;
        }
      }
    });

    const gpaValue = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(3) : '0.000';
    
    return { 
      gpa: gpaValue, 
      totalUnits, 
      totalNASUnits,
      isActive: totalUnits > 0 // A term is active if it has academic units
    };
  };

  // Load all terms data
  useEffect(() => {
    const loadAllTermsData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const isAnonymous = !user;
        
        // Start with standard terms 1-12
        const standardTerms = Array.from({ length: 12 }, (_, i) => i + 1);
        let availableTerms = [...standardTerms];
        
        // If user is logged in, get their terms from Firestore
        if (!isAnonymous && user) {
          try {
            const userTerms = await getUserTerms(user.uid);
            // Add any custom terms (13+) to the available terms
            userTerms.forEach(term => {
              if (term > 12 && !availableTerms.includes(term)) {
                availableTerms.push(term);
              }
            });
          } catch (error) {
            console.error('Error loading user terms:', error);
          }
        } else {
          // For anonymous users, check sessionStorage for custom terms
          for (let i = 13; i <= 21; i++) {
            const termKey = `term_${i}`;
            const sessionData = loadSessionData(termKey);
            if (sessionData) {
              availableTerms.push(i);
            }
          }
        }
        
        // Sort terms numerically
        availableTerms.sort((a, b) => a - b);
        
        // Load data for each term
        const termsDataPromises = availableTerms.map(async (term) => {
          let termData: TermData | null = null;
          
          // Try to load from Firestore if user is logged in
          if (!isAnonymous && user) {
            try {
              termData = await loadUserData(user.uid, term);
            } catch (error) {
              console.error(`Error loading term ${term} from Firestore:`, error);
            }
          }
          
          // If no data from Firestore or anonymous user, try sessionStorage
          if (!termData) {
            const localKey = `term_${term}`;
            const sessionData = loadSessionData(localKey);
            
            if (sessionData) {
              if (typeof sessionData === 'object' && 'courses' in sessionData) {
                // New format with flowchart exemption
                termData = sessionData as TermData;
              } else {
                // Old format (just array of courses)
                termData = {
                  courses: sessionData as Course[],
                  isFlowchartExempt: false
                };
              }
            }
          }
          
          // If we found data and it has courses
          if (termData && termData.courses && termData.courses.length > 0) {
            const { gpa, totalUnits, totalNASUnits, isActive } = calculateTermGPA(termData.courses);
            
            return {
              term,
              courses: termData.courses,
              gpa,
              totalUnits,
              totalNASUnits,
              isActive
            };
          }
          
          // Return empty term data if nothing found
          return {
            term,
            courses: [],
            gpa: '0.000',
            totalUnits: 0,
            totalNASUnits: 0,
            isActive: false
          };
        });
        
        // Wait for all term data to be loaded
        const loadedTermsData = await Promise.all(termsDataPromises);
        
        // No longer filter out terms with no courses - we want to show all terms
        setTermsData(loadedTermsData);
      } catch (error) {
        console.error('Error loading all terms data:', error);
        setError('Failed to load terms data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (authInitialized) {
      loadAllTermsData();
    }
  }, [user, authInitialized]);

  // Group terms by year (3 terms per year)
  const termsByYear = useMemo(() => {
    const grouped: { [key: string]: TermSummary[] } = {};
    
    // Create placeholder data for all terms 1-12 plus any custom terms
    const allTerms = Array.from(
      new Set([
        ...Array.from({ length: 12 }, (_, i) => i + 1), // Terms 1-12
        ...termsData.map(term => term.term) // Any additional terms with data
      ])
    ).sort((a, b) => a - b);
    
    // Create term summaries for all terms
    const allTermSummaries = allTerms.map(term => {
      // Find existing data for this term
      const existingData = termsData.find(t => t.term === term);
      
      if (existingData) {
        return existingData;
      }
      
      // Create empty term data if none exists
      return {
        term,
        courses: [],
        gpa: '0.000',
        totalUnits: 0,
        totalNASUnits: 0,
        isActive: false
      };
    });
    
    // Group by year (3 terms per year)
    allTermSummaries.forEach(term => {
      const year = Math.ceil(term.term / 3);
      const yearKey = `Year ${year}`;
      
      if (!grouped[yearKey]) {
        grouped[yearKey] = [];
      }
      
      grouped[yearKey].push(term);
    });
    
    return grouped;
  }, [termsData]);

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

  if (termsData.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-medium text-gray-700 mb-4">No Term Data Available</h3>
        <p className="text-gray-500 mb-6">Add courses in the GPA Calculator tab to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CGPA Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-dlsu-green mb-4 md:mb-0">Cumulative GPA</h2>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Active Terms</p>
              <p className="text-xl font-semibold">{totalTerms}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Units</p>
              <p className="text-xl font-semibold">{totalUnits}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">CGPA</p>
              <p className="text-3xl font-bold text-dlsu-green">{cgpa}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Terms by Year */}
      {Object.entries(termsByYear).map(([year, terms]) => (
        <div key={year} className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-700">{year}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {terms.map(term => (
              <div 
                key={term.term} 
                className={`bg-white border rounded-lg shadow-sm overflow-hidden h-full ${
                  term.isActive ? 'border-dlsu-green' : 'border-gray-200 opacity-75'
                }`}
              >
                <div className="flex justify-between items-center bg-gray-50 px-4 py-3 border-b">
                  <h4 className="font-medium">Term {term.term}</h4>
                  <button 
                    onClick={() => onEditTerm(term.term)}
                    className="p-1.5 text-gray-500 hover:text-dlsu-green rounded-full hover:bg-gray-100 bg-white"
                    title="Edit Term"
                  >
                    <Edit size={16} />
                  </button>
                </div>
                
                <div className="p-4 flex flex-col h-full">
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-center text-dlsu-green">
                      {term.gpa}
                    </div>
                    <div className="text-sm text-center text-gray-500">
                      Total Units: {term.totalUnits}
                      {term.totalNASUnits > 0 && ` (${term.totalNASUnits} NAS)`}
                    </div>
                  </div>
                  
                  <div className="overflow-hidden flex-grow">
                    <table className="min-w-full">
                      <thead className="bg-gray-50 text-xs">
                        <tr>
                          <th className="px-2 py-1.5 text-left text-gray-500">Code</th>
                          <th className="px-2 py-1.5 text-center text-gray-500 w-12">Units</th>
                          <th className="px-2 py-1.5 text-center text-gray-500 w-12">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {term.courses.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-2 py-4 text-center text-gray-400 italic">
                              No courses yet
                            </td>
                          </tr>
                        ) : (
                          term.courses.map(course => (
                            <tr key={course.id} className="hover:bg-gray-50">
                              <td className="px-2 py-1.5 font-medium">
                                {course.code || '-'}
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                {course.nas ? `(${course.units})` : course.units}
                              </td>
                              <td className="px-2 py-1.5 text-center">
                                {course.nas && course.units === 0
                                  ? (course.grade === 1 ? 'P' : 'F')
                                  : course.grade.toFixed(1)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CGPACalculator; 