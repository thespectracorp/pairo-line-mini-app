import { useEffect, useState } from 'react';
import './App.css';
import { WelcomeScreen } from './components/WelcomeScreen';
import { HomeScreen } from './components/HomeScreen';
import { DressScreen } from './components/DressScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { supabase } from './lib/supabase';
import { getCustomerKey } from './lib/customer';

export default function App() {
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [profileComplete, setProfileComplete] = useState(false);
  const [openEditOnMount, setOpenEditOnMount] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const key = await getCustomerKey();
        const { data } = await supabase
          .from('app_profile')
          .select('display_name, email, age, gender, terms_accepted, personalization_consent')
          .eq('id', key)
          .maybeSingle();
        const complete =
          Boolean(data?.display_name) &&
          Boolean(data?.email) &&
          data?.age != null &&
          Boolean(data?.gender) &&
          Boolean(data?.terms_accepted) &&
          Boolean(data?.personalization_consent);
        setProfileComplete(complete);
      } catch {
        setProfileComplete(false);
      }
    };
    void checkProfile();
  }, []);

  const handleGetStarted = () => {
    setIsFirstTime(false);
  };

  const goToProfileWithEdit = () => {
    setOpenEditOnMount(true);
    setActiveTab('profile');
  };

  const handleTabChange = (tab: string) => {
    if (tab !== 'profile') setOpenEditOnMount(false);
    setActiveTab(tab);
  };

  if (isFirstTime) {
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'dress':
        return (
          <DressScreen
            profileComplete={profileComplete}
            onNeedProfile={goToProfileWithEdit}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            openEditOnMount={openEditOnMount}
            onProfileSaved={() => {
              setProfileComplete(true);
              setOpenEditOnMount(false);
            }}
          />
        );
      default:
        return <HomeScreen />;
    }
  };

  return (
    <main className="app-shell">
      {renderScreen()}
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </main>
  );
}
