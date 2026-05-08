import { useState } from 'react';
import './styles.css';
import { AssessmentPage } from './components/AssessmentPage';
import { ChatPage } from './components/ChatPage';
import { DashboardPage } from './components/DashboardPage';
import { EntryPage } from './components/EntryPage';
import { ProfileWizard } from './components/ProfileWizard';
import type { AssessmentResult, SleepProfile } from './domain/types';
import { getAssessmentResult, getSleepProfile, saveSleepProfile } from './storage/localStore';

type View = 'entry' | 'profile' | 'dashboard' | 'assessment' | 'knowledge' | 'chat';

export default function App() {
  const [profile, setProfile] = useState<SleepProfile | null>(() => getSleepProfile());
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(() =>
    getAssessmentResult(),
  );
  const [view, setView] = useState<View>(() => (getSleepProfile() ? 'dashboard' : 'entry'));

  function completeProfile(nextProfile: SleepProfile) {
    saveSleepProfile(nextProfile);
    setProfile(nextProfile);
    setView('dashboard');
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

  if (view === 'dashboard') {
    return (
      <DashboardPage
        profile={profile}
        assessmentResult={assessmentResult}
        onStartAssessment={() => setView('assessment')}
        onOpenKnowledge={() => setView('knowledge')}
        onOpenChat={() => setView('chat')}
        onReset={resetProfile}
      />
    );
  }

  if (view === 'assessment') {
    return (
      <AssessmentPage
        onComplete={(result) => {
          setAssessmentResult(result);
          setView('dashboard');
        }}
      />
    );
  }

  // Temporary routing for assessment/knowledge/chat until later tasks
  // assessment and knowledge will show ChatPage as placeholder
  return <ChatPage profile={profile} onReset={resetProfile} />;
}
