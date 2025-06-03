interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabNavigation = ({ activeTab, setActiveTab }: TabNavigationProps) => {
  const tabs = [
    {
      id: 'gpa',
      label: 'GPA Calculator'
    },
    {
      id: 'grade',
      label: 'Grade Calculator'
    },
    {
      id: 'cgpa',
      label: 'CGPA Calculator'
    },
    {
      id: 'projections',
      label: 'CGPA Projections'
    }
  ];

  return (
    <div className="bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide">
      <div className="container mx-auto flex px-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-4 py-3 text-sm font-medium transition-all duration-200 focus:outline-none relative
              ${activeTab === tab.id 
                ? 'text-dlsu-green border-b-2 border-dlsu-green' 
                : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
              }
            `}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation; 