import React from 'react';
const Header = () => {
  return <header className="bg-[#006f51] text-white py-6">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl md:text-3xl font-bold">
          De La Salle University (DLSU)
        </h1>
        <h2 className="text-lg md:text-xl">Student GPA Tracker</h2>
        <p className="text-sm opacity-80 mt-1">
          A modern alternative to the Excel spreadsheet
        </p>
      </div>
    </header>;
};
export default Header;