import { useState, useEffect } from 'react'
import Header from './components/Header'
import GPACalculator from './components/GPACalculator'
import LoginModal from './components/LoginModal'
import TabNavigation from './components/TabNavigation'
import UpdateModal from './components/UpdateModal'
import type { User as FirebaseUser } from 'firebase/auth'
import { auth } from './config/firebase';
import { onAuthStateChanged, signOut, setPersistence, browserSessionPersistence } from 'firebase/auth';

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(true)
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

  // Handle user logout
  const handleLogout = async () => {
    try {
      // Clear the session flag for data persistence
      sessionStorage.removeItem('wasAnonymous');
      
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
      />
      
      <main className="flex-1 flex flex-col w-full">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 w-full px-6 py-8">
          {renderActiveTab()}
        </div>
      </main>

      <footer className="bg-dlsu-green text-white text-center py-3 text-sm">
        <p>© {new Date().getFullYear()} Greendex</p>
        <p className="mt-1 text-sm text-gray-200">
          Calculator logic and inspiration based on the original 
          <a href="https://www.anotsopopularkid.com/2012/12/dlsu-gpa-and-grade-calculator.html" target="_blank" rel="noopener noreferrer" className="underline ml-1 text-white hover:text-dlsu-light-green">
          DLSU GPA & Grade Calculator by Renz Kristofer Cheng (A Not-So-Popular Kid, 2012)
          </a>.
          Please visit and support the original work!
        </p>
      </footer>

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLogin={(user: FirebaseUser) => {
          setUser(user)
          setShowLoginModal(false)
        }}
      />
      
      <UpdateModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />
    </div>
  )
}

export default App
