import { useState, useEffect } from 'react'
import Header from './components/Header'
import GPACalculator from './components/GPACalculator'
import CGPACalculator from './components/CGPACalculator'
import CGPAProjections from './components/CGPAProjections'
import GradeCalculator from './components/GradeCalculator'
import LoginModal from './components/LoginModal'
import TabNavigation from './components/TabNavigation'
import UpdateModal from './components/UpdateModal'
import TutorialModal from './components/TutorialModal'
import type { User as FirebaseUser } from 'firebase/auth'
import { auth } from './config/firebase';
import { onAuthStateChanged, signOut, setPersistence, browserSessionPersistence, browserLocalPersistence } from 'firebase/auth';
import { Mail, AlertTriangle } from 'lucide-react';

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(true) // Always start with true
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [activeTab, setActiveTab] = useState('gpa')
  const [authInitialized, setAuthInitialized] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(() => {
    // Initialize from sessionStorage if available, otherwise use term 1
    const storedTerm = sessionStorage.getItem('currentTerm');
    return storedTerm ? parseInt(storedTerm, 10) : 1;
  });

  // Anonymous user warning state
  const [showAnonymousWarning, setShowAnonymousWarning] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  // Add basic beforeunload handler for anonymous users
  useEffect(() => {
    // Only add if user is not logged in and auth is initialized
    if (authInitialized && !user) {
      console.log("Adding beforeunload handler for anonymous user");

      // NOTE: We intentionally removed the beforeunload handler since we're now showing
      // a permanent warning banner to the user. This avoids duplicate warnings.
      // If data loss prevention is critical in the future, this can be re-enabled.

      return () => {
        console.log("No beforeunload handler to remove");
      };
    }
  }, [authInitialized, user]);

  // Check for anonymous user data and show warning if needed
  useEffect(() => {
    // Skip if user is logged in or auth is not initialized
    if (user || !authInitialized) {
      return;
    }

    console.log("Setting up anonymous user data detection");

    // Function to check for user data
    const checkForUserData = () => {
      // Skip check if user is logged in
      if (user) return;

      const hasData = Object.keys(sessionStorage).some(key =>
        key.startsWith('term_') ||
        key === 'grade_calculator_data' ||
        key === 'cgpa_settings'
      );

      // Only update state if the value is changing to avoid re-renders
      if (hasData !== showAnonymousWarning) {
        console.log("Anonymous user data status changed:", hasData ? "Data found" : "No data");
        setShowAnonymousWarning(hasData);
      }
    };

    // Initial check
    checkForUserData();

    // Set up listeners for storage changes
    const handleStorageChange = () => {
      console.log("Storage changed, rechecking data");
      checkForUserData();
    };

    // Use storage event and periodic checks
    window.addEventListener('storage', handleStorageChange);

    // Check every 10 seconds as a fallback
    const interval = setInterval(checkForUserData, 10000);

    // Also check after any user interaction with the page
    document.addEventListener('click', checkForUserData);
    document.addEventListener('keydown', checkForUserData);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('click', checkForUserData);
      document.removeEventListener('keydown', checkForUserData);
      clearInterval(interval);
    };
  }, [user, authInitialized, showAnonymousWarning]);

  // Listen for tab switch events
  useEffect(() => {
    const handleSwitchTab = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };

    window.addEventListener('switchTab', handleSwitchTab);

    return () => {
      window.removeEventListener('switchTab', handleSwitchTab);
    };
  }, []);

  // Initialize auth with session persistence (instead of local)
  useEffect(() => {
    const setupAuth = async () => {
      try {
        // Prefer local persistence so users remain signed in across refreshes and browser restarts
        await setPersistence(auth, browserLocalPersistence);
        console.log("Firebase auth persistence set to local");
      } catch (err) {
        console.error("Error setting local persistence, falling back to session:", err);
        try {
          await setPersistence(auth, browserSessionPersistence);
          console.log("Firebase auth persistence set to session as fallback");
        } catch (err2) {
          console.error("Error setting session persistence fallback:", err2);
        }
      }
    }

    setupAuth();
  }, []);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthInitialized(true);

      // Hide warning when user is logged in
      if (user) {
        setShowAnonymousWarning(false);
        setWarningDismissed(false);
      }
      // If there's no logged-in user, clear any anonymous session data so anonymous visitors see default state
      if (!user) {
        console.log('No authenticated user detected — clearing anonymous session data to default state');
        // Preserve lastUpdateSeen so the update modal behavior persists
        const lastUpdateSeen = sessionStorage.getItem('lastUpdateSeen');
        sessionStorage.clear();
        if (lastUpdateSeen) sessionStorage.setItem('lastUpdateSeen', lastUpdateSeen);
      }

      console.log("Auth state changed:", user ? `User ${user.uid} logged in` : "No user logged in");
    });

    // Cleanup the listener on unmount
    return () => unsubscribe();
  }, []);

  // Check if update modal should be hidden based on sessionStorage
  useEffect(() => {
    const lastUpdateSeen = sessionStorage.getItem('lastUpdateSeen');
    if (lastUpdateSeen === '2025-05-24') {
      setShowUpdateModal(false);
    } else {
      console.log("Update modal should be shown");
    }
  }, []);

  // Handle user logout
  const handleLogout = async () => {
    try {
      // Clear all session data
      sessionStorage.clear();

      // Sign out of Firebase
      await signOut(auth);

      // Reset warning states
      setWarningDismissed(false);

      // Clear user state
      setUser(null);

      console.log("User logged out successfully, all session data cleared");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Handle editing a term from CGPA Calculator
  const handleEditTerm = (term: number) => {
    setSelectedTerm(term);
    setActiveTab('gpa');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <Header
        user={user}
        onLogin={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        onShowUpdates={() => setShowUpdateModal(true)}
        onShowTutorial={() => setShowTutorialModal(true)}
        onShowWarnings={() => setWarningDismissed(false)}
        hasWarnings={showAnonymousWarning && warningDismissed && !user}
      />

      {/* Anonymous user warning banner */}
      {showAnonymousWarning && !warningDismissed && (
        <div className="border-b border-amber-100 bg-amber-50/80">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-amber-700 text-sm truncate">
                  Your data is only saved temporarily.<span className="hidden sm:inline"> Data will be lost if you close this page.</span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setWarningDismissed(true)}
                  className="btn btn-ghost btn-sm text-xs text-gray-500"
                >
                  Hide
                </button>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="btn btn-primary btn-sm text-xs"
                >
                  Log in
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col w-full">
        {/* Tab Navigation */}
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 pt-5 pb-2">
          <TabNavigation activeTab={activeTab} />
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto w-full flex-1 px-4 sm:px-6 pb-8">
          <div className="animate-mount">
            {/* Keep GPACalculator always mounted but hidden when not active */}
            <div style={{ display: activeTab === 'gpa' ? 'block' : 'none' }}>
              <GPACalculator
                user={user}
                authInitialized={authInitialized}
                initialTerm={selectedTerm}
              />
            </div>

            {/* Keep GradeCalculator always mounted but hidden when not active */}
            <div style={{ display: activeTab === 'grade' ? 'block' : 'none' }}>
              <GradeCalculator
                user={user}
                authInitialized={authInitialized}
              />
            </div>

            {activeTab === 'cgpa' && (
              <CGPACalculator
                user={user}
                authInitialized={authInitialized}
                onEditTerm={handleEditTerm}
              />
            )}

            {activeTab === 'projections' && (
              <CGPAProjections
                user={user}
                authInitialized={authInitialized}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <p className="font-display font-semibold text-sm text-dlsu-slate">© {new Date().getFullYear()} Greendex</p>
              <p className="mt-1 text-gray-400 text-xs">
                Based on the original{' '}
                <a href="https://www.anotsopopularkid.com/2012/12/dlsu-gpa-and-grade-calculator.html" target="_blank" rel="noopener noreferrer" className="text-dlsu-green hover:underline">
                  DLSU GPA & Grade Calculator
                </a>
              </p>
            </div>
            <a
              href="mailto:contactgreendex@gmail.com"
              className="text-gray-400 hover:text-dlsu-green transition-colors flex items-center gap-1.5 text-xs"
            >
              <Mail size={14} />
              <span>contactgreendex@gmail.com</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={(user: FirebaseUser) => {
            setUser(user);
            setShowLoginModal(false);
            setActiveTab('gpa');
          }}
        />
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <UpdateModal isOpen={showUpdateModal} onClose={() => setShowUpdateModal(false)} />
      )}

      {/* Tutorial Modal */}
      {showTutorialModal && (
        <TutorialModal isOpen={showTutorialModal} onClose={() => setShowTutorialModal(false)} />
      )}
    </div>
  );
}

export default App;
