import React from 'react';
interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}
const TabNavigation = ({
  activeTab,
  setActiveTab
}: TabNavigationProps) => {
  const tabs = [{
    id: 'gpa',
    label: 'GPA Calculator'
  }, {
    id: 'grade',
    label: 'Grade Calculator'
  }, {
    id: 'cgpa',
    label: 'CGPA Calculator'
  }, {
    id: 'projections',
    label: 'CGPA Projections'
  }];
  return <div className="flex flex-wrap border-b border-gray-200">
      {tabs.map(tab => <button key={tab.id} className={`px-4 py-3 font-medium text-sm md:text-base transition-colors duration-200 mr-1 rounded-t-lg ${activeTab === tab.id ? 'bg-white text-[#006f51] border-l border-t border-r border-gray-200 border-b-white' : 'text-gray-600 hover:text-[#006f51] hover:bg-gray-100'}`} onClick={() => setActiveTab(tab.id)}>
          {tab.label}
        </button>)}
    </div>;
};
export default TabNavigation;