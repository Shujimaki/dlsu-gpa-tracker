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
      
      <main className="flex-1 w-full mx-auto p-2 md:p-6 flex flex-col">
        <div className="mt-6 bg-white rounded-lg shadow-md p-4 md:p-6 w-full">
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="mt-4">
            {renderActiveTab()}
          </div>
        </div>
      </main>

      <footer className="bg-dlsu-green text-white text-center py-3 text-sm">
        <p>© {new Date().getFullYear()} DLSU GPA Tracker</p>
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
