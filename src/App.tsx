import { useState } from 'react'
import { auth } from './config/firebase'
import Header from './components/Header'
import GPACalculator from './components/GPACalculator'
import LoginModal from './components/LoginModal'
import TabNavigation from './components/TabNavigation'
import type { User } from './types'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [activeTab, setActiveTab] = useState('gpa')

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'gpa':
        return <GPACalculator user={user} />;
      case 'grade':
        return <div className="p-4">Grade Calculator (Coming Soon)</div>;
      case 'cgpa':
        return <div className="p-4">CGPA Calculator (Coming Soon)</div>;
      case 'projections':
        return <div className="p-4">CGPA Projections (Coming Soon)</div>;
      default:
        return <GPACalculator user={user} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onLoginClick={() => setShowLoginModal(true)} 
        onLogout={() => setUser(null)} 
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
        onLogin={(user: User) => {
          setUser(user)
          setShowLoginModal(false)
        }}
      />
    </div>
  )
}

export default App
