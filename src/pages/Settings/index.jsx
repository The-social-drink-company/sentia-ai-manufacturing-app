import React, { useState } from 'react';
import { CogIcon, UserIcon, BellIcon, ShieldCheckIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Settings = () => {
  // Authentication removed
  const user = { name: "User" };
  const isSignedIn = true;
  const isLoaded = true;
  const [activeTab, setActiveTab] = useState('general');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    alerts: true,
    reports: true
  });

  const handleThemeToggle = () => {
    const newTheme = darkMode ? 'light' : 'dark';
    setDarkMode(!darkMode);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark');
    toast.success(`Switched to ${newTheme} mode`);
  };

  const handleSaveSettings = () => {
    // Save settings to backend
    toast.success('Settings saved successfully');
  };

  const tabs = [
    { id: 'general', name: 'General', icon: CogIcon },
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'notifications', name: 'Notifications', icon: BellIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">General Settings</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Toggle dark mode theme</p>
                      </div>
                      <button
                        onClick={handleThemeToggle}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700"
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Language</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Select your preferred language</p>
                      </div>
                      <select className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1">
                        <option>English</option>
                        <option>Spanish</option>
                        <option>French</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">Timezone</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Set your local timezone</p>
                      </div>
                      <select className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1">
                        <option>UTC</option>
                        <option>EST</option>
                        <option>PST</option>
                        <option>GMT</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Profile Information</h3>

                <div className="flex items-center gap-4">
                  <img
                    src={user?.imageUrl || 'https://via.placeholder.com/100'}
                    alt="Profile"
                    className="h-20 w-20 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user?.fullName || 'User Name'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{"user@example.com"es?.[0]?.emailAddress || 'email@example.com'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Role: {user?.publicMetadata?.role || 'User'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                    <input
                      type="text"
                      defaultValue={"User"}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      defaultValue={user?.lastName}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notification Preferences</h3>

                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">{key} Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Receive {key} notifications
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700"
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Security Settings</h3>

                <div className="space-y-4">
                  <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                    <p className="font-medium text-gray-900 dark:text-white">Change Password</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Update your password</p>
                  </button>

                  <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                    <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
                  </button>

                  <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600">
                    <p className="font-medium text-gray-900 dark:text-white">Active Sessions</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your active sessions</p>
                  </button>

                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <p className="font-medium text-red-600 dark:text-red-400">Sign Out</p>
                    <p className="text-sm text-red-500 dark:text-red-300">Sign out of your account</p>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;