import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { auth } from '../config/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationUser, setVerificationUser] = useState<User | null>(null);
  
  // Check if verification is completed on auth state change
  useEffect(() => {
    if (!verificationUser) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.uid === verificationUser.uid && user.emailVerified) {
        // User has verified their email
        setVerificationSent(false);
        setVerificationUser(null);
        onLogin(user);
        onClose();
      }
    });
    
    return () => unsubscribe();
  }, [verificationUser, onLogin, onClose]);

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
    setSuccessMessage(null);
    
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
        
        // Send verification email
        await sendEmailVerification(result.user);
        
        // Set verification state
        setVerificationSent(true);
        setVerificationUser(result.user);
        
        // Set flag for new account creation but don't consider them fully logged in yet
        // We'll wait for email verification before considering the account fully active
        setSuccessMessage('Account created! Please check your email to verify your account.');
        setIsLoading(false);
        
        // We don't call onLogin here - we'll wait for verification
      } else {
        // Login flow
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if email is verified
        if (!result.user.emailVerified) {
          // Send a new verification email
          await sendEmailVerification(result.user);
          setVerificationSent(true);
          setVerificationUser(result.user);
          setError('Please verify your email before logging in.');
          setIsLoading(false);
          return;
        }
        
        // Only if email is verified, consider them logged in
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

  const handleResendVerification = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      if (verificationUser) {
        // If we have the user object, use it directly
        await sendEmailVerification(verificationUser);
      } else {
        // Otherwise, sign in again to get the user object
        const result = await signInWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(result.user);
        setVerificationUser(result.user);
      }
      
      setSuccessMessage('Verification email sent! Please check your inbox.');
      setIsLoading(false);
    } catch (error) {
      console.error('Error resending verification:', error);
      setError('Failed to resend verification email. Please try again.');
      setIsLoading(false);
    }
  };

  // New function to check verification status
  const handleCheckVerification = async () => {
    if (!verificationUser) return;
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Force refresh the user to get the latest verification status
      await verificationUser.reload();
      const refreshedUser = auth.currentUser;
      
      if (refreshedUser && refreshedUser.emailVerified) {
        // User has verified their email
        setSuccessMessage('Email verified successfully!');
        
        // Short timeout to show success message before proceeding
        setTimeout(() => {
          setVerificationSent(false);
          setVerificationUser(null);
          onLogin(refreshedUser);
          onClose();
        }, 1500);
      } else {
        // User has not verified their email yet
        setError('Email not verified yet. Please check your inbox and click the verification link.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      setError('Failed to check verification status. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset email sent! Please check your inbox.');
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending password reset:', error);
      const authError = error as AuthError;
      
      if (authError.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (authError.code === 'auth/invalid-email') {
        setError('Invalid email address. Please check the format.');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
      
      setIsLoading(false);
    }
  };
  
  const handleCancelVerification = async () => {
    if (!verificationUser) return;
    
    setIsLoading(true);
    
    try {
      // If this was a new account creation and they're canceling verification,
      // we should delete the unverified account
      if (isSignUp) {
        // Delete the unverified user account
        await verificationUser.delete();
        console.log('Unverified account deleted');
      }
      
      // Sign out the unverified user
      await signOut(auth);
      
      // Reset states
      setVerificationSent(false);
      setVerificationUser(null);
      setIsLoading(false);
      
      // Reset form fields
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setSuccessMessage(null);
      setError(null);
      
      // Go back to login form
      setIsSignUp(false);
    } catch (error) {
      console.error('Error canceling verification:', error);
      setIsLoading(false);
      
      // Even if deletion fails, still sign out and reset the UI
      await signOut(auth);
      setVerificationSent(false);
      setVerificationUser(null);
      setIsSignUp(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <Dialog 
      as="div"
      open={isOpen} 
      onClose={verificationSent ? () => {} : onClose} 
      className="relative z-50"
      static
    >
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto rounded-lg bg-white shadow-md w-full max-w-sm">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <Dialog.Title className="text-base font-medium text-gray-900">
              {verificationSent ? 'Email Verification Required' :
               showForgotPassword ? 'Reset Password' : 
               showEmailForm ? (isSignUp ? 'Create Account' : 'Log In') : 
               'Log In to Greendex'}
            </Dialog.Title>
            {!verificationSent && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <div className="p-4">
            {verificationSent ? (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500 text-blue-700 text-sm rounded">
                  <h4 className="font-medium mb-1">Email Verification Required</h4>
                  <p className="mb-2">We've sent a verification link to <strong>{email}</strong>.</p>
                  <p className="mb-3">Please check your inbox (and spam folder) and click the verification link before logging in.</p>
                  <p className="text-xs">Your account will not be fully activated until you verify your email.</p>
                </div>
                
                {error && (
                  <div className="p-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs">
                    {error}
                  </div>
                )}
                
                {successMessage && (
                  <div className="p-2 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs">
                    {successMessage}
                  </div>
                )}
                
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleCheckVerification}
                    className="w-full px-3 py-2 text-sm bg-dlsu-green text-white rounded hover:bg-dlsu-dark-green transition-colors flex justify-center items-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Checking...
                      </>
                    ) : (
                      <>I've Verified My Email</>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="w-full px-3 py-2 text-sm border border-dlsu-green text-dlsu-green rounded hover:bg-dlsu-green/10 transition-colors flex justify-center items-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-dlsu-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>Resend Verification Email</>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleCancelVerification}
                    className="w-full px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    {isSignUp ? 'Cancel Account Creation' : 'Cancel & Return to Login'}
                  </button>
                </div>
              </div>
            ) : !showEmailForm && !showForgotPassword ? (
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
            ) : showForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
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
                
                {error && (
                  <div className="p-2 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs">
                    {error}
                  </div>
                )}
                
                {successMessage && (
                  <div className="p-2 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs">
                    {successMessage}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError(null);
                      setSuccessMessage(null);
                    }}
                    className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    disabled={isLoading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-1.5 text-sm bg-dlsu-green text-white rounded hover:bg-dlsu-dark-green transition-colors flex justify-center items-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </>
                    ) : (
                      <>Reset Password</>
                    )}
                  </button>
                </div>
              </form>
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
                
                {successMessage && (
                  <div className="p-2 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs">
                    {successMessage}
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
                
                <div className="text-center flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-dlsu-green hover:text-dlsu-light-green text-xs"
                    disabled={isLoading}
                  >
                    {isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up'}
                  </button>
                  
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-dlsu-green hover:text-dlsu-light-green text-xs"
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  )}
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