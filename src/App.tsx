import { useState } from 'react';
import './styles.css';
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

  if (view === 'entry') {
    return <EntryPage onStart={() => setView('profile')} />;
  }

  if (view === 'profile' || !profile) {
    return <ProfileWizard onComplete={completeProfile} />;
  }

  return (
    <main className="page">
      <section className="panel">
        <h1>Profile saved</h1>
        <p>The chat interface is implemented in Task 6. Profile saved for {profile.ageRange}.</p>
      </section>
    </main>
  );
}
