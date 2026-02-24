import { Calculator, Award, TrendingUp, Target } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
}

const tabs = [
  { id: 'gpa', label: 'GPA', fullLabel: 'GPA Calculator', icon: Calculator },
  { id: 'grade', label: 'Grade', fullLabel: 'Grade Calculator', icon: Award },
  { id: 'cgpa', label: 'CGPA', fullLabel: 'CGPA Calculator', icon: TrendingUp },
  { id: 'projections', label: 'Projections', fullLabel: 'CGPA Projections', icon: Target },
];

const TabNavigation = ({ activeTab }: TabNavigationProps) => {
  const switchTab = (tabId: string) => {
    window.dispatchEvent(new CustomEvent('switchTab', { detail: tabId }));
  };

  return (
    <nav className="tab-pills" role="tablist">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => switchTab(tab.id)}
            className={`tab-pill ${isActive ? 'active' : ''}`}
          >
            <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
            <span className="hidden sm:inline">{tab.fullLabel}</span>
            <span className="sm:hidden">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default TabNavigation;