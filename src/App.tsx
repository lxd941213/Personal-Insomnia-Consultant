import { useState } from 'react';
import './styles.css';
import { AssessmentPage } from './components/AssessmentPage';
import { BottomTabs, type MainTab } from './components/BottomTabs';
import { ChatPage } from './components/ChatPage';
import { DiaryPage } from './components/DiaryPage';
import { EntryPage } from './components/EntryPage';
import { KnowledgePage } from './components/KnowledgePage';
import { MyPage } from './components/MyPage';
import { PlansPage } from './components/PlansPage';
import { ProfileWizard } from './components/ProfileWizard';
import { RelaxationPage } from './components/RelaxationPage';
import { TodayPage } from './components/TodayPage';
import { TrendsPage } from './components/TrendsPage';
import type { AssessmentResult, SleepProfile, SleepScenario } from './domain/types';
import { clearAllLocalData, getAssessmentResult, getSleepProfile, saveSleepProfile } from './storage/localStore';

type ChildView = 'profile' | 'assessment' | 'knowledge' | 'chat' | 'relaxation' | null;

export default function App() {
  const [profile, setProfile] = useState<SleepProfile | null>(() => getSleepProfile());
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(() =>
    getAssessmentResult(),
  );
  const [activeTab, setActiveTab] = useState<MainTab>('today');
  const [childView, setChildView] = useState<ChildView>(null);
  const [selectedScenario, setSelectedScenario] = useState<SleepScenario | null>(null);
  const [selectedRelaxationTool, setSelectedRelaxationTool] = useState('breathing-478');
  const [chatInitialInput, setChatInitialInput] = useState('');

  function completeProfile(nextProfile: SleepProfile) {
    saveSleepProfile(nextProfile);
    setProfile(nextProfile);
    setActiveTab('today');
    setChildView(null);
  }

  function resetProfile() {
    clearAllLocalData();
    setProfile(null);
    setAssessmentResult(null);
    setSelectedScenario(null);
    setActiveTab('today');
    setChildView(null);
  }

  function openChat(scenario?: SleepScenario, initialInput = '') {
    setSelectedScenario(scenario ?? null);
    setChatInitialInput(initialInput);
    setChildView('chat');
  }

  function openKnowledge(scenario?: SleepScenario) {
    setSelectedScenario(scenario ?? null);
    setChildView('knowledge');
  }

  function openRelaxation(toolId: string) {
    setSelectedRelaxationTool(toolId);
    setChildView('relaxation');
  }

  // Show ProfileWizard when explicitly navigating to profile
  if (childView === 'profile') {
    return <ProfileWizard onComplete={completeProfile} />;
  }

  // Show EntryPage for users without a profile
  if (!profile) {
    return <EntryPage onStart={() => setChildView('profile')} />;
  }

  // Render child views first when active
  if (childView === 'assessment') {
    return (
      <AssessmentPage
        profile={profile!}
        onComplete={(result) => {
          setAssessmentResult(result);
        }}
        onBack={() => setChildView(null)}
      />
    );
  }

  if (childView === 'knowledge') {
    return (
      <KnowledgePage
        profile={profile!}
        assessmentResult={assessmentResult}
        initialScenario={selectedScenario ?? undefined}
        onBack={() => setChildView(null)}
      />
    );
  }

  if (childView === 'chat') {
    return (
      <ChatPage
        profile={profile!}
        chatScope={selectedScenario ?? 'general'}
        assessmentResult={assessmentResult}
        initialScenario={selectedScenario}
        initialInput={chatInitialInput}
        onBack={() => {
          setChatInitialInput('');
          setChildView(null);
        }}
        onReset={resetProfile}
      />
    );
  }

  if (childView === 'relaxation') {
    return (
      <RelaxationPage
        toolId={selectedRelaxationTool}
        onBack={() => setChildView(null)}
      />
    );
  }

  // Render tab shell
  function renderTabPage() {
    switch (activeTab) {
      case 'today':
        return (
          <TodayPage
            profile={profile!}
            assessmentResult={assessmentResult}
            onOpenChat={openChat}
            onOpenAssessment={() => setChildView('assessment')}
            onOpenKnowledge={openKnowledge}
            onOpenRelaxation={openRelaxation}
            onOpenDiary={() => setActiveTab('diary')}
          />
        );
      case 'diary':
        return <DiaryPage />;
      case 'trends':
        return (
          <TrendsPage
            onOpenDiary={() => setActiveTab('diary')}
          />
        );
      case 'plans':
        return (
          <PlansPage
            profile={profile!}
            assessmentResult={assessmentResult}
          />
        );
      case 'my':
        return (
          <MyPage
            profile={profile!}
            onReset={resetProfile}
          />
        );
    }
  }

  return (
    <div className="app-shell">
      {renderTabPage()}
      <BottomTabs active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
