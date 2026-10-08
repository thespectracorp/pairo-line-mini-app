import { useState } from 'react';
import './App.css';
import { WelcomeScreen } from './components/WelcomeScreen';
import { HomeScreen } from './components/HomeScreen';
import { DressScreen } from './components/DressScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { BottomNavigation } from './components/BottomNavigation';

export default function App() {
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  const handleGetStarted = () => {
    setIsFirstTime(false);
  };

  if (isFirstTime) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'dress':
        return <DressScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <main className="app-shell">
      {renderScreen()}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </main>
  );
}
