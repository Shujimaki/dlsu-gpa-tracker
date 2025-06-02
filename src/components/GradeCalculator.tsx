import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, TrashIcon, X } from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface GradeCategory {
  id: string;
  name: string;
  weight: number;
  score: number;
}

interface Subject {
  id: string;
  name: string;
  passingGrade: number;
  categories: GradeCategory[];
}

interface GradeCalculatorProps {
  user?: FirebaseUser | null;
  authInitialized?: boolean;
}

// Preset passing grades and their corresponding transmutation tables
const PASSING_GRADE_PRESETS = [50, 55, 60, 65, 70];

// Hardcoded transmutation tables for each passing grade preset
const TRANSMUTATION_TABLES = {
  50: [
    { range: [95, 100], grade: 4.0 },
    { range: [90, 94.99], grade: 3.5 },
    { range: [82, 89.99], grade: 3.0 },
    { range: [75, 81.99], grade: 2.5 },
    { range: [66, 74.99], grade: 2.0 },
    { range: [58, 65.99], grade: 1.5 },
    { range: [50, 57.99], grade: 1.0 },
    { range: [0, 49.99], grade: 0.0 }
  ],
  55: [
    { range: [95, 100], grade: 4.0 },
    { range: [90, 94.99], grade: 3.5 },
    { range: [83, 89.99], grade: 3.0 },
    { range: [76, 82.99], grade: 2.5 },
    { range: [69, 75.99], grade: 2.0 },
    { range: [62, 68.99], grade: 1.5 },
    { range: [55, 61.99], grade: 1.0 },
    { range: [0, 54.99], grade: 0.0 }
  ],
  60: [
    { range: [95, 100], grade: 4.0 },
    { range: [90, 94.99], grade: 3.5 },
    { range: [84, 89.99], grade: 3.0 },
    { range: [78, 83.99], grade: 2.5 },
    { range: [72, 77.99], grade: 2.0 },
    { range: [66, 71.99], grade: 1.5 },
    { range: [60, 65.99], grade: 1.0 },
    { range: [0, 59.99], grade: 0.0 }
  ],
  65: [
    { range: [95, 100], grade: 4.0 },
    { range: [90, 94.99], grade: 3.5 },
    { range: [85, 89.99], grade: 3.0 },
    { range: [80, 84.99], grade: 2.5 },
    { range: [75, 79.99], grade: 2.0 },
    { range: [70, 74.99], grade: 1.5 },
    { range: [65, 69.99], grade: 1.0 },
    { range: [0, 64.99], grade: 0.0 }
  ],
  70: [
    { range: [96, 100], grade: 4.0 },
    { range: [92, 95.99], grade: 3.5 },
    { range: [88, 91.99], grade: 3.0 },
    { range: [83, 87.99], grade: 2.5 },
    { range: [78, 82.99], grade: 2.0 },
    { range: [74, 77.99], grade: 1.5 },
    { range: [70, 73.99], grade: 1.0 },
    { range: [0, 69.99], grade: 0.0 }
  ]
};

