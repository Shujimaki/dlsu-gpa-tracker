import React, { useState } from 'react';
import Header from './components/Header';
import TabNavigation from './components/TabNavigation';
import GPACalculator from './components/GPACalculator';
import GradeCalculator from './components/GradeCalculator';
import CGPACalculator from './components/CGPACalculator';
import CGPAProjections from './components/CGPAProjections';
import AuthScreen from './components/AuthScreen';
export function App() {
  const [activeTab, setActiveTab] = useState('gpa');
  const [isVerified, setIsVerified] = useState(false);
  const [cgpaData, setCgpaData] = useState({
    cgpa: 0,
    totalUnits: 0
  });
  const handleVerify = () => {
    setIsVerified(true);
  };
  const handleCGPAUpdate = (cgpa: number, totalUnits: number) => {
    setCgpaData({
      cgpa,
      totalUnits
    });
  };
  if (!isVerified) {
    return <AuthScreen onVerify={handleVerify} />;
  }
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'gpa':
        return <GPACalculator />;
      case 'grade':
        return <GradeCalculator />;
      case 'cgpa':
        return <CGPACalculator onUpdate={handleCGPAUpdate} />;
      case 'projections':
        return <CGPAProjections cgpaData={cgpaData} />;
      default:
        return <GPACalculator />;
    }
  };
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto p-4 md:p-6">
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-6 bg-white rounded-lg shadow-md p-4 md:p-6">
          {renderActiveTab()}
        </div>
      </main>
      <footer className="bg-[#006f51] text-white text-center py-3 text-sm">
        <p>© {new Date().getFullYear()} DLSU GPA Tracker</p>
      </footer>
    </div>;
}