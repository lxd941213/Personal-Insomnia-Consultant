import { useState } from 'react';
import './styles.css';
import { ChatPage } from './components/ChatPage';
import { EntryPage } from './components/EntryPage';
import { ProfileWizard } from './components/ProfileWizard';
import type { SleepProfile } from './domain/types';
import { getSleepProfile, saveSleepProfile } from './storage/localStore';

type View = 'entry' | 'profile' | 'chat';

export default function App() {
  const [profile, setProfile] = useState<SleepProfile | null>(() => getSleepProfile());
  const [view, setView] = useState<View>(() => (getSleepProfile() ? 'chat' : 'entry'));

  function completeProfile(nextProfile: SleepProfile) {
    saveSleepProfile(nextProfile);
    setProfile(nextProfile);
    setView('chat');
  }

  function resetProfile() {
    setProfile(null);
    setView('profile');
  }

  if (view === 'entry') {
    return <EntryPage onStart={() => setView('profile')} />;
  }

  if (view === 'profile' || !profile) {
    return <ProfileWizard onComplete={completeProfile} />;
  }

  return <ChatPage profile={profile} onReset={resetProfile} />;
}
