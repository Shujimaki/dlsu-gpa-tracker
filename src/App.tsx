import { useState } from 'react'
import { auth } from './config/firebase'
import Header from './components/Header'
import GPACalculator from './components/GPACalculator'
import LoginModal from './components/LoginModal'
import type { User } from './types'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onLoginClick={() => setShowLoginModal(true)} 
        onLogout={() => setUser(null)} 
      />
      
      <main className="flex-1 w-full mx-auto p-2 md:p-6 flex flex-col">
        <div className="mt-6 bg-white rounded-lg shadow-md p-4 md:p-6 w-full">
          <GPACalculator user={user} />
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
