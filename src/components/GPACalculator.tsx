import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, InfoIcon, Loader2 } from 'lucide-react';
import type { Course } from '../types';
import { logGpaCalculation, logDeansListEligibility, logUserAction } from '../config/analytics';
import { saveUserData, loadUserData, getUserTerms, deleteUserTerm } from '../config/firestore';
import type { User as FirebaseUser } from 'firebase/auth';

/**
 * Helper function to store data - uses sessionStorage for anonymous users
 * and Firestore for logged-in users
 */
function storeSessionData(key: string, data: unknown) {
  sessionStorage.setItem(key, JSON.stringify(data));
}

/**
 * Helper function to load data - checks sessionStorage for anonymous users
 * and falls back to Firestore for logged-in users
 */
function loadSessionData(key: string) {
  const sessionData = sessionStorage.getItem(key);
  return sessionData ? JSON.parse(sessionData) : null;
}

interface GPACalculatorProps {
  user?: FirebaseUser | null;
  authInitialized?: boolean;
}

// Define the structure of term data for type safety
interface TermData {
  courses: Course[];
  isFlowchartExempt: boolean;
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
  const [availableTerms, setAvailableTerms] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  const [showDeansListModal, setShowDeansListModal] = useState(false);
  const [showGPAModal, setShowGPAModal] = useState(false);
  const [isFlowchartExempt, setIsFlowchartExempt] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

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
              await saveUserData(user.uid, selectedTerm, parsedData.courses, parsedData.isFlowchartExempt);
            }
          }
        } catch (error) {
          console.error('Error during data migration:', error);
        }
      };
      
      migrateCurrentTerm();
    }
    
    // When user logs in (whether new or returning), check for all terms
    if (!isAnonymous) {
      console.log('User logged in, checking for terms in Firestore...');
      
      // Function to check for terms in Firestore
      const checkForFirestoreTerms = async () => {
        if (!user) return;
        
        try {
          // Get all terms from Firestore
          const userTerms = await getUserTerms(user.uid);
          console.log('Found terms in Firestore:', userTerms);
          
          if (userTerms && userTerms.length > 0) {
            // Find highest term number (up to 21)
            const highestTerm = Math.min(Math.max(...userTerms), 21);
            
            // Always include terms 1-12, plus any additional terms up to the highest
            // If highestTerm is <= 12, this will just generate terms 1-12
            const allTerms = Array.from({ length: Math.max(12, highestTerm) }, (_, i) => i + 1);
            
            console.log('Setting available terms:', allTerms);
            
            // Update availableTerms
            setAvailableTerms(allTerms);
          } else {
            // Default to terms 1-12 if no terms found
            setAvailableTerms([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
          }
        } catch (error) {
          console.error('Error checking for terms:', error);
          // Default to terms 1-12 on error
          setAvailableTerms([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
        }
      };
      
      checkForFirestoreTerms();
    }
    
    // Track anonymous state for future transitions
    if (isAnonymous) {
      sessionStorage.setItem('wasAnonymous', 'true');
    }
  }, [user, authInitialized, selectedTerm]);

  // Load data when term changes
  useEffect(() => {
    if (authInitialized) {
      console.log(`Loading data for term ${selectedTerm}...`);
      loadData();
    }
  }, [selectedTerm, user, authInitialized]);

  // Load data for the current term
  const loadData = async () => {
    try {
      setIsInitialLoad(true);
      const isAnonymous = !user;
      
      let loadedData: TermData | null = null;
      
      // Try to load from Firestore if user is logged in
      if (!isAnonymous) {
        try {
          const firestoreData = await loadUserData(user!.uid, selectedTerm);
          if (firestoreData) {
            loadedData = firestoreData as TermData;
            console.log('Data loaded from Firestore');
          }
        } catch (error) {
          console.error('Error loading from Firestore:', error);
        }
      }
      
      // If no data from Firestore or anonymous user, try sessionStorage
      if (!loadedData) {
        const localKey = `term_${selectedTerm}`;
        const sessionData = loadSessionData(localKey);
        
        if (sessionData) {
          if (typeof sessionData === 'object' && 'courses' in sessionData) {
            // New format with flowchart exemption
            loadedData = sessionData as TermData;
            console.log('Data loaded from sessionStorage');
          } else {
            // Old format (just array of courses)
            loadedData = {
              courses: sessionData as Course[],
              isFlowchartExempt: false
            };
            console.log('Data loaded from sessionStorage (legacy format)');
          }
        }
      }
      
      // If we found data, use it
      if (loadedData && loadedData.courses.length > 0) {
        setCourses(loadedData.courses);
        setIsFlowchartExempt(loadedData.isFlowchartExempt);
      } else {
        // Initialize with empty courses if nothing found
        setCourses([
          { id: crypto.randomUUID(), code: '', name: '', units: 3, grade: 4.0, nas: false },
        ]);
        setIsFlowchartExempt(false);
      }
      
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error in loadData:', error);
      setIsInitialLoad(false);
    }
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

  const totalAcademicUnits = courses.filter((c: Course) => !c.nas).reduce((sum: number, c: Course) => sum + (c.units || 0), 0);
  const totalNASUnits = courses.filter((c: Course) => c.nas).reduce((sum: number, c: Course) => sum + (c.units || 0), 0);
  const gpa = calculateGPA();
  const hasGradeBelow2 = courses.some(course => !course.nas && course.grade < 2.0 && course.grade >= 0);
  const hasFailingGrade = courses.some(course => course.grade === 0);
  const isDeansLister = (isFlowchartExempt || totalAcademicUnits >= 12) && gpa >= 3.0 && !hasGradeBelow2 && !hasFailingGrade;
  const isFirstHonors = (isFlowchartExempt || totalAcademicUnits >= 12) && gpa >= 3.4 && !hasGradeBelow2 && !hasFailingGrade;

  // Save data for the current term
  useEffect(() => {
    if (!isInitialLoad && authInitialized) {
      const saveTimer = setTimeout(() => {
        saveData();
      }, 1000);
      
      return () => clearTimeout(saveTimer);
    }
  }, [courses, selectedTerm, isInitialLoad, authInitialized, user, isFlowchartExempt]);

  // Save data function
  const saveData = async () => {
    try {
      setSaveStatus('saving');
      const isAnonymous = !user;
      
      // Save to sessionStorage (for anonymous users or as backup)
      const termData = {
        courses,
        isFlowchartExempt
      };
      
      const termKey = `term_${selectedTerm}`;
      storeSessionData(termKey, termData);
      
      // Save to Firestore if user is logged in
      if (!isAnonymous) {
        try {
          const result = await saveUserData(user!.uid, selectedTerm, courses, isFlowchartExempt);
          if (result) {
            setSaveStatus('saved');
          } else {
            setSaveStatus('error');
            return false;
          }
        } catch (error) {
          console.error('Error saving to Firestore:', error);
          setSaveStatus('error');
          return false;
        }
      } else {
        setSaveStatus('saved');
      }
        
      // Reset status after 2 seconds
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      const timeout = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
      setSaveTimeout(timeout);
      
      return true;
    } catch (error) {
      console.error('Error in saveData:', error);
      setSaveStatus('error');
      
      // Reset error status after 3 seconds
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      const timeout = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      setSaveTimeout(timeout);
      
      return false;
    }
  };

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

  // Add a new term
  const addNewTerm = async () => {
    // Check if we've reached the maximum number of terms (21)
    if (Math.max(...availableTerms) >= 21) {
      console.log("Maximum number of terms (21) reached");
      return;
    }
    
    // Save current term data first
    await saveData();
    
    // Get the next term number (highest term + 1)
    const nextTerm = Math.max(...availableTerms) + 1;
    console.log(`Creating new Term ${nextTerm}`);
    
    // Create empty courses for the new term
    const newCourses = [
      { id: crypto.randomUUID(), code: '', name: '', units: 3, grade: 4.0, nas: false },
    ];
    
    // Prepare the new term data
    const newTermData = {
      courses: newCourses,
      isFlowchartExempt: false
    };
    
    // Always save to sessionStorage
    const newTermKey = `term_${nextTerm}`;
    storeSessionData(newTermKey, newTermData);
    
    // If logged in, also save to Firestore
    if (user) {
      try {
        console.log(`Saving new Term ${nextTerm} to Firestore`);
        await saveUserData(user.uid, nextTerm, newCourses, false);
      } catch (error) {
        console.error(`Error saving new Term ${nextTerm} to Firestore:`, error);
      }
    }
    
    // First update the available terms array
    console.log(`Adding Term ${nextTerm} to available terms`);
    setAvailableTerms(prev => {
      const updatedTerms = [...prev, nextTerm].sort((a, b) => a - b);
      console.log('Updated available terms:', updatedTerms);
      return updatedTerms;
    });
    
    // Then update the state to reflect the new term data
    setCourses(newCourses);
    setIsFlowchartExempt(false);
    
    // Finally set the selected term to the newly created term
    setSelectedTerm(nextTerm);
    
    console.log(`Successfully created and switched to Term ${nextTerm}`);
  };

  // Delete a term (only terms > 12 can be deleted)
  const deleteTerm = async (term: number) => {
    // Don't allow deleting standard terms 1-12
    if (term <= 12) {
      console.log("Cannot delete standard terms (1-12)");
      return;
    }
    
    console.log(`Deleting Term ${term}`);
    
    try {
      // Remove from sessionStorage first
      sessionStorage.removeItem(`term_${term}`);
      
      // If user is logged in, also delete from Firestore
      if (user) {
        try {
          const success = await deleteUserTerm(user.uid, term);
          if (success) {
            console.log(`Term ${term} deleted from Firestore`);
          } else {
            console.error(`Failed to delete Term ${term} from Firestore`);
          }
        } catch (error) {
          console.error(`Error deleting Term ${term} from Firestore:`, error);
        }
      }
      
      // Remove from availableTerms AFTER Firebase deletion completes
      setAvailableTerms(prev => {
        const updated = prev.filter(t => t !== term);
        console.log(`Updated available terms after deletion:`, updated);
        return updated;
      });
      
      // If currently on the deleted term, switch to Term 1
      if (selectedTerm === term) {
        console.log(`Currently on deleted Term ${term}, switching to Term 1`);
        setSelectedTerm(1);
      }
      
      console.log(`Term ${term} successfully deleted`);
    } catch (error) {
      console.error(`Error in deleteTerm:`, error);
    }
  };

  // Handle term change
  const handleTermChange = async (value: string) => {
    if (value === 'add') {
      await addNewTerm();
    } else {
      // Save current term data before switching
      if (!isInitialLoad) {
        await saveData();
      }
      
      // Switch to the selected term
      setSelectedTerm(Number(value));
    }
  };

  // Add a useEffect to reset the calculator when a user logs out
  useEffect(() => {
    // If the auth is initialized but there's no user, this means user has logged out
    if (authInitialized && !user) {
      console.log('User logged out, resetting calculator to fresh state');
      
      // Clear all session data for terms
      Object.keys(sessionStorage)
        .filter(key => key.startsWith('term_'))
        .forEach(key => {
          console.log(`Clearing session data for ${key}`);
          sessionStorage.removeItem(key);
        });
      
      // Reset to default state
      setCourses([{
        id: crypto.randomUUID(),
        code: '',
        name: '',
        units: 3,
        grade: 0,
        nas: false,
      }]);
      
      // Reset to Term 1
      setSelectedTerm(1);
      
      // Reset to default terms (1-12 only)
      console.log('Resetting to default terms (1-12)');
      setAvailableTerms([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      
      // Reset flowchart exemption
      setIsFlowchartExempt(false);
    }
  }, [user, authInitialized]);

  // Cleanup any timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

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

      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-wrap justify-between">
          <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Term
          </label>
              <div className="flex gap-2">
          <select
            value={selectedTerm}
            onChange={async (e) => await handleTermChange(e.target.value)}
            className="w-full md:w-48 p-2 border border-gray-300 rounded"
          >
                  {availableTerms.map((term) => (
              <option key={term} value={term}>
                Term {term}
              </option>
            ))}
            {Math.max(...availableTerms) < 21 && (
              <option value="add" className="text-dlsu-green font-medium">
                + Add New Term
              </option>
            )}
          </select>
                
                {selectedTerm > 12 && (
                  <button
                    onClick={async () => await deleteTerm(selectedTerm)}
                    className="p-2 text-red-500 hover:text-red-700 border border-red-300 rounded hover:bg-red-50"
                    title="Delete this term"
                  >
                    <TrashIcon size={20} />
                  </button>
                )}
              </div>
        </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options
              </label>
              <label 
                htmlFor="flowchartExempt" 
                className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer"
              >
          <input
            type="checkbox"
            id="flowchartExempt"
            checked={isFlowchartExempt}
            onChange={(e) => setIsFlowchartExempt(e.target.checked)}
                  className="h-4 w-4 text-dlsu-green focus:ring-dlsu-green border-gray-300 rounded mr-2"
          />
                <span className="text-sm text-gray-700">
                  Flowchart exempts me from 12-unit requirement for this term
                </span>
          </label>
        </div>
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