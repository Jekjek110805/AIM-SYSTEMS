import React, { useEffect, useMemo, useState } from 'react';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  Database,
  Globe,
  Palette,
  Save,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

type SettingsSection = 'General' | 'Notifications' | 'Security' | 'Asset Config' | 'Localization' | 'Appearance';

type SettingsState = {
  organizationName: string;
  systemEmail: string;
  assetCodeFormat: string;
  autoAssignment: boolean;
  emailNotifications: boolean;
  maintenanceAlerts: boolean;
  requireStrongPasswords: boolean;
  sessionTimeoutMinutes: string;
  language: string;
  timezone: string;
  theme: 'light' | 'system';
};

const STORAGE_KEY = 'aims-settings';

const defaultSettings: SettingsState = {
  organizationName: 'AssetFlow Corp',
  systemEmail: 'system@assetflow.com',
  assetCodeFormat: 'AST-{0000}',
  autoAssignment: false,
  emailNotifications: true,
  maintenanceAlerts: true,
  requireStrongPasswords: true,
  sessionTimeoutMinutes: '30',
  language: 'English',
  timezone: 'Asia/Manila',
  theme: 'light',
};

const sections: { label: SettingsSection; icon: React.ElementType }[] = [
  { label: 'General', icon: SettingsIcon },
  { label: 'Notifications', icon: Bell },
  { label: 'Security', icon: Lock },
  { label: 'Asset Config', icon: Database },
  { label: 'Localization', icon: Globe },
  { label: 'Appearance', icon: Palette },
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={cn(
        'relative h-6 w-12 rounded-full transition-colors',
        checked ? 'bg-blue-600' : 'bg-gray-200'
      )}
    >
      <span
        className={cn(
          'absolute top-1 h-4 w-4 rounded-full bg-white transition-all',
          checked ? 'left-7' : 'left-1'
        )}
      />
    </button>
  );
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('General');
  const [form, setForm] = useState<SettingsState>(defaultSettings);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<SettingsState>;
      setForm({ ...defaultSettings, ...parsed });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  useEffect(() => {
    if (!savedMessage) return;
    const timeout = window.setTimeout(() => setSavedMessage(''), 2500);
    return () => window.clearTimeout(timeout);
  }, [savedMessage]);

  const sectionDescription = useMemo(() => {
    switch (activeSection) {
      case 'General':
        return 'Configure core organization and system identity settings.';
      case 'Notifications':
        return 'Control alerts and email notification preferences.';
      case 'Security':
        return 'Manage login protection and session security rules.';
      case 'Asset Config':
        return 'Adjust asset defaults and automatic assignment behavior.';
      case 'Localization':
        return 'Set language and timezone preferences.';
      case 'Appearance':
        return 'Choose how the settings interface should appear.';
      default:
        return '';
    }
  }, [activeSection]);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    setSavedMessage('Settings saved successfully.');
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
          <p className="text-gray-500">Configure global application preferences and security options.</p>
        </div>

        {savedMessage && (
          <div className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
            <CheckCircle2 size={16} />
            {savedMessage}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <aside className="w-full md:w-64 bg-gray-50/50 border-r border-gray-100 p-4 space-y-1">
            {sections.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setActiveSection(item.label)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeSection === item.label
                    ? 'bg-white text-blue-600 shadow-sm border border-gray-100'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </aside>

          <div className="flex-1 p-8 space-y-8">
            <section className="space-y-2">
              <h3 className="text-lg font-bold text-gray-900">{activeSection}</h3>
              <p className="text-sm text-gray-500">{sectionDescription}</p>
            </section>

            {activeSection === 'General' && (
              <section className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Organization Name</label>
                    <input
                      type="text"
                      value={form.organizationName}
                      onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">System Email</label>
                    <input
                      type="email"
                      value={form.systemEmail}
                      onChange={(e) => setForm({ ...form, systemEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'Notifications' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Email Notifications</p>
                    <p className="text-xs text-gray-500">Receive important updates through system email.</p>
                  </div>
                  <Toggle
                    checked={form.emailNotifications}
                    onChange={() => setForm({ ...form, emailNotifications: !form.emailNotifications })}
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Maintenance Alerts</p>
                    <p className="text-xs text-gray-500">Show system alerts for maintenance-related actions.</p>
                  </div>
                  <Toggle
                    checked={form.maintenanceAlerts}
                    onChange={() => setForm({ ...form, maintenanceAlerts: !form.maintenanceAlerts })}
                  />
                </div>
              </section>
            )}

            {activeSection === 'Security' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Require Strong Passwords</p>
                    <p className="text-xs text-gray-500">Enforce stronger password validation for users.</p>
                  </div>
                  <Toggle
                    checked={form.requireStrongPasswords}
                    onChange={() => setForm({ ...form, requireStrongPasswords: !form.requireStrongPasswords })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    value={form.sessionTimeoutMinutes}
                    onChange={(e) => setForm({ ...form, sessionTimeoutMinutes: e.target.value })}
                    className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </section>
            )}

            {activeSection === 'Asset Config' && (
              <section className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Asset Code Format</p>
                    <p className="text-xs text-gray-500">Define how new asset codes are generated.</p>
                  </div>
                  <input
                    type="text"
                    value={form.assetCodeFormat}
                    onChange={(e) => setForm({ ...form, assetCodeFormat: e.target.value })}
                    className="w-40 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                  />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Auto-Assignment</p>
                    <p className="text-xs text-gray-500">Automatically assign assets to departments based on category.</p>
                  </div>
                  <Toggle
                    checked={form.autoAssignment}
                    onChange={() => setForm({ ...form, autoAssignment: !form.autoAssignment })}
                  />
                </div>
              </section>
            )}

            {activeSection === 'Localization' && (
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Language</label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option>English</option>
                    <option>Filipino</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Timezone</label>
                  <select
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Asia/Manila">Asia/Manila</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </section>
            )}

            {activeSection === 'Appearance' && (
              <section className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Theme Preference</label>
                  <select
                    value={form.theme}
                    onChange={(e) => setForm({ ...form, theme: e.target.value as SettingsState['theme'] })}
                    className="w-full max-w-xs px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="light">Light</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                  Appearance preferences are saved locally for this browser session profile.
                </div>
              </section>
            )}

            <div className="pt-8 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-100"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
