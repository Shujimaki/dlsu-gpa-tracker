import { useState, useEffect, useMemo } from 'react';
import { getUserTerms, loadUserData, saveUserCGPASettings, loadUserCGPASettings, loadTermToggles } from '../config/firestore';
import type { Course } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import type { CGPASettings } from '../config/firestore';
import { Edit, PlusCircle, TrashIcon, X } from 'lucide-react';

interface QuickTerm {
  id: string;
  label: string;
  gpa: number;
  units: number;
}

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
  isManuallyExcluded: boolean;
}

const CGPACalculator = ({ user, authInitialized = false, onEditTerm }: CGPACalculatorProps) => {
  const [termsData, setTermsData] = useState<TermSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditedUnits, setCreditedUnits] = useState<number>(0);
  const [creditedUnitsInput, setCreditedUnitsInput] = useState<string>("0");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [termOverrides, setTermOverrides] = useState<Record<number, boolean>>({});
  const [quickModalOpen, setQuickModalOpen] = useState<boolean>(false);
  const [quickTerms, setQuickTerms] = useState<QuickTerm[]>([{ id: crypto.randomUUID(), label: '', gpa: 0, units: 0 }]);
  const [quickInputValues, setQuickInputValues] = useState<Record<string, string>>({});
  const [quickTargetCGPA, setQuickTargetCGPA] = useState<number>(3.4);
  const [quickGradUnits, setQuickGradUnits] = useState<number>(200);

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
              } catch (e) { console.error("CGPACalc: Failed to save default CGPA settings when Firestore non-existent", e); }
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

  // Load quickTerms from sessionStorage on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('quick_cgpa_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.terms && Array.isArray(parsed.terms) && parsed.terms.length > 0) {
          setQuickTerms(parsed.terms);
        }
      }
    } catch {}
  }, []);

  // Save quickTerms to sessionStorage (debounced)
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        sessionStorage.setItem('quick_cgpa_data', JSON.stringify({ terms: quickTerms }));
      } catch {}
    }, 1000);
    return () => clearTimeout(id);
  }, [quickTerms]);

  // Quick mode computed values
  const { quickCGPA, quickTotalUnits, quickTotalWithCredited, quickActiveTerms } = useMemo(() => {
    const activeTerms = quickTerms.filter(t => t.units > 0);
    const totalUnits = activeTerms.reduce((s, t) => s + t.units, 0);
    const cgpaVal = totalUnits > 0
      ? activeTerms.reduce((s, t) => s + t.gpa * t.units, 0) / totalUnits
      : 0;
    return {
      quickCGPA: cgpaVal.toFixed(3),
      quickTotalUnits: totalUnits,
      quickTotalWithCredited: totalUnits + creditedUnits,
      quickActiveTerms: activeTerms.length
    };
  }, [quickTerms, creditedUnits]);

  const quickProjection = useMemo(() => {
    const currentCGPA = parseFloat(quickCGPA);
    const earned = quickTotalUnits;
    const remaining = Math.max(0, quickGradUnits - earned);
    if (remaining === 0) return { remaining: 0, required: 0, achievable: false };
    const required = (quickTargetCGPA * (earned + remaining) - currentCGPA * earned) / remaining;
    return { remaining, required, achievable: required >= 0 && required <= 4.0 };
  }, [quickCGPA, quickTotalUnits, quickTargetCGPA, quickGradUnits]);

  const addQuickTerm = () => {
    if (quickTerms.length >= 20) { alert('Maximum of 20 terms.'); return; }
    setQuickTerms(prev => [...prev, { id: crypto.randomUUID(), label: '', gpa: 0, units: 0 }]);
  };

  const removeQuickTerm = (id: string) => {
    setQuickTerms(prev => prev.filter(t => t.id !== id));
  };

  const updateQuickTerm = (id: string, field: 'label' | 'gpa' | 'units', value: string | number) => {
    setQuickTerms(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const setQInput = (key: string, val: string) =>
    setQuickInputValues(prev => ({ ...prev, [key]: val }));

  const clearQInput = (key: string) =>
    setQuickInputValues(prev => { const n = { ...prev }; delete n[key]; return n; });

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

        // Load term overrides
        let overrides: Record<number, boolean> = {};
        if (!isAnonymous && user) {
          const loaded = await loadTermToggles(user.uid);
          if (loaded) overrides = loaded;
        } else {
          const raw = sessionStorage.getItem('term_toggles');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed?.overrides) {
                overrides = Object.fromEntries(
                  Object.entries(parsed.overrides).map(([k, v]) => [Number(k), v as boolean])
                );
              }
            } catch {}
          }
        }
        setTermOverrides(overrides);

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
            const { gpa, totalUnits, totalNASUnits } = calculateTermGPA(termData.courses);
            const autoActive = totalUnits > 0;
            const isActive = overrides[term] ?? autoActive;
            const isManuallyExcluded = autoActive && overrides[term] === false;

            return {
              term,
              courses: termData.courses,
              gpa,
              totalUnits,
              totalNASUnits,
              isActive,
              isManuallyExcluded
            };
          }

          // Return empty term data if nothing found
          return {
            term,
            courses: [],
            gpa: '0.000',
            totalUnits: 0,
            totalNASUnits: 0,
            isActive: overrides[term] ?? false,
            isManuallyExcluded: false
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
        isActive: termOverrides[term] ?? false,
        isManuallyExcluded: false
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
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-dlsu-green/20 border-t-dlsu-green"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <div>
          <p className="font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-sm mt-2 bg-red-600 text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (termsData.length === 0) {
    return (
      <div className="card animate-mount">
        <div className="card-body flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 rounded-full bg-[#162019] flex items-center justify-center mb-4">
            <span className="text-xl">📊</span>
          </div>
          <h3 className="font-display font-semibold text-lg text-dlsu-slate mb-2">No Term Data Available</h3>
          <p className="text-sm text-gray-400 mb-5">Add courses in the GPA Calculator tab to get started.</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'gpa' }))}
            className="btn btn-primary btn-sm"
          >
            Go to GPA Calculator
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-mount">
      {/* CGPA Summary */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="font-display font-semibold text-base text-dlsu-slate">Cumulative GPA</h2>
          <button
            onClick={() => setQuickModalOpen(true)}
            className="btn btn-sm border border-[#2D3B33] text-gray-400 hover:text-dlsu-green hover:border-dlsu-green/40 gap-1.5 transition-colors text-xs"
          >
            <PlusCircle size={13} />
            Quick Calculator
          </button>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Active Terms', value: String(totalTerms), large: false },
              { label: 'Academic Units', value: String(totalUnits), large: false },
              { label: 'Total Units', value: String(totalWithCredited), large: false },
              { label: 'CGPA', value: cgpa, large: true },
            ].map(({ label, value, large }) => (
              <div key={label} className="text-center">
                <p className="stat-label mb-1">{label}</p>
                <p className={large ? 'stat-value text-dlsu-green' : 'font-display font-bold text-xl text-dlsu-slate'}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#1E2B24]">
            <div className="max-w-md">
              <label htmlFor="creditedUnits" className="input-label">
                Credited Units
                <span className="ml-1 text-gray-500 cursor-help">(?)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="creditedUnits"
                  value={creditedUnitsInput}
                  onChange={(e) => handleCreditedUnitsChange(e.target.value)}
                  className="input w-24"
                  min="0"
                />
                <span className="text-xs text-gray-500">
                  Units from previous school/degree (not counted in CGPA)
                </span>
              </div>
              {saveStatus && (
                <p className="text-xs text-dlsu-green font-medium mt-1">{saveStatus}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Terms by Year */}
      {Object.entries(termsByYear).map(([year, terms]) => (
        <div key={year} className="space-y-3">
          <h3 className="font-display font-semibold text-sm text-dlsu-slate px-1">{year}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {terms.map(term => (
              <div
                key={term.term}
                className={`card h-full transition-all ${term.isActive
                  ? 'border-l-[3px] border-l-dlsu-green'
                  : 'opacity-60'
                  }`}
              >
                <div className={`flex justify-between items-center py-2.5 px-4 border-b ${term.isActive ? 'border-[#1E2B24] bg-emerald-500/10' : 'border-[#1E2B24] bg-[#162019]'
                  }`}>
                  <div className="flex items-center gap-2">
                    <h4 className="font-display font-semibold text-sm text-dlsu-slate">Term {term.term}</h4>
                    {!term.isActive && (
                      <span className={`badge ${term.isManuallyExcluded ? 'bg-amber-500/20 text-amber-400' : 'bg-[#162019] text-gray-500'}`}>
                        {term.isManuallyExcluded ? 'Excluded' : 'Inactive'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onEditTerm(term.term)}
                    className="btn-icon p-1.5 text-gray-400 hover:text-dlsu-green hover:bg-[#162019] rounded-md transition-colors"
                    title="Edit Term"
                  >
                    <Edit size={14} />
                  </button>
                </div>

                <div className="p-4 flex flex-col h-full">
                  <div className="mb-3 text-center">
                    <div className={`font-display font-bold text-2xl ${term.isActive ? 'text-dlsu-green' : 'text-gray-500'}`}>
                      {term.gpa}
                    </div>
                    <div className="text-xs text-gray-500">
                      {term.totalUnits} units{term.totalNASUnits > 0 && ` (${term.totalNASUnits} NAS)`}
                    </div>
                  </div>

                  <div className="overflow-hidden flex-grow rounded-lg border border-[#1E2B24]">
                    <table className="min-w-full">
                      <thead className="bg-[#0D1410]">
                        <tr>
                          <th className="px-2 py-1.5 text-left text-[0.65rem] font-medium text-gray-500 uppercase tracking-wider">Code</th>
                          <th className="px-2 py-1.5 text-center text-[0.65rem] font-medium text-gray-500 uppercase tracking-wider w-12">Units</th>
                          <th className="px-2 py-1.5 text-center text-[0.65rem] font-medium text-gray-500 uppercase tracking-wider w-12">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E2B24] text-xs">
                        {term.courses.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-2 py-4 text-center text-gray-400 italic text-xs">
                              No courses yet
                            </td>
                          </tr>
                        ) : (
                          term.courses.map((course) => (
                            <tr key={course.id} className="hover:bg-[#162019]/50">
                              <td className="px-2 py-1.5 font-medium text-gray-300 truncate max-w-[100px]" title={course.code}>
                                {course.code || '–'}
                              </td>
                              <td className="px-2 py-1.5 text-center text-gray-500">
                                {course.nas ? `(${course.units})` : course.units}
                              </td>
                              <td className="px-2 py-1.5 text-center text-gray-500">
                                {course.nas && course.units === 0
                                  ? (course.grade > 0 ? 'P' : 'F')
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

      {/* Quick Calculator Modal */}
      {quickModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setQuickModalOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-[#0D1410] border border-[#1E2B24] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E2B24]">
              <div>
                <h2 className="font-display font-semibold text-base text-dlsu-slate">Quick CGPA Calculator</h2>
                <p className="text-xs text-gray-500 mt-0.5">Enter term GPAs directly — no course entry needed</p>
              </div>
              <button
                onClick={() => setQuickModalOpen(false)}
                className="btn-icon p-1.5 text-gray-500 hover:text-gray-200 hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Terms', value: String(quickActiveTerms) },
                  { label: 'Academic Units', value: String(quickTotalUnits) },
                  { label: 'Total Units', value: String(quickTotalWithCredited) },
                  { label: 'CGPA', value: quickCGPA },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center bg-[#162019] rounded-xl py-3 px-2 border border-[#1E2B24]">
                    <p className="stat-label mb-1">{label}</p>
                    <p className={`font-display font-bold ${label === 'CGPA' ? 'text-2xl text-dlsu-green' : 'text-lg text-dlsu-slate'}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Term table */}
              <div>
                <h3 className="font-display font-semibold text-sm text-dlsu-slate mb-2">Terms</h3>
                <div className="overflow-x-auto rounded-lg border border-[#1E2B24]">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Term Label</th>
                        <th className="text-center w-28">GPA (0–4)</th>
                        <th className="text-center w-24">Units</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {quickTerms.map(term => (
                        <tr key={term.id}>
                          <td>
                            <input
                              type="text"
                              value={term.label}
                              onChange={e => updateQuickTerm(term.id, 'label', e.target.value)}
                              placeholder="e.g. Term 1"
                              className="input py-1.5"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={quickInputValues[`${term.id}_gpa`] ?? String(term.gpa)}
                              onChange={e => {
                                const raw = e.target.value;
                                setQInput(`${term.id}_gpa`, raw);
                                if (raw === '' || raw === '.') return;
                                const n = Math.round(Math.min(4, Math.max(0, Number(raw))) * 1000) / 1000;
                                if (!isNaN(n)) updateQuickTerm(term.id, 'gpa', n);
                              }}
                              onBlur={() => clearQInput(`${term.id}_gpa`)}
                              min="0" max="4" step="0.001"
                              className="input py-1.5 text-center"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={quickInputValues[`${term.id}_units`] ?? String(term.units)}
                              onChange={e => {
                                const raw = e.target.value;
                                setQInput(`${term.id}_units`, raw);
                                if (raw === '' || raw === '.') return;
                                const n = Math.round(Math.max(0, Number(raw)) * 10) / 10;
                                if (!isNaN(n)) updateQuickTerm(term.id, 'units', n);
                              }}
                              onBlur={() => clearQInput(`${term.id}_units`)}
                              min="0" step="0.5"
                              className="input py-1.5 text-center"
                            />
                          </td>
                          <td className="text-center">
                            <button
                              onClick={() => removeQuickTerm(term.id)}
                              className="btn-icon p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                              aria-label="Remove term"
                            >
                              <TrashIcon size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button onClick={addQuickTerm} className="btn btn-primary btn-sm gap-1 mt-3">
                  <PlusCircle size={14} />
                  Add Term
                </button>
              </div>

              {/* Projections */}
              <div className="pt-5 border-t border-[#1E2B24]">
                <h3 className="font-display font-semibold text-sm text-dlsu-slate mb-4">Projections</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    <div>
                      <label className="input-label">Target CGPA</label>
                      <input
                        type="number"
                        value={quickTargetCGPA}
                        onChange={e => setQuickTargetCGPA(Math.round(Math.min(4, Math.max(0, parseFloat(e.target.value) || 0)) * 1000) / 1000)}
                        min="0" max="4" step="0.001"
                        className="input w-32"
                      />
                    </div>
                    <div>
                      <label className="input-label">Total Units to Graduate</label>
                      <input
                        type="number"
                        value={quickGradUnits}
                        onChange={e => setQuickGradUnits(Math.max(0, parseInt(e.target.value) || 0))}
                        min="0"
                        className="input w-32"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="stat-label mb-1">Remaining Units</p>
                      <p className="font-display font-bold text-xl text-dlsu-slate">{quickProjection.remaining}</p>
                    </div>
                    <div>
                      <p className="stat-label mb-1">Required GPA for Remaining Units</p>
                      <p className={`stat-value ${
                        quickProjection.remaining === 0 ? 'text-gray-500'
                          : !quickProjection.achievable ? 'text-red-400'
                          : quickProjection.required >= 3.5 ? 'text-dlsu-green'
                          : quickProjection.required >= 2.0 ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {quickProjection.remaining === 0 ? '—'
                          : quickProjection.achievable ? quickProjection.required.toFixed(3)
                          : 'Not achievable'}
                      </p>
                      {!quickProjection.achievable && quickProjection.remaining > 0 && (
                        <p className="text-xs text-red-500 mt-1">Required GPA exceeds 4.0 — adjust your target.</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-[#162019] p-3 rounded-lg border border-[#1E2B24] font-mono text-xs text-gray-400">
                  Required GPA = (Target × Total − Current × Earned) ÷ Remaining
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CGPACalculator; 