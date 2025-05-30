import { useState, useEffect } from 'react'
import Header from './components/Header'
import GPACalculator from './components/GPACalculator'
import CGPACalculator from './components/CGPACalculator'
import CGPAProjections from './components/CGPAProjections'
import LoginModal from './components/LoginModal'
import TabNavigation from './components/TabNavigation'
import UpdateModal from './components/UpdateModal'
import type { User as FirebaseUser } from 'firebase/auth'
import { auth } from './config/firebase';
import { onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { Github, Mail } from 'lucide-react';

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(true) // Always start with true
  const [activeTab, setActiveTab] = useState('gpa')
  const [authInitialized, setAuthInitialized] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(() => {
    // Initialize from sessionStorage if available, otherwise use term 1
    const storedTerm = sessionStorage.getItem('currentTerm');
    return storedTerm ? parseInt(storedTerm, 10) : 1;
  });

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
      />
      
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
          
          {activeTab === 'grade' && (
            <div className="p-4">Grade Calculator (Coming Soon)</div>
          )}
          
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
    </div>
  );
}

export default App;
