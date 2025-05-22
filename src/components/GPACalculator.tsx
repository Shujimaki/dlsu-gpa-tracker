import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, InfoIcon, Loader2 } from 'lucide-react';
import type { Course } from '../types';
import { logGpaCalculation, logDeansListEligibility, logUserAction } from '../config/analytics';
import { saveUserData, loadUserData } from '../config/firestore';
import { auth } from '../config/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

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

/**
 * Helper function to store data - uses sessionStorage for anonymous users
 * and localStorage for the forceLocalStorage option
 */
function storeLocalData(key: string, data: unknown, isAnonymous: boolean, forceLocalStorage: boolean) {
  const storage = (isAnonymous && !forceLocalStorage) ? sessionStorage : localStorage;
  storage.setItem(key, JSON.stringify(data));
}

/**
 * Helper function to load data - checks both sessionStorage and localStorage
 * with priority for authenticated user data
 */
function loadLocalData(key: string, isAnonymous: boolean) {
  // For authenticated users, check localStorage first
  if (!isAnonymous) {
    const localData = localStorage.getItem(key);
    if (localData) {
      return JSON.parse(localData);
    }
  }
  
  // For anonymous users or fallback
  const sessionData = sessionStorage.getItem(key);
  if (sessionData) {
    return JSON.parse(sessionData);
  }
  
  // Final fallback to localStorage even for anonymous
  return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)!) : null;
}

interface GPACalculatorProps {
  user?: FirebaseUser | null;
  authInitialized?: boolean;
}

