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
  signOut,
  setPersistence,
  browserSessionPersistence,
  deleteUser
} from 'firebase/auth';
import type { User, AuthError } from 'firebase/auth';

// Maximum time (in minutes) allowed for email verification before account is deleted
const VERIFICATION_TIMEOUT_MINUTES = 30;

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
  
  // Set session persistence when component mounts
  useEffect(() => {
    // Use session persistence to ensure auth state is cleared when tab is closed
    setPersistence(auth, browserSessionPersistence)
      .catch(error => {
        console.error("Error setting auth persistence:", error);
      });
  }, []);
  
  // Handle unverified accounts on application start
  useEffect(() => {
    const handleUnverifiedAccounts = async () => {
      const user = auth.currentUser;
      
      if (user) {
        // Force refresh to get the latest verification status
        try {
          await user.reload();
          
          // Check if this is an unverified account
          if (!user.emailVerified) {
            const pendingVerificationEmail = sessionStorage.getItem('pendingVerificationEmail');
            const verificationTimestamp = sessionStorage.getItem('verificationTimestamp');
            
            if (pendingVerificationEmail && verificationTimestamp) {
              // Check if verification has timed out
              const timestamp = parseInt(verificationTimestamp, 10);
              const now = Date.now();
              const minutesPassed = (now - timestamp) / (1000 * 60);
              
              if (minutesPassed > VERIFICATION_TIMEOUT_MINUTES) {
                console.log(`Verification timed out after ${VERIFICATION_TIMEOUT_MINUTES} minutes. Deleting unverified account.`);
                
                // Delete the unverified account
                try {
                  await deleteUser(user);
                  console.log('Unverified account deleted due to timeout');
                } catch (deleteError) {
                  console.error('Error deleting unverified account:', deleteError);
                }
                
                // Sign out and clear session storage
                await signOut(auth);
                sessionStorage.removeItem('pendingVerificationEmail');
                sessionStorage.removeItem('isNewSignUp');
                sessionStorage.removeItem('verificationTimestamp');
                return;
              }
              
              // If the account is still within verification window, restore verification UI
              setVerificationSent(true);
              setEmail(pendingVerificationEmail);
              setIsSignUp(sessionStorage.getItem('isNewSignUp') === 'true');
              setVerificationUser(user);
            } else {
              // If we have an unverified user without proper session data, sign them out
              console.log('Unverified user detected without session data. Signing out.');
              await signOut(auth);
            }
          } else {
            // User is verified, clear verification session data
            sessionStorage.removeItem('pendingVerificationEmail');
            sessionStorage.removeItem('isNewSignUp');
            sessionStorage.removeItem('verificationTimestamp');
            
            // Only automatically log in if the modal is not open
            // This prevents auto-login when the user is actively using the login modal
            if (!isOpen) {
              onLogin(user);
            }
          }
        } catch (error) {
          console.error('Error handling unverified account:', error);
        }
      }
    };
    
    // Run once on component mount
    handleUnverifiedAccounts();
    
    // Also set up auth state listener for changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && !verificationSent) {
        handleUnverifiedAccounts();
      }
    });
    
    return () => unsubscribe();
  }, [onLogin, isOpen, verificationSent]);
  
  // Add beforeunload event listener when verification is in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (verificationSent && verificationUser && isSignUp) {
        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = 'You have not verified your email yet. If you leave, you will need to verify your email before logging in.';
        return e.returnValue;
      }
    };
    
    if (verificationSent && verificationUser) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [verificationSent, verificationUser, isSignUp]);
  
  // Check if verification is completed on auth state change
  useEffect(() => {
    if (!verificationUser) return;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.uid === verificationUser.uid) {
        // Force refresh to get the latest verification status
        user.reload().then(() => {
          if (user.emailVerified) {
            // User has verified their email
            sessionStorage.removeItem('pendingVerificationEmail');
            sessionStorage.removeItem('isNewSignUp');
            sessionStorage.removeItem('verificationTimestamp');
            setVerificationSent(false);
            setVerificationUser(null);
            onLogin(user);
            onClose();
          }
        }).catch(error => {
          console.error('Error refreshing user:', error);
        });
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
        
        // Store verification state in session storage with timestamp
        sessionStorage.setItem('pendingVerificationEmail', email);
        sessionStorage.setItem('isNewSignUp', 'true');
        sessionStorage.setItem('verificationTimestamp', Date.now().toString());
        
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
          
          // Store verification state in session storage with timestamp
          sessionStorage.setItem('pendingVerificationEmail', email);
          sessionStorage.setItem('isNewSignUp', 'false');
          sessionStorage.setItem('verificationTimestamp', Date.now().toString());
          
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
        
        // Update session storage with new timestamp
        sessionStorage.setItem('pendingVerificationEmail', email);
        sessionStorage.setItem('isNewSignUp', isSignUp.toString());
        sessionStorage.setItem('verificationTimestamp', Date.now().toString());
      }
      
      setSuccessMessage('Verification email sent! Please check your inbox.');
      setIsLoading(false);
    } catch (error) {
      console.error('Error resending verification:', error);
      setError('Failed to resend verification email. Please try again.');
      setIsLoading(false);
    }
  };

  // Function to check verification status
  const handleCheckVerification = async () => {
    if (!verificationUser) return;
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Sign out and sign back in to get a fresh auth token
      // This ensures we have the most up-to-date verification status
      const userEmail = verificationUser.email;
      const currentPassword = password;
      
      if (!userEmail) {
        setError('Unable to verify email status. Please try again later.');
        setIsLoading(false);
        return;
      }
      
      // Force refresh the user to get the latest verification status
      await verificationUser.reload();
      let refreshedUser = auth.currentUser;
      
      // Check if already verified after reload
      if (refreshedUser && refreshedUser.emailVerified) {
        handleVerificationSuccess(refreshedUser);
        return;
      }
      
      // If not verified yet, try signing out and back in to get a fresh token
      // This is often necessary as Firebase may cache the verification status
      if (currentPassword && isSignUp) {
        try {
          await signOut(auth);
          const result = await signInWithEmailAndPassword(auth, userEmail, currentPassword);
          refreshedUser = result.user;
          
          if (refreshedUser.emailVerified) {
            handleVerificationSuccess(refreshedUser);
            return;
          }
        } catch (signInError) {
          console.error('Error during re-authentication:', signInError);
          // Continue with the process even if re-auth fails
        }
      }
      
      // If still not verified, make one more attempt with a delay
      // Sometimes Firebase needs a moment to propagate the verification status
      setSuccessMessage('Checking verification status...');
      
      setTimeout(async () => {
        try {
          if (refreshedUser) {
            await refreshedUser.reload();
            
            if (refreshedUser.emailVerified) {
              handleVerificationSuccess(refreshedUser);
              return;
            }
          }
          
          // If we still can't confirm verification
          setError('Email not verified yet. Please check your inbox and click the verification link. After clicking the link, wait a moment and try again.');
          setSuccessMessage(null);
          setIsLoading(false);
        } catch (finalError) {
          console.error('Error in final verification check:', finalError);
          setError('Unable to verify email status. Please try again later.');
          setIsLoading(false);
        }
      }, 2000); // Wait 2 seconds before final check
    } catch (error) {
      console.error('Error checking verification status:', error);
      setError('Failed to check verification status. Please try again.');
      setIsLoading(false);
    }
  };
  
  // Helper function to handle successful verification
  const handleVerificationSuccess = (user: User) => {
    // User has verified their email
    setSuccessMessage('Email verified successfully!');
    
    // Clear session storage
    sessionStorage.removeItem('pendingVerificationEmail');
    sessionStorage.removeItem('isNewSignUp');
    sessionStorage.removeItem('verificationTimestamp');
    
    // Short timeout to show success message before proceeding
    setTimeout(() => {
      setVerificationSent(false);
      setVerificationUser(null);
      onLogin(user);
      onClose();
    }, 1500);
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
        await deleteUser(verificationUser);
        console.log('Unverified account deleted');
      }
      
      // Sign out the unverified user
      await signOut(auth);
      
      // Clear session storage
      sessionStorage.removeItem('pendingVerificationEmail');
      sessionStorage.removeItem('isNewSignUp');
      sessionStorage.removeItem('verificationTimestamp');
      
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
      sessionStorage.removeItem('pendingVerificationEmail');
      sessionStorage.removeItem('isNewSignUp');
      sessionStorage.removeItem('verificationTimestamp');
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
                  <p className="mb-2">Please check your inbox (and spam folder) and click the verification link before logging in.</p>
                  <p className="mb-1"><strong>After clicking the link:</strong></p>
                  <ol className="list-decimal ml-5 mb-3 text-xs">
                    <li>Complete any verification steps in your browser</li>
                    <li>Return to this window</li>
                    <li>Click the "I've Verified My Email" button below</li>
                  </ol>
                  <p className="text-xs">Your account will not be fully activated until you verify your email.</p>
                  <p className="text-xs mt-2 text-blue-600">Note: You have {VERIFICATION_TIMEOUT_MINUTES} minutes to verify your email before the verification link expires.</p>
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