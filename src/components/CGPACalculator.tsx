import { useState, useEffect, useMemo } from 'react';
import { getUserTerms, loadUserData, saveUserCGPASettings, loadUserCGPASettings } from '../config/firestore';
import type { Course } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import type { CGPASettings } from '../config/firestore';
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
  const [creditedUnits, setCreditedUnits] = useState<number>(0);
  const [creditedUnitsInput, setCreditedUnitsInput] = useState<string>("0");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load user settings and handle migration for creditedUnits
  useEffect(() => {
    const loadAndMigrateSettings = async () => {
      if (!authInitialized) return;
      // console.log("CGPACalc: loadAndMigrateSettings START. User:", user ? user.uid : 'anonymous', "AuthInitialized:", authInitialized);

      // 1. Try to get current anonymous data for cgpa_settings (creditedUnits)
      let anonymousCreditedUnits: number | null = null;
      const anonymousSettingsString = sessionStorage.getItem('cgpa_settings');
      if (anonymousSettingsString) {
        try {
          const parsed = JSON.parse(anonymousSettingsString);
          if (parsed && typeof parsed.creditedUnits === 'number') {
            anonymousCreditedUnits = parsed.creditedUnits;
            // console.log("CGPACalc: Parsed anonymous creditedUnits:", anonymousCreditedUnits);
          }
        } catch (e) {
          console.error("Error parsing anonymous cgpa_settings from sessionStorage", e);
        }
      }

      const newLoginSession = sessionStorage.getItem('newLogin') === 'true';
      // console.log("CGPACalc: newLogin flag from session:", newLoginSession);

      if (user) { // User is logged in
        if (newLoginSession) {
          // console.log("CGPACalc: New login detected. Clearing newLogin flag. Migration will be attempted.");
          sessionStorage.removeItem('newLogin'); // Clear the flag, but still proceed to check for migration
        }

        let firestoreCreditedUnits: number = 0; // Default to 0
        let firestoreSettingsExist = false;

        try {
          const settings = await loadUserCGPASettings(user.uid);
          if (settings) {
            firestoreSettingsExist = true;
            firestoreCreditedUnits = settings.creditedUnits;
            // console.log("CGPACalc: Firestore creditedUnits loaded:", firestoreCreditedUnits);
          } else {
            // console.log("CGPACalc: No CGPA settings found in Firestore for user.");
          }
        } catch (error) {
          console.error('Error loading CGPA settings from Firestore:', error);
        }

        // Not a new login (or newLogin flag already cleared) - attempt migration or load from Firestore
        const firestoreIsDefault = firestoreCreditedUnits === 0;
        const anonymousHasDataToMigrate = anonymousCreditedUnits !== null && anonymousCreditedUnits !== 0;
        // console.log(`CGPACalc: Migration check: Firestore default: ${firestoreIsDefault}, Anonymous has data: ${anonymousHasDataToMigrate}, Anonymous val: ${anonymousCreditedUnits}, Was new login: ${newLoginSession}`);

        if (firestoreIsDefault && anonymousHasDataToMigrate && anonymousCreditedUnits !== null) {
          // console.log("CGPACalc: MIGRATING anonymous creditedUnits to Firestore.");
          setCreditedUnits(anonymousCreditedUnits);
          setCreditedUnitsInput(anonymousCreditedUnits.toString());
          try {
            await saveUserCGPASettings(user.uid, { creditedUnits: anonymousCreditedUnits });
            // console.log("CGPACalc: Anonymous creditedUnits successfully migrated and saved.");
            sessionStorage.removeItem('cgpa_settings'); // Clear migrated data
          } catch (saveError) {
            console.error("CGPACalc: Error saving migrated creditedUnits to Firestore:", saveError);
          }
        } else {
          // No migration needed. Load from Firestore or ensure defaults.
          // This also handles: was newLogin, but no anon data to migrate.
          // console.log("CGPACalc: Not migrating creditedUnits. Using Firestore value or default.");
          if (firestoreSettingsExist) {
            setCreditedUnits(firestoreCreditedUnits);
            setCreditedUnitsInput(firestoreCreditedUnits.toString());
          } else {
            // Firestore settings don't exist (and no migration happened). Ensure default 0 is set and saved.
            // console.log("CGPACalc: Firestore settings don't exist, no migration. Ensuring default 0 and saving.");
            setCreditedUnits(0);
            setCreditedUnitsInput("0");
            if (user) { // Ensure user exists before saving
                try {
                    await saveUserCGPASettings(user.uid, { creditedUnits: 0 });
                } catch (e) { console.error("CGPACalc: Failed to save default CGPA settings when Firestore non-existent", e);}
            }
          }
        }
      } else { // Anonymous user
        // console.log("CGPACalc: Anonymous user. Loading creditedUnits from sessionStorage if available.");
        if (anonymousCreditedUnits !== null) {
          setCreditedUnits(anonymousCreditedUnits);
          setCreditedUnitsInput(anonymousCreditedUnits.toString());
        } else {
          // No anonymous settings, reset to default for UI consistency if needed (though initial state is 0)
          // console.log("CGPACalc: Anonymous user, no session settings for creditedUnits, ensuring default.");
          setCreditedUnits(0);
          setCreditedUnitsInput("0");
        }
      }
    };
    
    // Run the load and migration logic when authInitialized changes or user logs in/out
    if (authInitialized) {
      loadAndMigrateSettings();
    }
  }, [user, authInitialized]);

  // Save settings for ANONYMOUS users to sessionStorage
  useEffect(() => {
    // Only run if auth is initialized, user is anonymous, AND component is not in a loading state
    if (isLoading || !authInitialized || user) {
      return;
    }

    // If isLoading is true here, it means some data loading might be in progress for other parts of the component (e.g., termsData).
    // However, for a direct user input like creditedUnits, we save it immediately to sessionStorage
    // regardless of background loading of *other* data.
    try {
      // console.log('CGPACalculator: Anonymous save for creditedUnits. Value:', creditedUnits);
      sessionStorage.setItem('cgpa_settings', JSON.stringify({ creditedUnits }));
    } catch (error) {
      console.error('Error saving anonymous CGPA settings (creditedUnits) to sessionStorage:', error);
    }
  }, [creditedUnits, isLoading, authInitialized, user]); // Add isLoading to dependencies and check

  // Save settings for LOGGED-IN users to Firestore (debounced)
  useEffect(() => {
    if (isLoading || !authInitialized || !user) {
      // Only run if not loading, auth is initialized, and user is logged IN
      return;
    }

    const saveToFirestore = async () => {
      setSaveStatus('Saving...'); // Indicator for async Firestore operation
      try {
        const settings: CGPASettings = { creditedUnits };
        const saved = await saveUserCGPASettings(user.uid, settings);
        if (saved) {
          setSaveStatus('Settings saved');
        } else {
          // Assuming saveUserCGPASettings returns false on a non-exception failure
          setSaveStatus('Error saving'); 
        }
      } catch (error) {
        console.error('Error saving CGPA settings to Firestore:', error);
        setSaveStatus('Error saving');
      }
      // Clear the save status after a short delay
      setTimeout(() => setSaveStatus(null), 2000);
    };

    // Debounce save to avoid too many requests
    const timeoutId = setTimeout(saveToFirestore, 1000);
    return () => clearTimeout(timeoutId);
  }, [creditedUnits, isLoading, authInitialized, user]); // Dependencies remain similar, logic inside effect filters

  // Handle credited units input change
  const handleCreditedUnitsChange = (value: string) => {
    setCreditedUnitsInput(value);
    
    // Convert to number for calculations
    const numValue = parseInt(value) || 0;
    setCreditedUnits(Math.max(0, numValue));
  };

  // Clear anonymous settings marker when component unmounts if user is not logged in
  useEffect(() => {
    return () => {
      // Only mark for cleanup if user is not logged in and this is navigation away from component
      if (!user) {
        sessionStorage.setItem('cgpa_settings_cleanup', 'true');
      }
    };
  }, [user]);

  // Handle page unload to save settings
  useEffect(() => {
    // Save settings immediately on page unload for anonymous users
    const handleBeforeUnload = () => {
      if (!user && !isLoading) {
        try {
          sessionStorage.setItem('cgpa_settings', JSON.stringify({ creditedUnits }));
        } catch (error) {
          console.error('Error saving CGPA settings before unload:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, creditedUnits, isLoading]);

  // Calculate CGPA from all terms
  const { cgpa, totalTerms, totalUnits, totalWithCredited } = useMemo(() => {
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

    // Calculate CGPA without credited units
    const cgpaValue = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(3) : '0.000';
    
    // Add credited units to total units for display purposes only
    const totalWithCreditedValue = totalUnits + creditedUnits;
    
    return {
      cgpa: cgpaValue,
      totalTerms: activeTerms,
      totalUnits,
      totalWithCredited: totalWithCreditedValue
    };
  }, [termsData, creditedUnits]);

  // Save CGPA data to session storage for the Projections tab
  useEffect(() => {
    try {
      // Save CGPA data to session storage
      const cgpaData = {
        cgpa,
        totalUnits: totalWithCredited, // Use total with credited units
        totalTerms
      };
      
      sessionStorage.setItem('cgpa_data', JSON.stringify(cgpaData));
      console.log('CGPA data saved to session storage:', cgpaData);
    } catch (error) {
      console.error('Error saving CGPA data to session storage:', error);
    }
  }, [cgpa, totalUnits, totalWithCredited, totalTerms]);

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
        const standardTerms = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const availableTerms = [...standardTerms];
        
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
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-md">
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
      <div className="card">
        <div className="card-body flex flex-col items-center justify-center py-10">
          <h3 className="text-xl font-medium text-gray-700 mb-3">No Term Data Available</h3>
          <p className="text-gray-500 mb-4">Add courses in the GPA Calculator tab to get started.</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'gpa' }))}
            className="px-4 py-2 bg-dlsu-green text-white rounded hover:bg-dlsu-dark-green transition-colors"
          >
            Go to GPA Calculator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* CGPA Summary */}
      <div className="card">
        <div className="card-header flex flex-col sm:flex-row justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Cumulative GPA Calculator</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Active Terms</p>
              <p className="text-xl font-semibold">{totalTerms}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Academic Units</p>
              <p className="text-xl font-semibold">{totalUnits}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Total Units</p>
              <p className="text-xl font-semibold">{totalWithCredited}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">CGPA</p>
              <p className="text-3xl font-bold text-dlsu-green">{cgpa}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            {/* Credited Units Input */}
            <div className="relative group max-w-md">
              <label htmlFor="creditedUnits" className="block text-xs font-medium text-gray-700 mb-1.5">
                Credited Units
                <span className="ml-1 text-gray-400 cursor-help text-xs">(?)</span>
              </label>
              <div className="flex">
                <input
                  type="number"
                  id="creditedUnits"
                  value={creditedUnitsInput}
                  onChange={(e) => handleCreditedUnitsChange(e.target.value)}
                  className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-dlsu-green focus:border-dlsu-green"
                  min="0"
                />
                <div className="ml-2 text-xs text-gray-500 flex items-center">
                  Units from previous school/degree (not counted in CGPA)
                </div>
              </div>
              
              {saveStatus && (
                <div className="text-xs text-green-600 mt-1">
                  {saveStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terms by Year */}
      {Object.entries(termsByYear).map(([year, terms]) => (
        <div key={year} className="space-y-3">
          <h3 className="text-base font-medium text-gray-700 px-1">{year}</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {terms.map(term => (
              <div 
                key={term.term} 
                className={`card h-full ${
                  term.isActive ? 'border-dlsu-green' : 'opacity-80'
                }`}
              >
                <div className="card-header flex justify-between items-center py-2.5 px-4">
                  <h4 className="font-medium text-sm">Term {term.term}</h4>
                  <button 
                    onClick={() => onEditTerm(term.term)}
                    className="p-1.5 text-gray-500 hover:text-dlsu-green rounded-full hover:bg-gray-100"
                    title="Edit Term"
                  >
                    <Edit size={14} />
                  </button>
                </div>
                
                <div className="p-4 flex flex-col h-full">
                  <div className="mb-3 text-center">
                    <div className="text-2xl font-bold text-dlsu-green">
                      {term.gpa}
                    </div>
                    <div className="text-xs text-gray-500">
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
                      <tbody className="divide-y divide-gray-100 text-xs">
                        {term.courses.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-2 py-4 text-center text-gray-400 italic text-xs">
                              No courses yet
                            </td>
                          </tr>
                        ) : (
                          term.courses.map((course, index) => (
                            <tr key={course.id} className={`hover:bg-gray-50 ${index % 2 === 0 ? '' : 'bg-gray-50'}`}>
                              <td className="px-2 py-1.5 font-medium truncate max-w-[100px]" title={course.code}>
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