const GPACalculator = ({ user, authInitialized = false }: GPACalculatorProps) => {
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
  const [isFlowchartExempt, setIsFlowchartExempt] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [forceLocalStorage, setForceLocalStorage] = useState(() => {
    // Default to what was previously set, or false if first time
    return localStorage.getItem('forceLocalStorage') === 'true';
  });
  
  // Save the preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('forceLocalStorage', forceLocalStorage.toString());
  }, [forceLocalStorage]);

  // Handle login/logout transitions
  useEffect(() => {
    if (!authInitialized) return;
  
    const isAnonymous = !user;
    const wasAnonymous = sessionStorage.getItem('wasAnonymous') === 'true';
    const isNewLogin = sessionStorage.getItem('newLogin') === 'true';
    
    // If this is a new account login, clear all flags and reset state
    if (!isAnonymous && isNewLogin) {
      console.log('New account detected - starting with fresh data');
      sessionStorage.setItem('newLogin', 'false');
      sessionStorage.setItem('wasAnonymous', 'false'); // Clear anonymous flag to prevent migration
      
      // Reset to default state for fresh accounts
      setCourses([{
        id: crypto.randomUUID(),
        code: '',
        name: '',
        units: 3,
        grade: 0,
        nas: false,
      }]);
      
      // Skip any other login transition logic
      return;
    }
    
    // If user just logged in (transition from anonymous → authenticated)
    if (!isAnonymous && wasAnonymous) {
      console.log('User login detected - checking for data migration needs');
      sessionStorage.setItem('wasAnonymous', 'false');
      
      // Attempt to migrate session data for currently visible term if needed
      const migrateCurrentTerm = async () => {
        if (!user) return;
        
        try {
          // Check if we already have data in Firestore for this term
          const firestoreData = await loadUserData(user.uid, selectedTerm);
          
          // If no cloud data exists, migrate sessionStorage data
          if (!firestoreData) {
            const sessionData = sessionStorage.getItem(`term_${selectedTerm}`);
            if (sessionData) {
              console.log('Migrating anonymous data to Firestore for term:', selectedTerm);
              const parsedData = JSON.parse(sessionData);
              await saveUserData(user.uid, selectedTerm, parsedData);
            }
          }
        } catch (error) {
          console.error('Error during data migration:', error);
        }
      };
      
      migrateCurrentTerm();
    }
    
    // Track anonymous state for future transitions
    if (isAnonymous) {
      sessionStorage.setItem('wasAnonymous', 'true');
    }
  }, [user, authInitialized, selectedTerm]);

  // Load saved data when term changes
  useEffect(() => {
    const loadData = async () => {
      console.log('Loading data for term:', selectedTerm);
      
      // If auth isn't initialized yet, wait for it
      if (!authInitialized) {
        console.log('Auth not initialized yet, delaying load');
        return;
      }
      
      const currentUser = user || auth.currentUser;
      const isAnonymous = !currentUser;
      let loadedFromFirestore = false;

      if (currentUser && currentUser.uid && !forceLocalStorage) {
        try {
          // Try to load from Firestore first if localStorage not forced
          const firestoreData = await loadUserData(currentUser.uid, selectedTerm);
          if (firestoreData) {
            console.log('Loaded from Firestore:', firestoreData);
            setCourses(ensureCoursesWithNAS(firestoreData));
            loadedFromFirestore = true;
          } else {
            console.log('No data found in Firestore for term', selectedTerm);
          }
        } catch (error) {
          console.error('Error loading from Firestore:', error);
          // Continue to localStorage fallback
        }
      } else if (forceLocalStorage) {
        console.log('Force localStorage mode enabled - skipping Firestore load');
      } else {
        console.log('User not authenticated, loading from session storage');
      }
      
      // Fallback to local storage if no Firestore data
      if (!loadedFromFirestore) {
        const localData = loadLocalData(`term_${selectedTerm}`, isAnonymous);
        if (localData) {
          console.log('Loaded from local storage:', localData);
          setCourses(ensureCoursesWithNAS(localData));
        } else {
          console.log('No saved data found, using default course');
          setCourses([{
            id: crypto.randomUUID(),
            code: '',
            name: '',
            units: 3,
            grade: 0,
            nas: false,
          }]);
        }
      }
      setIsInitialLoad(false);
    };

    loadData();
  }, [selectedTerm, authInitialized, user, forceLocalStorage]);

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

  const totalAcademicUnits = courses.filter((c: Course) => !c.nas).reduce((sum: number, c: Course) => sum + (c.units || 0), 0);
  const totalNASUnits = courses.filter((c: Course) => c.nas).reduce((sum: number, c: Course) => sum + (c.units || 0), 0);
  const gpa = calculateGPA();
  const hasGradeBelow2 = courses.some(course => !course.nas && course.grade < 2.0 && course.grade >= 0);
  const hasFailingGrade = courses.some(course => course.grade === 0);
  const isDeansLister = (isFlowchartExempt || totalAcademicUnits >= 12) && gpa >= 3.0 && !hasGradeBelow2 && !hasFailingGrade;
  const isFirstHonors = (isFlowchartExempt || totalAcademicUnits >= 12) && gpa >= 3.4 && !hasGradeBelow2 && !hasFailingGrade;

  // Save data when courses change
  useEffect(() => {
    // Don't save on initial load
    if (isInitialLoad) return;
    
    // Don't attempt to save if auth is still initializing
    if (!authInitialized) {
      console.log('Auth not initialized yet, delaying save');
      return;
    }

    const saveData = async () => {
      if (courses.length === 0) return;
      
      // Clear any existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      setSaveStatus('saving');
      console.log('Saving data for term:', selectedTerm, courses);
      
      try {
        const currentUser = user || auth.currentUser;
        const isAnonymous = !currentUser;
        let savedToFirestore = false;

        // Skip Firestore if forceLocalStorage is enabled
        if (currentUser && currentUser.uid && !forceLocalStorage) {
          try {
            // Save to Firestore if user is logged in and localStorage not forced
            const result = await saveUserData(currentUser.uid, selectedTerm, courses);
            savedToFirestore = result;
            if (!result) {
              console.warn("Firestore save returned false - proceeding to localStorage fallback");
            }
          } catch (error) {
            console.error('Error saving to Firestore:', error);
            // Continue to localStorage fallback
          }
        } else if (forceLocalStorage) {
          console.log('Force localStorage mode enabled - skipping Firestore save');
        } else {
          console.log('User not authenticated, saving to session storage only');
        }

        // Always save to local storage as backup (using the appropriate storage method)
        storeLocalData(`term_${selectedTerm}`, courses, isAnonymous, forceLocalStorage);
        
        if (savedToFirestore) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('saved');
          console.log('Saved to local storage only');
        }
        
        // Reset status after 2 seconds
        const timeout = setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
        setSaveTimeout(timeout);
      } catch (error) {
        console.error('Error saving data:', error);
        setSaveStatus('error');
        
        // Reset error status after 3 seconds
        const timeout = setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
        setSaveTimeout(timeout);
      }
    };

    // Add a longer debounce for users who are not logged in
    // This prevents excessive save attempts that might cause 400 errors
    const currentUser = user || auth.currentUser;
    const debounceTimer = setTimeout(saveData, currentUser ? 1000 : 2000);
    return () => {
      clearTimeout(debounceTimer);
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [courses, selectedTerm, isInitialLoad, authInitialized, user, forceLocalStorage]);

  // Log analytics when relevant values change
  useEffect(() => {
    logGpaCalculation(gpa, selectedTerm);
    logDeansListEligibility(isDeansLister, isFirstHonors);
  }, [gpa, selectedTerm, isDeansLister, isFirstHonors]);

  const addCourse = () => {
    setCourses([...courses, {
      id: crypto.randomUUID(),
      code: '',
      name: '',
      units: 3,
      grade: 0,
      nas: false,
    }]);
    logUserAction('add_course');
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter((course: Course) => course.id !== id));
      logUserAction('remove_course');
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: string | number | boolean) => {
    setCourses(courses.map((course: Course) =>
      course.id === id ? { ...course, [field]: value } : course
    ));
    logUserAction('update_course', { field, value });
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

  const handleTermChange = (value: string) => {
    if (value === 'add') {
      addNewTerm();
    } else {
      setSelectedTerm(Number(value));
    }
  };

  // Add a useEffect to reset the calculator when a user logs out
  useEffect(() => {
    // If the auth is initialized but there's no user, this means user has logged out
    if (authInitialized && !user) {
      // Reset to default state
      setCourses([{
        id: crypto.randomUUID(),
        code: '',
        name: '',
        units: 3,
        grade: 0,
        nas: false,
      }]);
      console.log('User logged out, reset calculator form');
    }
  }, [user, authInitialized]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-dlsu-green">
            GPA Calculator
          </h2>
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <div className="flex items-center text-gray-600">
                <Loader2 size={16} className="animate-spin mr-1" />
                Saving...
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="text-green-600">
                Saved
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="text-red-600">
                Error saving
              </div>
            )}
          </div>
        </div>
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

      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Term
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => handleTermChange(e.target.value)}
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
        <div className="flex items-center">
          <input
            type="checkbox"
            id="flowchartExempt"
            checked={isFlowchartExempt}
            onChange={(e) => setIsFlowchartExempt(e.target.checked)}
            className="h-4 w-4 text-dlsu-green focus:ring-dlsu-green border-gray-300 rounded"
          />
          <label htmlFor="flowchartExempt" className="ml-2 block text-sm text-gray-700">
            Flowchart exempts me from 12-unit requirement
          </label>
        </div>
        <div className="flex items-center ml-auto relative group">
          <input
            type="checkbox"
            id="forceLocalStorage"
            checked={forceLocalStorage}
            onChange={(e) => setForceLocalStorage(e.target.checked)}
            className="h-4 w-4 text-red-500 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="forceLocalStorage" className="ml-2 block text-sm text-gray-700 flex items-center">
            Use local storage only (offline mode)
            <span className="cursor-help ml-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
            </span>
          </label>
          <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity">
            Stores your data only on this device and prevents syncing to your account. 
            Use this if you're experiencing connection issues or want to work offline.
            <div className="absolute top-full left-4 transform -translate-x-1/2 -translate-y-px border-4 border-transparent border-t-gray-800"></div>
          </div>
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
              <li>No grade below 2.0 in any academic subject</li>
              <li>No failing grade (0.0 or F) in any subject, including non-academic subjects</li>
              <li>First Honors: GPA of 3.4 or higher</li>
              <li>Second Honors: GPA of 3.0 to 3.39</li>
              <li>Must not have been found guilty of academic dishonesty</li>
            </ul>
            <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
              <strong>Note:</strong> Academic dishonesty includes cheating, plagiarism, and other forms of academic misconduct as defined in the DLSU Student Handbook.
            </div>
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