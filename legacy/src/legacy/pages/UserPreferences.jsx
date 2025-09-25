import React, { useState } from 'react'
import { 
  UserIcon, 
  PaintBrushIcon, 
  GlobeAltIcon,
  BellIcon,
  CogIcon,
  MoonIcon,
  SunIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline'
import { useLayoutStore } from '../stores/layoutStore'
import { cn } from '../lib/utils'

const PreferenceSection = ({ title, description, children, icon: Icon }) => (
  <div className="bg-elevated rounded-lg border border-light p-6 shadow-theme-sm">
    <div className="flex items-center mb-4">
      <Icon className="w-5 h-5 text-blue-600 mr-3" />
      <div>
        <h3 className="text-lg font-medium text-primary">{title}</h3>
        <p className="text-sm text-tertiary">{description}</p>
      </div>
    </div>
    {children}
  </div>
)

const ToggleSwitch = ({ enabled, onChange, label, description }) => (
  <div className="flex items-center justify-between py-3">
    <div>
      <h4 className="text-sm font-medium text-primary">{label}</h4>
      <p className="text-sm text-tertiary">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        enabled ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  </div>
)

const SelectOption = ({ value, onChange, options, label, description }) => (
  <div className="py-3">
    <label className="block text-sm font-medium text-primary mb-1">
      {label}
    </label>
    <p className="text-sm text-tertiary mb-2">{description}</p>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 block w-full rounded-md border-light bg-elevated text-primary shadow-sm focus:border-blue-500 focus:ring-blue-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
)

export default function UserPreferences() {
  const { theme, setTheme } = useLayoutStore()
  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      browser: true,
      stockAlerts: true,
      forecastComplete: true,
      systemMaintenance: false
    },
    display: {
      language: 'en-US',
      currency: 'GBP',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Europe/London',
      numberFormat: 'UK'
    },
    dashboard: {
      autoRefresh: true,
      refreshInterval: 30,
      compactView: false,
      showHelpTips: true
    }
  })

  const updatePreference = (category, key, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }))
  }

  const themeOptions = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: ComputerDesktopIcon }
  ]

  const languageOptions = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'de-DE', label: 'German' },
    { value: 'fr-FR', label: 'French' },
    { value: 'es-ES', label: 'Spanish' }
  ]

  const currencyOptions = [
    { value: 'GBP', label: 'British Pound (Â£)' },
    { value: 'USD', label: 'US Dollar ($)' },
    { value: 'EUR', label: 'Euro (â‚¬)' },
    { value: 'JPY', label: 'Japanese Yen (Â¥)' }
  ]

  const timezoneOptions = [
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'America/New_York', label: 'New York (EST)' },
    { value: 'America/Los_Angeles', label: 'Los Angeles (PST)' },
    { value: 'Europe/Berlin', label: 'Berlin (CET)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' }
  ]

  const refreshIntervalOptions = [
    { value: 15, label: '15 seconds' },
    { value: 30, label: '30 seconds' },
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 0, label: 'Manual only' }
  ]

  const handleSave = () => {
    localStorage.setItem('user-preferences', JSON.stringify(preferences))
    // Show success notification
    console.log('Preferences saved:', preferences)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-2">User Preferences</h1>
        <p className="text-tertiary">
          Customize your experience with the Sentia Manufacturing Dashboard
        </p>
      </div>

      {/* Theme & Appearance */}
      <PreferenceSection
        title="Theme & Appearance"
        description="Customize the look and feel of your dashboard"
        icon={PaintBrushIcon}
      >
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-primary mb-3">Color Theme</h4>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-lg border-2 transition-colors",
                      theme === option.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900"
                        : "border-light hover:border-gray-300"
                    )}
                  >
                    <Icon className="w-6 h-6 mb-2 text-tertiary" />
                    <span className="text-sm text-primary">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <ToggleSwitch
            enabled={preferences.dashboard.compactView}
            onChange={(value) => updatePreference('dashboard', 'compactView', value)}
            label="Compact View"
            description="Use a more compact layout to fit more information on screen"
          />

          <ToggleSwitch
            enabled={preferences.dashboard.showHelpTips}
            onChange={(value) => updatePreference('dashboard', 'showHelpTips', value)}
            label="Show Help Tips"
            description="Display helpful tooltips and guidance throughout the application"
          />
        </div>
      </PreferenceSection>

      {/* Localization */}
      <PreferenceSection
        title="Language & Region"
        description="Set your language, currency, and regional preferences"
        icon={GlobeAltIcon}
      >
        <div className="space-y-4">
          <SelectOption
            value={preferences.display.language}
            onChange={(value) => updatePreference('display', 'language', value)}
            options={languageOptions}
            label="Language"
            description="Choose your preferred language for the interface"
          />

          <SelectOption
            value={preferences.display.currency}
            onChange={(value) => updatePreference('display', 'currency', value)}
            options={currencyOptions}
            label="Default Currency"
            description="Currency used for financial displays and reports"
          />

          <SelectOption
            value={preferences.display.timezone}
            onChange={(value) => updatePreference('display', 'timezone', value)}
            options={timezoneOptions}
            label="Timezone"
            description="Your local timezone for date and time displays"
          />
        </div>
      </PreferenceSection>

      {/* Notifications */}
      <PreferenceSection
        title="Notifications"
        description="Control when and how you receive notifications"
        icon={BellIcon}
      >
        <div className="space-y-1">
          <ToggleSwitch
            enabled={preferences.notifications.email}
            onChange={(value) => updatePreference('notifications', 'email', value)}
            label="Email Notifications"
            description="Receive important updates via email"
          />

          <ToggleSwitch
            enabled={preferences.notifications.browser}
            onChange={(value) => updatePreference('notifications', 'browser', value)}
            label="Browser Notifications"
            description="Show notifications in your browser"
          />

          <ToggleSwitch
            enabled={preferences.notifications.stockAlerts}
            onChange={(value) => updatePreference('notifications', 'stockAlerts', value)}
            label="Stock Level Alerts"
            description="Get notified when stock levels are low"
          />

          <ToggleSwitch
            enabled={preferences.notifications.forecastComplete}
            onChange={(value) => updatePreference('notifications', 'forecastComplete', value)}
            label="Forecast Completion"
            description="Notifications when demand forecasts are completed"
          />

          <ToggleSwitch
            enabled={preferences.notifications.systemMaintenance}
            onChange={(value) => updatePreference('notifications', 'systemMaintenance', value)}
            label="System Maintenance"
            description="Alerts about scheduled system maintenance"
          />
        </div>
      </PreferenceSection>

      {/* Dashboard Settings */}
      <PreferenceSection
        title="Dashboard Settings"
        description="Configure how your dashboard behaves"
        icon={CogIcon}
      >
        <div className="space-y-4">
          <ToggleSwitch
            enabled={preferences.dashboard.autoRefresh}
            onChange={(value) => updatePreference('dashboard', 'autoRefresh', value)}
            label="Auto Refresh"
            description="Automatically update dashboard data"
          />

          {preferences.dashboard.autoRefresh && (
            <SelectOption
              value={preferences.dashboard.refreshInterval}
              onChange={(value) => updatePreference('dashboard', 'refreshInterval', parseInt(value))}
              options={refreshIntervalOptions}
              label="Refresh Interval"
              description="How often to automatically refresh dashboard data"
            />
          )}
        </div>
      </PreferenceSection>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-light">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Save Preferences
        </button>
      </div>
    </div>
  )
}
