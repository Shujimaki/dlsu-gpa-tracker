import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import type { User } from '../types';

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // TODO: Use createUserWithEmailAndPassword for sign up if available
      const result = await signInWithEmailAndPassword(auth, email, password);

      onLogin({
        id: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName || undefined,
        terms: []
      });
    } catch (err: unknown) {
      setError((err as unknown as { message?: string }).message || (isSignUp ? 'Failed to create account' : 'Invalid email or password'));
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      (provider as GoogleAuthProvider).customParameters = { prompt: 'select_account' };
      const result = await signInWithPopup(auth, provider);
      onLogin({
        id: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName || undefined,
        terms: []
      });
    } catch (err: unknown) {
      setError((err as unknown as { message?: string }).message || 'Failed to login with Google');
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium mb-4">
            {isSignUp ? 'Create Account' : 'Login'}
          </Dialog.Title>
          
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-dlsu-green focus:ring-dlsu-green"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-dlsu-green focus:ring-dlsu-green"
                required
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-dlsu-green focus:ring-dlsu-green"
                  required
                />
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="w-full bg-dlsu-green text-white py-2 px-4 rounded hover:bg-dlsu-light-green transition-colors"
              >
                {isSignUp ? 'Sign Up' : 'Login'} with Email
              </button>
              
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white text-gray-700 py-2 px-4 rounded border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
                Continue with Google
              </button>

              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-dlsu-green hover:text-dlsu-light-green"
              >
                {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default LoginModal; 