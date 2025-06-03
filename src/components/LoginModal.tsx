import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from 'firebase/auth';
import type { User, AuthError } from 'firebase/auth';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

const LoginModal = ({ isOpen, onClose, onLogin }: LoginModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowEmailForm(false);
    setIsSignUp(false);
    setIsLoading(false);
    setError(null);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user (first login)
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      if (isNewUser) {
        console.log('New Google account detected');
        sessionStorage.setItem('newLogin', 'true');
      }
      
      onLogin(result.user);
      onClose();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to sign in with Google. Please try again.');
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        // Check if passwords match for sign up
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        
        // Sign up flow
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Set flag for new account creation
        sessionStorage.setItem('newLogin', 'true');
        
        onLogin(result.user);
        onClose();
      } else {
        // Login flow
        const result = await signInWithEmailAndPassword(auth, email, password);
        onLogin(result.user);
        onClose();
      }
    } catch (error) {
      console.error('Error with email auth:', error);
      const authError = error as AuthError;
      
      // Handle common auth errors with user-friendly messages
      if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (authError.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please log in instead.');
      } else if (authError.code === 'auth/weak-password') {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (authError.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check the format.');
      } else {
        setError('Authentication failed. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={() => {
        onClose();
        resetForm();
      }} 
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto rounded-lg bg-white shadow-md w-full max-w-sm">
          <div className="px-4 py-3 border-b border-gray-200">
            <Dialog.Title className="text-base font-medium text-gray-900">
              {showEmailForm ? (isSignUp ? 'Create Account' : 'Log In') : 'Log In to Greendex'}
            </Dialog.Title>
          </div>
          
          <div className="p-4">
            {!showEmailForm ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-gray-700 py-2 px-3 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <img src="/google-icon.svg" alt="Google" className="w-4 h-4" />
                      Continue with Google
                    </>
                  )}
                </button>
                
                {error && (
                  <div className="p-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs">
                    {error}
                  </div>
                )}
                
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-3 text-gray-500 text-xs">or</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="w-full border border-dlsu-green text-dlsu-green py-2 px-3 rounded hover:bg-dlsu-green/10 transition-colors text-sm"
                >
                  Continue with Email
                </button>
                
                <p className="text-xs text-center text-gray-500 mt-4">
                  By continuing, you agree to our terms of service and privacy policy.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    disabled={isLoading}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
                
                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                      disabled={isLoading}
                      minLength={6}
                    />
                  </div>
                )}
                
                {error && (
                  <div className="p-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs">
                    {error}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 text-sm bg-dlsu-green text-white rounded hover:bg-dlsu-dark-green transition-colors flex justify-center items-center login-form-button"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isSignUp ? 'Creating Account...' : 'Logging In...'}
                      </>
                    ) : (
                      <>{isSignUp ? 'Create Account' : 'Log In'}</>
                    )}
                  </button>
                </div>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-dlsu-green hover:text-dlsu-light-green text-xs"
                    disabled={isLoading}
                  >
                    {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default LoginModal; 