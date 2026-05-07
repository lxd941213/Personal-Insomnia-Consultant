import { type FormEvent, useState } from 'react';
import type { MainConcern, SleepProfile } from '../domain/types';

interface ProfileWizardProps {
  onComplete: (profile: SleepProfile) => void;
}

const concernOptions: Array<{ value: MainConcern; label: string }> = [
  { value: 'hard_to_fall_asleep', label: 'Hard to fall asleep' },
  { value: 'early_waking', label: 'Waking too early' },
  { value: 'frequent_waking', label: 'Waking often' },
  { value: 'vivid_dreams', label: 'Vivid dreams' },
  { value: 'daytime_sleepiness', label: 'Daytime sleepiness' },
  { value: 'late_night_habit', label: 'Late-night habit' },
  { value: 'other', label: 'Other' },
];

const habitOptions = ['Phone use before bed', 'Caffeine after lunch', 'Alcohol at night', 'Late exercise'];
const safetySignalOptions = ['Severe symptoms', 'Suspected sleep apnea', 'Self-harm thoughts', 'Medication dependence', 'Major underlying disease', 'Pregnancy or postpartum'];

export function ProfileWizard({ onComplete }: ProfileWizardProps) {
  const [profile, setProfile] = useState<SleepProfile>({
    ageRange: '',
    bedtime: '',
    wakeTime: '',
    mainConcern: 'hard_to_fall_asleep',
    concernDuration: '',
    stressLevel: '',
    habits: [],
    daytimeImpact: '',
    safetySignals: [],
    optionalContext: '',
  });

  function update<K extends keyof SleepProfile>(key: K, value: SleepProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function toggleListValue(key: 'habits' | 'safetySignals', value: string) {
    setProfile((current) => {
      const values = current[key];
      return {
        ...current,
        [key]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
      };
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onComplete(profile);
  }

  return (
    <main className="page">
      <form className="panel form-grid" onSubmit={submit}>
        <h1>Build your sleep profile</h1>
        <label>
          Age range
          <select required value={profile.ageRange} onChange={(event) => update('ageRange', event.target.value)}>
            <option value="">Select</option>
            {['Under 18', '18-24', '25-34', '35-44', '45-59', '60+'].map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Usual bedtime
          <input required type="time" value={profile.bedtime} onChange={(event) => update('bedtime', event.target.value)} />
        </label>
        <label>
          Usual wake time
          <input required type="time" value={profile.wakeTime} onChange={(event) => update('wakeTime', event.target.value)} />
        </label>
        <label>
          Main sleep concern
          <select required value={profile.mainConcern} onChange={(event) => update('mainConcern', event.target.value as MainConcern)}>
            {concernOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label>
          Concern duration
          <select required value={profile.concernDuration} onChange={(event) => update('concernDuration', event.target.value)}>
            <option value="">Select</option>
            {['Less than 1 week', '1-4 weeks', '1-3 months', 'More than 3 months'].map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label>
          Stress level
          <select required value={profile.stressLevel} onChange={(event) => update('stressLevel', event.target.value)}>
            <option value="">Select</option>
            {['Low', 'Medium', 'High', 'Very high'].map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
        <fieldset>
          <legend>Sleep-related habits</legend>
          {habitOptions.map((option) => (
            <label className="checkbox-row" key={option}>
              <input type="checkbox" checked={profile.habits.includes(option)} onChange={() => toggleListValue('habits', option)} />
              {option}
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Safety signals</legend>
          {safetySignalOptions.map((option) => (
            <label className="checkbox-row" key={option}>
              <input type="checkbox" checked={profile.safetySignals.includes(option)} onChange={() => toggleListValue('safetySignals', option)} />
              {option}
            </label>
          ))}
        </fieldset>
        <label>
          Daytime impact
          <input required value={profile.daytimeImpact} onChange={(event) => update('daytimeImpact', event.target.value)} />
        </label>
        <label>
          Optional context
          <textarea value={profile.optionalContext} onChange={(event) => update('optionalContext', event.target.value)} />
        </label>
        <button className="primary-button" type="submit">Start consultation</button>
        <p className="fine-print">Your profile is stored only in this browser on this device.</p>
      </form>
    </main>
  );
}