const GradeCalculator = ({ user, authInitialized = false }: GradeCalculatorProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: crypto.randomUUID(),
      name: 'Subject 1',
      passingGrade: 60,
      categories: []
    }
  ]);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user data and handle migration on login
  useEffect(() => {
    const loadAndMigrateData = async () => {
      if (!authInitialized) {
        // console.log("GradeCalc: Auth not initialized. Aborting load/migrate.");
        return;
      }
      setIsLoading(true);
      // console.log("GradeCalc: loadAndMigrateData START. User:", user ? user.uid : 'anonymous', "AuthInitialized:", authInitialized);

      let anonymousData = null;
      const anonymousDataString = sessionStorage.getItem('grade_calculator_data');
      if (anonymousDataString) {
        try {
          anonymousData = JSON.parse(anonymousDataString);
          // console.log("GradeCalc: Successfully parsed anonymous data:", anonymousData);
        } catch (e) {
          console.error("Error parsing anonymous grade_calculator_data from sessionStorage", e);
          anonymousData = null;
        }
      }

      const newLoginSession = sessionStorage.getItem('newLogin') === 'true';
      // console.log("GradeCalc: newLogin flag from session:", newLoginSession);

      if (user) { // User is logged in
        if (newLoginSession) {
          // console.log("GradeCalc: New login detected. Clearing newLogin flag. Migration will be attempted.");
          sessionStorage.removeItem('newLogin'); // Clear the flag, but still proceed to check for migration
        }
        
        let firestoreSubjects: Subject[] = [];
        let firestoreActiveSubjectId: string | null = null;
        let firestoreDocExists = false;

        try {
          const userRef = doc(db, 'users', user.uid);
          const gradeCalcRef = doc(userRef, 'settings', 'gradeCalculator');
          const firestoreDoc = await getDoc(gradeCalcRef);

          if (firestoreDoc.exists()) {
            firestoreDocExists = true;
            const data = firestoreDoc.data();
            // console.log("GradeCalc: Firestore data exists:", data);
            if (data.subjects && Array.isArray(data.subjects)) {
              firestoreSubjects = data.subjects;
            }
            if (data.activeSubjectId) {
              const subjectExists = firestoreSubjects.some((s: Subject) => s.id === data.activeSubjectId);
              firestoreActiveSubjectId = subjectExists ? data.activeSubjectId : (firestoreSubjects.length > 0 ? firestoreSubjects[0].id : null);
            } else if (firestoreSubjects.length > 0) {
               firestoreActiveSubjectId = firestoreSubjects[0].id;
            }
          } else {
            // console.log("GradeCalc: No Firestore data document exists for gradeCalculator settings.");
          }
        } catch (error) {
          console.error("GradeCalc: Error loading Firestore data:", error);
        }
        
        // Migration Condition - now happens even if newLoginSession was true, after flag is cleared.
        const firestoreIsEmptyOrTrulyDefault = firestoreSubjects.length === 0;
        const anonymousHasDataToMigrate = anonymousData && anonymousData.subjects && anonymousData.subjects.length > 0;
        // console.log(`GradeCalc: Migration check: Firestore empty: ${firestoreIsEmptyOrTrulyDefault}, Anonymous has data: ${anonymousHasDataToMigrate}, Was new login: ${newLoginSession}`); // Log if it was new

        if (firestoreIsEmptyOrTrulyDefault && anonymousHasDataToMigrate) {
          // console.log("GradeCalc: MIGRATING anonymous data to Firestore.");
          const subjectsToMigrate = anonymousData.subjects.slice(0, 8);
          setSubjects(subjectsToMigrate);
          let newActiveSubjectId = anonymousData.activeSubjectId;
          const activeMigratedSubjectExists = subjectsToMigrate.some((s: Subject) => s.id === newActiveSubjectId);
          newActiveSubjectId = activeMigratedSubjectExists ? newActiveSubjectId : (subjectsToMigrate.length > 0 ? subjectsToMigrate[0].id : null);
          setActiveSubjectId(newActiveSubjectId);

          try {
            const userRef = doc(db, 'users', user.uid); // Re-declare for safety within this scope
            await setDoc(doc(userRef, 'settings', 'gradeCalculator'), { 
              subjects: subjectsToMigrate,
              activeSubjectId: newActiveSubjectId
            }, { merge: true });
            // console.log("GradeCalc: Anonymous data successfully migrated and saved to Firestore.");
            sessionStorage.removeItem('grade_calculator_data');
          } catch (saveError) {
            console.error("GradeCalc: Error saving migrated data to Firestore:", saveError);
          }
          setIsLoading(false);
          // console.log("GradeCalc: Migration completed, isLoading set to false. Returning.");
          return; // Migration done
        }

        // If not migrated, load from Firestore or set defaults
        // This part now also handles the case where it *was* a newLoginSession but no migration occurred (e.g. no anonymous data)
        // console.log("GradeCalc: Not migrating or migration already handled. Loading from Firestore or using default.");
        if (firestoreDocExists && firestoreSubjects.length > 0) {
          // console.log("GradeCalc: Setting state from existing Firestore data.");
          setSubjects(firestoreSubjects);
          setActiveSubjectId(firestoreActiveSubjectId);
        } else {
          // Firestore is effectively empty (or doc doesn't exist) and no migration happened.
          // console.log("GradeCalc: Firestore empty/no doc and no migration. Setting to default initial state.");
          const defaultInitialSubject = { id: crypto.randomUUID(), name: 'Subject 1', passingGrade: 60, categories: [] };
          setSubjects([defaultInitialSubject]);
          setActiveSubjectId(defaultInitialSubject.id);
          // If it was a new login session AND Firestore doc didn't exist AND no migration happened, save default state.
          if (newLoginSession && !firestoreDocExists && !(firestoreIsEmptyOrTrulyDefault && anonymousHasDataToMigrate) && user) { 
            // console.log("GradeCalc: New login, Firestore doc didn't exist, and no migration occurred. Saving default state to Firestore.");
            try {
                const userRef = doc(db, 'users', user.uid);
                await setDoc(doc(userRef, 'settings', 'gradeCalculator'), { 
                    subjects: [defaultInitialSubject],
                    activeSubjectId: defaultInitialSubject.id
                }, { merge: true });
            } catch (e) { console.error("GradeCalc: Failed to save default state for new user", e);}
          }
        }
      } else if (!user && authInitialized) { // Anonymous user
        // console.log("GradeCalc: Anonymous user. Loading from sessionStorage if available.");
        if (anonymousData && anonymousData.subjects && Array.isArray(anonymousData.subjects)) {
          setSubjects(anonymousData.subjects);
          // Set active subject from saved data or use the first one
          if (anonymousData.activeSubjectId) {
            const subjectExists = anonymousData.subjects.some((s: Subject) => s.id === anonymousData.activeSubjectId);
            if (subjectExists) {
              setActiveSubjectId(anonymousData.activeSubjectId);
            } else if (anonymousData.subjects.length > 0) {
              setActiveSubjectId(anonymousData.subjects[0].id);
            }
          } else if (anonymousData.subjects.length > 0) {
            setActiveSubjectId(anonymousData.subjects[0].id);
          }
        } else {
           // No anonymous data, or it's invalid, so set to default initial state
           const defaultInitialSubject = { id: crypto.randomUUID(), name: 'Subject 1', passingGrade: 60, categories: [] };
           setSubjects([defaultInitialSubject]);
           setActiveSubjectId(defaultInitialSubject.id);
        }
      } else {
        // Auth not initialized yet, or some other state. Usually means isLoading should remain true.
        // Or, if !authInitialized, we might not want to do anything yet.
        // For now, this path implies we're waiting for auth.
        // console.log("GradeCalc: Auth not initialized or user state unclear, will wait.");
      }
      setIsLoading(false);
    };
    
    if(authInitialized) { // Only run if auth has initialized
      loadAndMigrateData();
    }
  }, [user, authInitialized]); // Trigger on user or auth state change

  // Save data when subjects or activeSubjectId change
  useEffect(() => {
    const saveData = async () => {
      if (isLoading) return; // Don't save during initial load
      
      setSaveStatus('Saving...');
      
      if (user && authInitialized) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(doc(userRef, 'settings', 'gradeCalculator'), { 
            subjects,
            activeSubjectId 
          }, { merge: true });
          setSaveStatus('Settings saved');
          setTimeout(() => setSaveStatus(null), 2000);
        } catch (error) {
          setSaveStatus('Error saving');
          setTimeout(() => setSaveStatus(null), 2000);
        }
      } else {
        // For anonymous users, save to session storage
        try {
          sessionStorage.setItem('grade_calculator_data', JSON.stringify({ 
            subjects,
            activeSubjectId 
          }));
          setSaveStatus('Settings saved');
          setTimeout(() => setSaveStatus(null), 2000);
        } catch (error) {
          setSaveStatus('Error saving');
          setTimeout(() => setSaveStatus(null), 2000);
        }
      }
    };
    
    // Debounce save to avoid too many requests
    const timeoutId = setTimeout(saveData, 1000);
    return () => clearTimeout(timeoutId);
  }, [subjects, activeSubjectId, user, authInitialized, isLoading]);

  // Set the first subject as active by default if none is active
  useEffect(() => {
    if (subjects.length > 0 && !activeSubjectId) {
      setActiveSubjectId(subjects[0].id);
    }
  }, [subjects, activeSubjectId]);

  // Add a useEffect to reset the calculator when a user logs out
  useEffect(() => {
    // If the auth is initialized but there's no user, this means user has logged out
    if (authInitialized && !user) {
      // Clear data from session storage
      sessionStorage.removeItem('grade_calculator_data');
      
      // Reset to default state
      setSubjects([{
        id: crypto.randomUUID(),
        name: 'Subject 1',
        passingGrade: 60,
        categories: []
      }]);
      
      // Reset active subject ID
      setActiveSubjectId(null);
    }
  }, [user, authInitialized]);

  // Clear anonymous session marker when component unmounts
  useEffect(() => {
    return () => {
      // Only clear if user is not logged in
      if (!user) {
        sessionStorage.removeItem('anonymousSession');
      }
    };
  }, [user]);

  const activeSubject = useMemo(() => {
    return subjects.find(subject => subject.id === activeSubjectId) || null;
  }, [subjects, activeSubjectId]);

  // Calculate the total weighted score for the active subject
  const { totalWeight, finalGrade } = useMemo(() => {
    if (!activeSubject) {
      return { totalWeight: 0, finalGrade: 0 };
    }

    let totalWeight = 0;
    let weightedScore = 0;

    activeSubject.categories.forEach(category => {
      totalWeight += category.weight;
      weightedScore += (category.score / 100) * category.weight;
    });

    return { 
      totalWeight, 
      finalGrade: totalWeight > 0 ? weightedScore : 0 
    };
  }, [activeSubject]);

  // Get the transmutation table based on the active subject's passing grade
  const transmutationTable = useMemo(() => {
    if (!activeSubject) return [];

    // Find the closest preset passing grade
    const passingGrade = activeSubject.passingGrade;
    const closestPreset = PASSING_GRADE_PRESETS.reduce((prev, curr) => 
      Math.abs(curr - passingGrade) < Math.abs(prev - passingGrade) ? curr : prev
    );
    
    // Return the corresponding transmutation table
    return TRANSMUTATION_TABLES[closestPreset as keyof typeof TRANSMUTATION_TABLES];
  }, [activeSubject]);

  // Get the transmuted grade from the weighted score
  const transmutedGrade = useMemo(() => {
    if (!activeSubject || transmutationTable.length === 0) return 0;

    // Find the appropriate grade from the table
    const entry = transmutationTable.find(
      entry => finalGrade >= entry.range[0] && finalGrade <= entry.range[1]
    );

    return entry ? entry.grade : 0;
  }, [activeSubject, finalGrade, transmutationTable]);

  // Add a new subject
  const addSubject = () => {
    if (subjects.length >= 8) {
      alert("Maximum of 8 subjects allowed");
      return;
    }
    
    const newSubject: Subject = {
      id: crypto.randomUUID(),
      name: `New Subject`,
      passingGrade: 60,
      categories: []
    };
    
    setSubjects([...subjects, newSubject]);
    setActiveSubjectId(newSubject.id);
  };

  // Remove a subject
  const removeSubject = (id: string) => {
    const updatedSubjects = subjects.filter(subject => subject.id !== id);
    setSubjects(updatedSubjects);
    
    // If the active subject was removed, set a new active subject
    if (activeSubjectId === id && updatedSubjects.length > 0) {
      setActiveSubjectId(updatedSubjects[0].id);
    } else if (updatedSubjects.length === 0) {
      setActiveSubjectId(null);
    }
  };

  // Update subject name with character limit
  const updateSubjectName = (id: string, name: string) => {
    // Limit to 30 characters
    const limitedName = name.slice(0, 30);
    
    setSubjects(
      subjects.map(subject => 
        subject.id === id ? { ...subject, name: limitedName } : subject
      )
    );
  };

  // Update passing grade
  const updatePassingGrade = (id: string, passingGrade: number) => {
    // Find the closest preset
    const closestPreset = PASSING_GRADE_PRESETS.reduce((prev, curr) => 
      Math.abs(curr - passingGrade) < Math.abs(prev - passingGrade) ? curr : prev
    );
    
    setSubjects(
      subjects.map(subject => 
        subject.id === id ? { ...subject, passingGrade: closestPreset } : subject
      )
    );
  };

  // Add a new category to the active subject
  const addCategory = () => {
    if (!activeSubject) return;

    // Limit to 8 categories per subject
    if (activeSubject.categories.length >= 8) {
      alert("Maximum of 8 categories allowed per subject.");
      return;
    }

    const newCategory: GradeCategory = {
      id: crypto.randomUUID(),
      name: '',
      weight: 0,
      score: 0
    };

    setSubjects(
      subjects.map(subject => 
        subject.id === activeSubject.id 
          ? { ...subject, categories: [...subject.categories, newCategory] } 
          : subject
      )
    );
  };

  // Remove a category from the active subject
  const removeCategory = (categoryId: string) => {
    if (!activeSubject) return;

    setSubjects(
      subjects.map(subject => 
        subject.id === activeSubject.id 
          ? { 
              ...subject, 
              categories: subject.categories.filter(c => c.id !== categoryId) 
            } 
          : subject
      )
    );
  };

  // Update a category
  const updateCategory = (categoryId: string, field: keyof GradeCategory, value: string | number) => {
    if (!activeSubject) return;

    let processedValue = value;

    if (field === 'weight') {
      const numValue = Number(value);
      const otherCategoriesWeight = activeSubject.categories.reduce((sum, category) =>
        category.id === categoryId ? sum : sum + category.weight, 0);
      const newTotalWeight = otherCategoriesWeight + numValue;

      if (newTotalWeight > 100) {
        alert(`Total weight cannot exceed 100%. Current total without this category: ${otherCategoriesWeight}%. Maximum value you can enter: ${100 - otherCategoriesWeight}%`);
        return;
      }
      processedValue = numValue; // Ensure weight is stored as a number
    } else if (field === 'score') {
      const numValue = Number(value);
      if (numValue < 0 || numValue > 100) {
        alert("Score must be between 0 and 100%.");
        // Optionally, clamp the value or revert to previous instead of just returning
        // For now, we prevent the update if out of bounds.
        return; 
      }
      // Round to exactly 2 decimal places to prevent precision issues
      processedValue = Math.round((numValue + Number.EPSILON) * 100) / 100;
    }

    setSubjects(
      subjects.map(subject =>
        subject.id === activeSubject.id
          ? {
            ...subject,
            categories: subject.categories.map(category =>
              category.id === categoryId
                ? { ...category, [field]: processedValue } // Use processedValue
                : category
            )
          }
          : subject
      )
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dlsu-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with save status */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-dlsu-green mb-2">Grade Calculator</h2>
          {saveStatus && (
            <div className="text-sm text-green-600">
              {saveStatus}
            </div>
          )}
        </div>
        <p className="text-gray-600">
          Calculate your subject grades based on weighted components.
        </p>
      </div>

      {/* Subject Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="grade-calc-subject-tabs-container flex flex-row overflow-x-auto border-b p-2 bg-gray-50 space-x-2">
          {subjects.map(subject => {
            const isActive = activeSubjectId === subject.id;
            return (
              <button
                key={subject.id}
                onClick={() => setActiveSubjectId(subject.id)}
                className={`grade-calc-subject-button px-3 py-0 rounded-md whitespace-nowrap flex flex-row items-center justify-between min-w-[170px] max-w-[170px] h-10 flex-shrink-0 ${
                  isActive
                    ? 'bg-dlsu-green text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="flex-grow flex items-center mr-2 truncate" title={subject.name}>
                  {subject.name}
                </span>
                {subjects.length > 1 && (
                  <div className="flex items-center flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSubject(subject.id);
                      }}
                      className={`p-1 rounded-full flex items-center justify-center transition-colors duration-150 ${
                        isActive
                          ? 'text-red-500 hover:bg-red-600 hover:text-white'
                          : 'text-gray-500 hover:bg-red-100 hover:text-red-500'
                      }`}
                      aria-label="Remove subject"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </button>
            );
          })}
          {/* Conditional rendering for Add Subject button or Max Subject indicator */}
          {subjects.length < 8 ? (
            <button
              onClick={addSubject}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center flex-shrink-0 h-10"
            >
              <PlusCircle size={16} className="mr-1" />
              <span>Add Subject</span>
            </button>
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500 italic flex items-center flex-shrink-0 h-10">
              Max 8 subjects reached
            </div>
          )}
        </div>

        {activeSubject && (
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm text-gray-500 mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={activeSubject.name}
                  onChange={(e) => updateSubjectName(activeSubject.id, e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-dlsu-green focus:border-transparent"
                  maxLength={30}
                />
              </div>
              <div className="w-full md:w-40">
                <label className="block text-sm text-gray-500 mb-1">
                  Passing Grade (%)
                </label>
                <select
                  value={activeSubject.passingGrade}
                  onChange={(e) => updatePassingGrade(activeSubject.id, Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-dlsu-green focus:border-transparent"
                >
                  {PASSING_GRADE_PRESETS.map(preset => (
                    <option key={preset} value={preset}>{preset}%</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Minimum score to pass (1.0)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Grade Computations Table */}
              <div className="md:col-span-2">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Grade Computations</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 mb-4">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Category</th>
                        <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700 w-24">Weight (%)</th>
                        <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700 w-24">Score (%)</th>
                        <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700 w-24">Weighted</th>
                        <th className="py-2 px-4 border-b w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSubject.categories.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 px-4 text-center text-gray-500 italic">
                            No categories added yet
                          </td>
                        </tr>
                      ) : (
                        activeSubject.categories.map(category => (
                          <tr key={category.id} className={`border-b hover:bg-gray-50 ${activeSubject.categories.indexOf(category) % 2 === 0 ? '!bg-white' : '!bg-slate-100'}`}>
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                value={category.name}
                                onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                                placeholder="Category name"
                                className="w-full p-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-dlsu-green focus:border-transparent"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="number"
                                value={category.weight}
                                onChange={(e) => updateCategory(category.id, 'weight', Number(e.target.value))}
                                min="0"
                                max="100"
                                className="w-full p-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-dlsu-green focus:border-transparent text-center"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="number"
                                value={category.score}
                                onChange={(e) => updateCategory(category.id, 'score', Number(e.target.value))}
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-full p-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-dlsu-green focus:border-transparent text-center"
                              />
                            </td>
                            <td className="py-2 px-4 text-center">
                              {((category.score / 100) * category.weight).toFixed(2)}
                            </td>
                            <td className="py-2 px-4 text-center">
                              <button
                                onClick={() => removeCategory(category.id)}
                                className="p-1.5 hover:bg-red-100 rounded-full"
                              >
                                <TrashIcon size={16} className="text-gray-400 hover:text-red-500" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                      <tr className="bg-gray-50 font-medium">
                        <td className="py-2 px-4 text-right">Total</td>
                        <td className="py-2 px-4 text-center">{totalWeight.toFixed(2)}%</td>
                        <td className="py-2 px-4"></td>
                        <td className="py-2 px-4 text-center">{finalGrade.toFixed(2)}%</td>
                        <td className="py-2 px-4"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <button
                  onClick={addCategory}
                  className="mt-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center"
                >
                  <PlusCircle size={16} className="mr-1" />
                  <span>Add Category</span>
                </button>
              </div>

              {/* Grade Transmutation Table */}
              <div className="md:col-span-1">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Grade Transmutation</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 mb-4">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 border-b text-left text-sm font-medium text-gray-700">Percentage Range</th>
                        <th className="py-2 px-4 border-b text-center text-sm font-medium text-gray-700">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transmutationTable.map((row, index) => (
                        <tr key={index} className={`border-b hover:bg-gray-50 ${
                          finalGrade >= row.range[0] && finalGrade <= row.range[1] ? 'bg-green-50 font-medium' : 
                          index % 2 === 0 ? '!bg-white' : '!bg-slate-100'
                        }`}>
                          <td className="py-2 px-4">
                            {row.range[0].toFixed(2)}% - {row.range[1].toFixed(2)}%
                          </td>
                          <td className="py-2 px-4 text-center">{row.grade.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-100 p-4 rounded-lg text-center mt-4">
                  <p className="text-sm text-gray-600 mb-1">Final Grade</p>
                  <p className="text-3xl font-bold text-dlsu-green">{transmutedGrade.toFixed(1)}</p>
                  <p className="text-sm text-gray-500 mt-1">Raw score: {finalGrade.toFixed(2)}%</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {activeSubject.passingGrade}% is the minimum to pass (1.0)
                  </p>
                  <p className="text-xs text-gray-400 mt-1 italic">
                    Note: These grades are not final. Please refer to the official grades posted on MLS.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeCalculator; 