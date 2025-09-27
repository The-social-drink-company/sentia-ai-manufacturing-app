import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  UserIcon,
  BellIcon,
  PaintBrushIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  KeyIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
  ChartBarIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const UserPreferences = () => {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // User preferences state
  const [preferences, setPreferences] = useState({
    // Profile
    displayName: '',
    email: '',
    phone: '',
    department: 'production',
    jobTitle: '',

    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    smsAlerts: false,
    dailyDigest: true,
    weeklyReports: true,
    alertTypes: {
      qualityIssues: true,
      machineDowntime: true,
      inventoryLow: true,
      maintenanceDue: true,
      orderDelays: false
    },

    // Display
    theme: 'system',
    language: 'en',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberFormat: 'comma',
    defaultView: 'dashboard',
    compactMode: false,
    showTooltips: true,
    animations: true,

    // Dashboard
    refreshInterval: '30',
    defaultTimeRange: '7d',
    showMetricLabels: true,
    gridColumns: 12,
    widgetDensity: 'normal',
    chartType: 'line',

    // Privacy & Security
    twoFactorAuth: false,
    sessionTimeout: '30',
    dataSharing: false,
    analyticsTracking: true,
    showActivityLog: true,
    requirePasswordChange: false
  });

  // Load user preferences
  useEffect(() {
    if (isLoaded && user) {
      setPreferences(prev => ({
        ...prev,
        displayName: user.fullName || user.firstName || '',
        email: user.emailAddresses?.[0]?.emailAddress || ''
      }));

      // Load saved preferences from localStorage
      const savedPrefs = localStorage.getItem('userPreferences');
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          setPreferences(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed to load preferences:', e);
        }
      }
    }
  }, [isLoaded, user]);

  // Handle preference changes
  const handlePreferenceChange = (_category, _field, _value) => {
    setPreferences(prev => {
      if (category) {
        return {
          ...prev,
          [category]: {
            ...prev[category],
            [field]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
    setUnsavedChanges(true);
  };

  // Save preferences
  const savePreferences = () => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    setUnsavedChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Reset preferences
  const resetPreferences = () => {
    if (window.confirm('Are you sure you want to reset all preferences to defaults?')) {
      localStorage.removeItem('userPreferences');
      window.location.reload();
    }
  };

  const departments = [
    { value: 'production', label: 'Production' },
    { value: 'quality', label: 'Quality Control' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'management', label: 'Management' }
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' }
  ];

  const timeRanges = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">User Preferences</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Customize your dashboard experience and notification settings
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 md:mt-0">
          {unsavedChanges && (
            <Badge variant="warning" className="flex items-center gap-1">
              <ExclamationTriangleIcon className="w-3 h-3" />
              Unsaved Changes
            </Badge>
          )}
          {saveSuccess && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircleIcon className="w-3 h-3" />
              Saved Successfully
            </Badge>
          )}
          <Button variant="outline" onClick={resetPreferences}>
            Reset to Defaults
          </Button>
          <Button onClick={savePreferences} disabled={!unsavedChanges}>
            Save Changes
          </Button>
        </div>
      </div>

      {/* Alert for unsaved changes */}
      {unsavedChanges && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
          <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
          <AlertTitle>You have unsaved changes</AlertTitle>
          <AlertDescription>
            Don't forget to save your preferences before leaving this page.
          </AlertDescription>
        </Alert>
      )}

      {/* Preferences Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={preferences.displayName}
                    onChange={(e) => handlePreferenceChange(null, 'displayName', e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={preferences.email}
                    onChange={(e) => handlePreferenceChange(null, 'email', e.target.value)}
                    placeholder="your.email@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={preferences.phone}
                    onChange={(e) => handlePreferenceChange(null, 'phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={preferences.department}
                    onValueChange={(value) => handlePreferenceChange(null, 'department', value)}
                  >
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={preferences.jobTitle}
                    onChange={(e) => handlePreferenceChange(null, 'jobTitle', e.target.value)}
                    placeholder="e.g., Production Manager"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BellIcon className="w-5 h-5 mr-2" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notification Channels */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Notification Channels</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ComputerDesktopIcon className="w-5 h-5 text-gray-500" />
                      <Label htmlFor="email-notif">Email Notifications</Label>
                    </div>
                    <Switch
                      id="email-notif"
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BellIcon className="w-5 h-5 text-gray-500" />
                      <Label htmlFor="push-notif">Push Notifications</Label>
                    </div>
                    <Switch
                      id="push-notif"
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'pushNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DevicePhoneMobileIcon className="w-5 h-5 text-gray-500" />
                      <Label htmlFor="sms-alerts">SMS Alerts</Label>
                    </div>
                    <Switch
                      id="sms-alerts"
                      checked={preferences.smsAlerts}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'smsAlerts', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Alert Types */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Alert Types</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="quality-issues">Quality Issues</Label>
                    <Switch
                      id="quality-issues"
                      checked={preferences.alertTypes.qualityIssues}
                      onCheckedChange={(checked) => handlePreferenceChange('alertTypes', 'qualityIssues', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="machine-downtime">Machine Downtime</Label>
                    <Switch
                      id="machine-downtime"
                      checked={preferences.alertTypes.machineDowntime}
                      onCheckedChange={(checked) => handlePreferenceChange('alertTypes', 'machineDowntime', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inventory-low">Low Inventory</Label>
                    <Switch
                      id="inventory-low"
                      checked={preferences.alertTypes.inventoryLow}
                      onCheckedChange={(checked) => handlePreferenceChange('alertTypes', 'inventoryLow', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance-due">Maintenance Due</Label>
                    <Switch
                      id="maintenance-due"
                      checked={preferences.alertTypes.maintenanceDue}
                      onCheckedChange={(checked) => handlePreferenceChange('alertTypes', 'maintenanceDue', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="order-delays">Order Delays</Label>
                    <Switch
                      id="order-delays"
                      checked={preferences.alertTypes.orderDelays}
                      onCheckedChange={(checked) => handlePreferenceChange('alertTypes', 'orderDelays', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Reports */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Scheduled Reports</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-500" />
                      <Label htmlFor="daily-digest">Daily Digest</Label>
                    </div>
                    <Switch
                      id="daily-digest"
                      checked={preferences.dailyDigest}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'dailyDigest', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                      <Label htmlFor="weekly-reports">Weekly Reports</Label>
                    </div>
                    <Switch
                      id="weekly-reports"
                      checked={preferences.weeklyReports}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'weeklyReports', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PaintBrushIcon className="w-5 h-5 mr-2" />
                Display Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Theme */}
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value) => handlePreferenceChange(null, 'theme', value)}
                  >
                    <SelectTrigger id="theme">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <SunIcon className="w-4 h-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <MoonIcon className="w-4 h-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <ComputerDesktopIcon className="w-4 h-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) => handlePreferenceChange(null, 'language', value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Format */}
                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={preferences.dateFormat}
                    onValueChange={(value) => handlePreferenceChange(null, 'dateFormat', value)}
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Format */}
                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select
                    value={preferences.timeFormat}
                    onValueChange={(value) => handlePreferenceChange(null, 'timeFormat', value)}
                  >
                    <SelectTrigger id="timeFormat">
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Display Options */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Display Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="compact-mode">Compact Mode</Label>
                    <Switch
                      id="compact-mode"
                      checked={preferences.compactMode}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'compactMode', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-tooltips">Show Tooltips</Label>
                    <Switch
                      id="show-tooltips"
                      checked={preferences.showTooltips}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'showTooltips', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="animations">Enable Animations</Label>
                    <Switch
                      id="animations"
                      checked={preferences.animations}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'animations', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Dashboard Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Refresh Interval */}
                <div className="space-y-2">
                  <Label htmlFor="refreshInterval">Auto-Refresh Interval</Label>
                  <Select
                    value={preferences.refreshInterval}
                    onValueChange={(value) => handlePreferenceChange(null, 'refreshInterval', value)}
                  >
                    <SelectTrigger id="refreshInterval">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="10">10 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Default Time Range */}
                <div className="space-y-2">
                  <Label htmlFor="defaultTimeRange">Default Time Range</Label>
                  <Select
                    value={preferences.defaultTimeRange}
                    onValueChange={(value) => handlePreferenceChange(null, 'defaultTimeRange', value)}
                  >
                    <SelectTrigger id="defaultTimeRange">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeRanges.map(range => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Default View */}
                <div className="space-y-2">
                  <Label htmlFor="defaultView">Default View</Label>
                  <Select
                    value={preferences.defaultView}
                    onValueChange={(value) => handlePreferenceChange(null, 'defaultView', value)}
                  >
                    <SelectTrigger id="defaultView">
                      <SelectValue placeholder="Select default view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Chart Type */}
                <div className="space-y-2">
                  <Label htmlFor="chartType">Preferred Chart Type</Label>
                  <Select
                    value={preferences.chartType}
                    onValueChange={(value) => handlePreferenceChange(null, 'chartType', value)}
                  >
                    <SelectTrigger id="chartType">
                      <SelectValue placeholder="Select chart type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Widget Settings */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Widget Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="metric-labels">Show Metric Labels</Label>
                    <Switch
                      id="metric-labels"
                      checked={preferences.showMetricLabels}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'showMetricLabels', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="widgetDensity">Widget Density</Label>
                    <Select
                      value={preferences.widgetDensity}
                      onValueChange={(value) => handlePreferenceChange(null, 'widgetDensity', value)}
                    >
                      <SelectTrigger id="widgetDensity">
                        <SelectValue placeholder="Select density" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldCheckIcon className="w-5 h-5 mr-2" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security Options */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Security Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyIcon className="w-5 h-5 text-gray-500" />
                      <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                    </div>
                    <Switch
                      id="two-factor"
                      checked={preferences.twoFactorAuth}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'twoFactorAuth', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout</Label>
                    <Select
                      value={preferences.sessionTimeout}
                      onValueChange={(value) => handlePreferenceChange(null, 'sessionTimeout', value)}
                    >
                      <SelectTrigger id="sessionTimeout">
                        <SelectValue placeholder="Select timeout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="240">4 hours</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password-change">Require Password Change Every 90 Days</Label>
                    <Switch
                      id="password-change"
                      checked={preferences.requirePasswordChange}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'requirePasswordChange', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Options */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Privacy Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="data-sharing">Allow Data Sharing for Analytics</Label>
                    <Switch
                      id="data-sharing"
                      checked={preferences.dataSharing}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'dataSharing', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="analytics-tracking">Analytics Tracking</Label>
                    <Switch
                      id="analytics-tracking"
                      checked={preferences.analyticsTracking}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'analyticsTracking', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="activity-log">Show Activity Log</Label>
                    <Switch
                      id="activity-log"
                      checked={preferences.showActivityLog}
                      onCheckedChange={(checked) => handlePreferenceChange(null, 'showActivityLog', checked)}
                    />
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                    <span>Last login</span>
                    <span className="text-gray-600 dark:text-gray-400">Today at 9:00 AM</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                    <span>Password changed</span>
                    <span className="text-gray-600 dark:text-gray-400">30 days ago</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                    <span>Preferences updated</span>
                    <span className="text-gray-600 dark:text-gray-400">Just now</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserPreferences;