import { useState, useEffect, useMemo } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { saveUserProjectionSettings, loadUserProjectionSettings } from '../config/firestore';
import type { ProjectionSettings } from '../config/firestore';


interface CGPAProjectionsProps {
  user?: FirebaseUser | null;
  authInitialized?: boolean;
}

const CGPAProjections = ({ user, authInitialized = false }: CGPAProjectionsProps) => {
  // State for user inputs
  const [targetCGPA, setTargetCGPA] = useState<number>(3.4);
  const [totalUnits, setTotalUnits] = useState<number>(200); // Default total units to graduate
  const [totalUnitsInput, setTotalUnitsInput] = useState<string>("200"); // String state for input field
  
  // State for data from CGPA Calculator
  const [currentCGPA, setCurrentCGPA] = useState<number>(0);
  const [earnedUnits, setEarnedUnits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load user settings and handle migration on login
  useEffect(() => {
    const loadAndMigrateSettings = async () => {
      if (!authInitialized) return;
      setIsLoading(true); // Start loading indicator

      // 1. Try to get current anonymous data first
      let anonymousSettings: ProjectionSettings | null = null;
      const anonymousSettingsString = sessionStorage.getItem('projection_settings');
      if (anonymousSettingsString) {
        try {
          anonymousSettings = JSON.parse(anonymousSettingsString) as ProjectionSettings;
        } catch (e) {
          console.error("Error parsing anonymous projection_settings from sessionStorage", e);
          anonymousSettings = null;
        }
      }
      // console.log("CGPAProj: Initial anonymous settings snapshot:", anonymousSettings);

      const newLoginSession = sessionStorage.getItem('newLogin') === 'true';
      // console.log("CGPAProj: newLogin flag from session:", newLoginSession);

      if (user) { // Logged-in user
        if (newLoginSession) {
          // console.log("CGPAProj: New login detected. Clearing newLogin flag. Migration will be attempted.");
          sessionStorage.removeItem('newLogin'); // Clear the flag, but still proceed to check for migration
        }

        let firestoreSettings: ProjectionSettings | null = null;
        try {
          firestoreSettings = await loadUserProjectionSettings(user.uid);
          // console.log("CGPAProj: Firestore settings loaded:", firestoreSettings);
        } catch (err) {
          console.error('Error loading user projection settings from Firestore:', err);
          // If Firestore load fails, we might still proceed with migration if anonymous data exists
          // or fall back to defaults. For now, just log and continue.
        }

        // 2b. Migration Condition
        // Defaults: targetCGPA: 3.4, totalUnits: 200
        const firestoreIsDefault = 
          !firestoreSettings || 
          (firestoreSettings.targetCGPA === 3.4 && firestoreSettings.totalUnits === 200);
        
        const anonymousHasDataToMigrate = 
          anonymousSettings && 
          (anonymousSettings.targetCGPA !== 3.4 || anonymousSettings.totalUnits !== 200);

        // console.log(`CGPAProj: Migration check: Firestore default: ${firestoreIsDefault}, Anonymous has data: ${anonymousHasDataToMigrate}, Was new login: ${newLoginSession}`);

        if (firestoreIsDefault && anonymousHasDataToMigrate && anonymousSettings) {
          // console.log("CGPAProj: MIGRATING anonymous settings to Firestore.");
          setTargetCGPA(anonymousSettings.targetCGPA);
          setTotalUnits(anonymousSettings.totalUnits);
          setTotalUnitsInput(anonymousSettings.totalUnits.toString());

          try {
            await saveUserProjectionSettings(user.uid, anonymousSettings);
            // console.log("CGPAProj: Anonymous settings successfully migrated and saved to Firestore.");
            sessionStorage.removeItem('projection_settings'); // Clear session data after migration
          } catch (saveError) {
            console.error("CGPAProj: Error saving migrated settings to Firestore:", saveError);
          }
          // Migration done, UI updated, Firestore save attempted.
        } else if (firestoreSettings) {
          // Load from Firestore (if not default or no migration needed)
          // This also handles: was newLogin, but no anon data to migrate, and Firestore data exists.
          // console.log("CGPAProj: Not migrating. Loading from existing Firestore settings.");
          setTargetCGPA(firestoreSettings.targetCGPA);
          setTotalUnits(firestoreSettings.totalUnits);
          setTotalUnitsInput(firestoreSettings.totalUnits.toString());
        } else {
          // No Firestore settings and no migration happened. Ensure defaults and save to Firestore.
          // This handles: was newLogin, no anon data, no Firestore OR existing user, no anon data, no Firestore.
          // console.log("CGPAProj: No Firestore settings & no migration. Ensuring default settings and saving to Firestore if user exists.");
          setTargetCGPA(3.4);
          setTotalUnits(200);
          setTotalUnitsInput("200");
          if (user) { // Ensure user exists before saving default settings for them
            try {
              await saveUserProjectionSettings(user.uid, { targetCGPA: 3.4, totalUnits: 200 });
              // console.log("CGPAProj: Default settings saved to Firestore for user.");
            } catch (saveError) {
              console.error("CGPAProj: Error saving default settings to Firestore:", saveError);
            }
          }
        }
      } else { // Anonymous user
        // console.log("CGPAProj: Anonymous user. Loading from sessionStorage if available.");
        if (anonymousSettings) {
          if (typeof anonymousSettings.targetCGPA === 'number') {
            setTargetCGPA(anonymousSettings.targetCGPA);
          }
          if (typeof anonymousSettings.totalUnits === 'number') {
            setTotalUnits(anonymousSettings.totalUnits);
            setTotalUnitsInput(anonymousSettings.totalUnits.toString());
          }
        } else {
          // No anonymous settings, use/retain defaults
          // console.log("CGPAProj: Anonymous user, no session settings, using defaults.");
          setTargetCGPA(3.4);
          setTotalUnits(200);
          setTotalUnitsInput("200");
        }
      }
    // setIsLoading(false); // Set loading to false after all operations for this effect
    }; // end of loadAndMigrateSettings
    
    // Call loadAndMigrateSettings only when auth is initialized
    if (authInitialized) {
        loadAndMigrateSettings().finally(() => setIsLoading(false));
    }
  }, [user, authInitialized]);

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

  // Save settings for ANONYMOUS users to sessionStorage (immediately)
  useEffect(() => {
    if (isLoading || !authInitialized || user) {
      // Only run if not loading, auth is initialized, and user is anonymous
      return;
    }

    try {
      // console.log('Saving anonymous projection settings to sessionStorage:', { targetCGPA, totalUnits });
      sessionStorage.setItem('projection_settings', JSON.stringify({ targetCGPA, totalUnits }));
    } catch (err) {
      console.error('Error saving anonymous projection settings to sessionStorage:', err);
    }
  }, [targetCGPA, totalUnits, isLoading, authInitialized, user]);

  // Save settings for LOGGED-IN users to Firestore (debounced)
  useEffect(() => {
    if (isLoading || !authInitialized || !user) {
      // Only run if not loading, auth is initialized, and user is logged IN
      return;
    }

    const saveToFirestore = async () => {
      setSaveStatus('Saving...'); // Indicator for async Firestore operation
      try {
        const settings: ProjectionSettings = { targetCGPA, totalUnits };
        const saved = await saveUserProjectionSettings(user.uid, settings);
        if (saved) {
          setSaveStatus('Settings saved');
        } else {
          setSaveStatus('Error saving');
        }
      } catch (err) {
        console.error('Error saving projection settings to Firestore:', err);
        setSaveStatus('Error saving');
      }
      setTimeout(() => setSaveStatus(null), 2000);
    };
    
    const timeoutId = setTimeout(saveToFirestore, 1000);
    return () => clearTimeout(timeoutId);
  }, [targetCGPA, totalUnits, isLoading, authInitialized, user]); // Added isLoading and authInitialized

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

  return (
    <div className="space-y-6">
      {/* CGPA Projections Header */}
      <div className="card">
        <div className="card-header flex flex-col sm:flex-row justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Cumulative GPA Projections</h2>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-500">
            Calculate the GPA you need to achieve in your remaining terms to reach your target CGPA.
          </p>
        </div>
      </div>

      {/* Current Status and Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-medium text-gray-700">Current Status</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Current CGPA</p>
                <p className="text-2xl font-bold text-dlsu-green">{formatGPA(currentCGPA)}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Earned Units</p>
                <p className="text-xl font-semibold text-gray-700">{earnedUnits}</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Inputs */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-medium text-gray-700">Target Settings</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <label htmlFor="targetCGPA" className="block text-xs font-medium text-gray-700 mb-1.5">
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
                  className="w-full sm:w-auto px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-dlsu-green focus:border-dlsu-green"
                />
              </div>
              
              <div>
                <label htmlFor="totalUnits" className="block text-xs font-medium text-gray-700 mb-1.5">
                  Total Units to Graduate
                </label>
                <input
                  type="text"
                  id="totalUnits"
                  value={totalUnitsInput}
                  onChange={(e) => handleTotalUnitsChange(e.target.value)}
                  className="w-full sm:w-auto px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-dlsu-green focus:border-dlsu-green"
                />
              </div>
              
              {user && saveStatus && (
                <div className="text-xs text-green-600">
                  {saveStatus}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Projection Results */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-base font-medium text-gray-700">Projection Results</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Remaining Units</p>
              <p className="text-xl font-semibold text-gray-700">{remainingUnits}</p>
            </div>
            
            <div>
              <p className="text-xs text-gray-500 mb-1">Required GPA for Remaining Units</p>
              <p className={`text-2xl font-bold ${getGPAColorClass(projectedGPA)}`}>
                {isAchievable ? formatGPA(projectedGPA) : 'Not achievable'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formula Explanation */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-base font-medium text-gray-700">How is this calculated?</h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-gray-600 mb-4">
            The required GPA for your remaining units is calculated using this formula:
          </p>
          <div className="bg-gray-50 p-3 rounded border border-gray-300 font-mono text-sm overflow-x-auto">
            Required GPA = (Target CGPA × Total Units - Current CGPA × Earned Units) ÷ Remaining Units
          </div>
        </div>
      </div>
    </div>
  );
};

export default CGPAProjections; 