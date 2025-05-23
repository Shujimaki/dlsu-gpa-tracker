import { useState, useEffect } from 'react'
import Header from './components/Header'
import GPACalculator from './components/GPACalculator'
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

  // Check if update modal should be hidden based on localStorage
  useEffect(() => {
    const lastUpdateSeen = localStorage.getItem('lastUpdateSeen');
    if (lastUpdateSeen === '2024-05-22') {
      setShowUpdateModal(false);
    } else {
      console.log("Update modal should be shown");
    }
  }, []);

  // Handle user logout
  const handleLogout = async () => {
    try {
      // Clear the session flag for data persistence
      sessionStorage.removeItem('wasAnonymous');
      
      // Clear any custom term data from sessionStorage
      Object.keys(sessionStorage)
        .filter(key => key.startsWith('term_'))
        .forEach(key => {
          const match = key.match(/term_(\d+)/);
          const termNumber = match ? parseInt(match[1]) : null;
          if (termNumber && termNumber > 12) {
            sessionStorage.removeItem(key);
          }
        });
      
      // Sign out of Firebase
      await signOut(auth);
      
      // Clear user state
      setUser(null);
      
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'gpa':
        return <GPACalculator key={user?.uid || 'anonymous'} user={user} authInitialized={authInitialized} />;
      case 'grade':
        return <div className="p-4">Grade Calculator (Coming Soon)</div>;
      case 'cgpa':
        return <div className="p-4">CGPA Calculator (Coming Soon)</div>;
      case 'projections':
        return <div className="p-4">CGPA Projections (Coming Soon)</div>;
      default:
        return <GPACalculator key={user?.uid || 'anonymous'} user={user} authInitialized={authInitialized} />;
    }
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
          {renderActiveTab()}
        </div>
      </main>

      <footer className="bg-dlsu-green text-white py-4 text-sm">
        <div className="container mx-auto px-6">
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
            
            <div className="flex flex-col items-center md:items-end mt-4 md:mt-0">
              <p className="font-medium mb-2">Contact Us</p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <a 
                  href="mailto:contactgreendex@gmail.com" 
                  className="flex items-center text-white hover:text-dlsu-light-green transition-colors"
                  title="Email us"
                >
                  <Mail size={16} className="mr-1 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">contactgreendex@gmail.com</span>
                </a>
                <a 
                  href="https://github.com/Shujimaki" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-white hover:text-dlsu-light-green transition-colors"
                  title="GitHub"
                >
                  <Github size={16} className="mr-1 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">@Shujimaki</span>
                </a>
              </div>
              <p className="text-xs mt-2 text-gray-200">For suggestions, bug reports, or feedback</p>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLogin={(user: FirebaseUser) => {
          setUser(user)
          setShowLoginModal(false)
        }}
      />
      
      {/* Always render the UpdateModal, its visibility is controlled by isOpen */}
      <UpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />
    </div>
  )
}

export default App
