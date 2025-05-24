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
    }
  ];

  return (
    <div className="flex border-b border-gray-200 bg-gray-50 px-4 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      {tabs.map((tab, idx) => (
        <button
          key={tab.id}
          className={`px-4 py-3 font-medium text-sm md:text-base transition-colors duration-200 focus:outline-none
            border-t border-l border-r
            ${idx === 0 ? 'rounded-tl-lg' : ''}
            ${idx === tabs.length - 1 ? 'rounded-tr-lg' : ''}
            ${activeTab === tab.id
              ? 'bg-gray-50 border-b-0 text-dlsu-green z-10'
              : 'bg-gray-100 border-b border-gray-300 text-gray-600 hover:bg-gray-200'}
            ${idx !== 0 ? 'ml-2' : ''}
          `}
          style={{ position: 'relative', top: activeTab === tab.id ? '2px' : '0' }}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
      {activeTab === 'projections' && (
        <button
          className={`px-4 py-3 font-medium text-sm md:text-base transition-colors duration-200 focus:outline-none
            border-t border-l border-r ml-2
            bg-gray-50 border-b-0 text-dlsu-green z-10
          `}
          style={{ position: 'relative', top: '2px' }}
          onClick={() => setActiveTab('projections')}
        >
          CGPA Projections
        </button>
      )}
    </div>
  );
};

export default TabNavigation; 