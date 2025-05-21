import React, { useState } from 'react';
interface AuthScreenProps {
  onVerify: () => void;
}
const AuthScreen = ({
  onVerify
}: AuthScreenProps) => {
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [error, setError] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic ID number validation (should be 8 digits)
    if (!/^\d{8}$/.test(idNumber)) {
      setError('Please enter a valid 8-digit ID number');
      return;
    }
    // Basic email validation
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    onVerify();
  };
  return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6 py-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-[#006f51] mb-2">
          Welcome to DLSU GPA Tracker
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Please verify your identity to continue
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> Your ID number is only used for verification
            and will not be stored. This is a client-side application and no
            data leaves your browser.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="Enter your email" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DLSU ID Number
            </label>
            <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)} className="w-full p-2 border border-gray-300 rounded" placeholder="Enter your 8-digit ID number" maxLength={8} required />
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button type="submit" className="w-full bg-[#006f51] text-white py-2 px-4 rounded hover:bg-[#005a42] transition-colors">
            Continue to GPA Tracker
          </button>
        </form>
      </div>
    </div>;
};
export default AuthScreen;