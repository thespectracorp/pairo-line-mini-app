import { Home, Shirt, User } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dress', label: 'Dress', icon: Shirt },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onTabChange(id)} className={`bottom-tab ${activeTab === id ? 'active' : ''}`}>
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
