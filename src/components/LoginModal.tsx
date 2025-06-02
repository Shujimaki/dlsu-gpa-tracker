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
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const clearSessionData = () => {
    // This function is called when a NEW account is created.
    // Previously, it cleared term_X data, preventing GPA term migration to new accounts.
    // To ALLOW migration of all data (including GPA terms) to new accounts,
    // this function should NOT clear session items that are intended for migration.
    // Each calculator component is responsible for clearing its specific sessionStorage item
    // AFTER a successful migration to Firestore.
    // For now, we will make this function do nothing, allowing all calculators to attempt migration.
    
    // console.log("LoginModal: clearSessionData called for new account. No items cleared by this function to allow migration.");

    // Example of what NOT to do if migration is desired for these:
    // for (let i = 1; i <= 20; i++) { // Clear the first 20 terms to be safe
    //   sessionStorage.removeItem(`term_${i}`);
    // }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        console.log(`Creating account for ${email}...`);
        const result = await createUserWithEmailAndPassword(auth, email, password);
        console.log('Account created successfully');
        
        // Set flag for new account creation
        sessionStorage.setItem('newLogin', 'true');
        clearSessionData();
        
        // Clear form fields
        resetForm();
        
        onLogin(result.user);
      } else {
        console.log(`Signing in ${email}...`);
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('Sign in successful');
        
        // Clear form fields
        resetForm();
        
        onLogin(result.user);
      }
    } catch (err: unknown) {
      console.error('Authentication error:', err);
      const authError = err as AuthError;
      
      // Handle specific Firebase auth errors with better messages
      switch(authError.code) {
        case 'auth/email-already-in-use':
          setError('This email is already registered. Please login instead.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/operation-not-allowed':
          setError('Email/Password sign-in is not enabled for this app. Please use Google sign-in instead.');
          break;
        case 'auth/user-disabled':
          setError('This account has been disabled. Please contact support.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email. Please sign up instead.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid login credentials. Please check and try again.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed login attempts. Please try again later or reset your password.');
          break;
        case 'auth/weak-password':
          setError('Password is too weak. Please use a stronger password.');
          break;
        default:
          setError(authError.message || (isSignUp ? 'Failed to create account' : 'Invalid email or password'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user (first login)
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      if (isNewUser) {
        console.log('New Google account detected');
        sessionStorage.setItem('newLogin', 'true');
        clearSessionData();
      }
      
      // Clear form
      resetForm();
      
      onLogin(result.user);
    } catch (err: unknown) {
      console.error('Google login error:', err);
      const authError = err as AuthError;
      
      if (authError.code === 'auth/popup-closed-by-user') {
        setError('Login canceled. Please try again.');
      } else {
        setError(authError.message || 'Failed to login with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setIsLoading(false);
    setShowEmailForm(false);
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
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto rounded bg-white p-6 w-full max-w-md">
          <Dialog.Title className="text-lg font-medium mb-4">
            Log in to Greendex
          </Dialog.Title>
          
          {!showEmailForm ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white text-gray-700 py-3 px-4 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
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
                    <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                    Continue with Google
                  </>
                )}
              </button>
              
              {error && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-2 text-sm text-gray-400">or</span>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setShowEmailForm(true)}
                className="w-full text-sm text-dlsu-green hover:text-dlsu-light-green text-center py-2"
                disabled={isLoading}
              >
                Continue with email and password
              </button>
            </div>
          ) : (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-dlsu-green focus:ring-dlsu-green"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-dlsu-green focus:ring-dlsu-green"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              {isSignUp && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-dlsu-green focus:ring-dlsu-green"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full bg-dlsu-green text-white py-2 px-4 rounded hover:bg-dlsu-light-green transition-colors flex items-center justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isSignUp ? 'Creating account...' : 'Logging in...'}
                    </>
                  ) : (
                    <>{isSignUp ? 'Sign Up' : 'Login'} with Email</>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  className="text-sm text-dlsu-green hover:text-dlsu-light-green mt-2"
                  disabled={isLoading}
                >
                  {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm(false);
                    setError('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 mt-2"
                  disabled={isLoading}
                >
                  Back to login options
                </button>
              </div>
            </form>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default LoginModal; 