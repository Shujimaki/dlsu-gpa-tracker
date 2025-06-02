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
import { onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { Github, Mail, AlertTriangle } from 'lucide-react';

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
        // Set auth to use session persistence (clears on browser close)
        // This solves the auto-login after refresh issue
        await setPersistence(auth, browserSessionPersistence);
        console.log("Firebase auth persistence set to session");
      } catch (error) {
        console.error("Error setting auth persistence:", error);
      }
    };
    
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onLoginClick={() => setShowLoginModal(true)} 
        onLogout={handleLogout} 
        onShowUpdateModal={() => setShowUpdateModal(true)}
        showWarningIndicator={showAnonymousWarning && warningDismissed && !user}
        onShowWarning={() => setWarningDismissed(false)}
        onShowTutorialModal={() => setShowTutorialModal(true)}
      />
      
      {/* Anonymous user warning banner */}
      {showAnonymousWarning && !warningDismissed && (
        <div className="bg-dlsu-green bg-opacity-10 border-b border-dlsu-green border-opacity-30 p-3 transition-all duration-300">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-dlsu-green mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-dlsu-green font-medium">
                    Your data is only saved temporarily
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    You're using Greendex without logging in. Your data will be lost if you close or refresh this page.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-shrink-0">
                <button 
                  onClick={() => setWarningDismissed(true)}
                  className="text-gray-600 hover:text-dlsu-green text-sm py-1.5 px-3 h-8 rounded whitespace-nowrap"
                  aria-label="Hide warning"
                >
                  Hide
                </button>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="warning-login-btn px-3 py-1.5 rounded text-sm h-8"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 flex flex-col w-full">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 w-full px-6 py-8">
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
      </main>

      <footer className="bg-dlsu-green text-white py-4 text-sm w-full">
        <div className="w-full px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p>© {new Date().getFullYear()} Greendex</p>
              <p className="mt-1 text-gray-200">
                Calculator logic and inspiration based on the original 
                <a href="https://www.anotsopopularkid.com/2012/12/dlsu-gpa-and-grade-calculator.html" target="_blank" rel="noopener noreferrer" className="underline ml-1 text-white hover:text-dlsu-light-green">
                  DLSU GPA & Grade Calculator by Renz Kristofer Cheng (A Not-So-Popular Kid, 2012)
                </a>.
              </p>
            </div>
            <div className="flex flex-col items-end">
              <p className="font-medium mb-1">Contact Us</p>
              <div className="flex gap-3 items-center">
                <a
                  href="mailto:contactgreendex@gmail.com"
                  className="text-white hover:text-gray-200 transition-colors flex items-center gap-1"
                  aria-label="Email"
                >
                  <Mail size={16} />
                  <span>contactgreendex@gmail.com</span>
                </a>
              </div>
              <div className="flex gap-3 items-center mt-1">
                <a
                  href="https://github.com/Shujimaki"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-gray-200 transition-colors flex items-center gap-1"
                  aria-label="GitHub"
                >
                  <Github size={16} />
                  <span>@Shujimaki</span>
                </a>
              </div>
              <p className="text-xs text-gray-300 mt-2">For suggestions, bug reports, or feedback</p>
            </div>
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
            setActiveTab('gpa'); // Redirect to GPA Calculator tab after login
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
