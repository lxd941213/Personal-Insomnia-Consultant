import { useState } from 'react';
import './styles.css';
import { AssessmentPage } from './components/AssessmentPage';
import { ChatPage } from './components/ChatPage';
import { DashboardPage } from './components/DashboardPage';
import { EntryPage } from './components/EntryPage';
import { KnowledgePage } from './components/KnowledgePage';
import { ProfileWizard } from './components/ProfileWizard';
import type { AssessmentResult, SleepProfile, SleepScenario } from './domain/types';
import { clearAllLocalData, getAssessmentResult, getSleepProfile, saveSleepProfile } from './storage/localStore';

type View = 'entry' | 'profile' | 'dashboard' | 'assessment' | 'knowledge' | 'chat';

export default function App() {
  const [profile, setProfile] = useState<SleepProfile | null>(() => getSleepProfile());
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(() =>
    getAssessmentResult(),
  );
  const [view, setView] = useState<View>(() => (getSleepProfile() ? 'dashboard' : 'entry'));
  const [selectedScenario, setSelectedScenario] = useState<SleepScenario | null>(null);

  function completeProfile(nextProfile: SleepProfile) {
    saveSleepProfile(nextProfile);
    setProfile(nextProfile);
    setView('dashboard');
  }

  function resetProfile() {
    clearAllLocalData();
    setProfile(null);
    setAssessmentResult(null);
    setSelectedScenario(null);
    setView('profile');
  }

  function openChat(scenario?: SleepScenario) {
    setSelectedScenario(scenario ?? null);
    setView('chat');
  }

  function openKnowledge(scenario?: SleepScenario) {
    setSelectedScenario(scenario ?? null);
    setView('knowledge');
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
        onOpenKnowledge={openKnowledge}
        onOpenChat={openChat}
        onReset={resetProfile}
      />
    );
  }

  if (view === 'assessment') {
    return (
      <AssessmentPage
        profile={profile}
        onComplete={(result) => {
          setAssessmentResult(result);
        }}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'knowledge') {
    return (
      <KnowledgePage
        profile={profile}
        assessmentResult={assessmentResult}
        initialScenario={selectedScenario ?? undefined}
        onBack={() => setView('dashboard')}
      />
    );
  }

  // view === 'chat'
  return (
    <ChatPage
      profile={profile}
      chatScope={selectedScenario ?? 'general'}
      assessmentResult={assessmentResult}
      initialScenario={selectedScenario}
      onBack={() => setView('dashboard')}
      onReset={resetProfile}
    />
  );
}
