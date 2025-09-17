import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  UserIcon,
  BriefcaseIcon,
  ChartBarIcon,
  CogIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

/**
 * UserOnboarding Component - Guides new users through initial setup
 */
const UserOnboarding = ({ onComplete }) => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    department: '',
    role: '',
    preferences: {
      dashboardLayout: 'default',
      notifications: true,
      theme: 'auto'
    },
    areasOfInterest: []
  });

  // Check if user has completed onboarding
  useEffect(() => {
    if (isLoaded && user) {
      const hasCompletedOnboarding = user.publicMetadata?.onboardingCompleted ||
                                    user.unsafeMetadata?.onboardingCompleted;
      if (hasCompletedOnboarding) {
        onComplete?.();
        navigate('/dashboard');
      }
    }
  }, [user, isLoaded, navigate, onComplete]);

  const steps = [
    {
      id: 'welcome',
      title: `Welcome to Sentia, ${user?.firstName || 'User'}!`,
      subtitle: "Let's get you set up in just a few steps",
      icon: RocketLaunchIcon,
      content: WelcomeStep
    },
    {
      id: 'profile',
      title: 'Tell us about yourself',
      subtitle: 'This helps us customize your experience',
      icon: UserIcon,
      content: ProfileStep
    },
    {
      id: 'preferences',
      title: 'Set your preferences',
      subtitle: 'Customize how the dashboard works for you',
      icon: CogIcon,
      content: PreferencesStep
    },
    {
      id: 'interests',
      title: 'What interests you most?',
      subtitle: 'We\'ll prioritize these areas in your dashboard',
      icon: ChartBarIcon,
      content: InterestsStep
    },
    {
      id: 'complete',
      title: 'You\'re all set!',
      subtitle: 'Welcome to your manufacturing dashboard',
      icon: CheckCircleIcon,
      content: CompleteStep
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    try {
      // Update user metadata to mark onboarding as complete
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          onboardingCompleted: true,
          onboardingData,
          completedAt: new Date().toISOString()
        }
      });

      // Save preferences to localStorage as well
      localStorage.setItem('userPreferences', JSON.stringify(onboardingData.preferences));

      onComplete?.();
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const updateData = (updates) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  };

  const CurrentStepComponent = steps[currentStep].content;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center px-4">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
        />
      </div>

      <motion.div
        key={currentStep}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8">
          {/* Step Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4"
            >
              {React.createElement(steps[currentStep].icon, {
                className: 'h-10 w-10 text-white'
              })}
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-2">
              {steps[currentStep].title}
            </h1>
            <p className="text-gray-300">
              {steps[currentStep].subtitle}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            <CurrentStepComponent
              data={onboardingData}
              updateData={updateData}
              user={user}
            />
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              className={`px-6 py-3 text-white/70 hover:text-white transition-colors ${
                currentStep === 0 ? 'invisible' : ''
              }`}
            >
              Back
            </button>

            {/* Step Indicators */}
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-white'
                      : index < currentStep
                      ? 'bg-white/60'
                      : 'bg-white/20'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center"
            >
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Step Components
const WelcomeStep = ({ user }) => (
  <div className="text-center space-y-6">
    <div className="text-6xl mx-auto">🎉</div>
    <p className="text-xl text-white">
      We're excited to have you on board!
    </p>
    <p className="text-gray-300">
      This quick setup will help us personalize your manufacturing dashboard experience.
      It'll only take 2 minutes.
    </p>
    <div className="grid grid-cols-3 gap-4 mt-8">
      <div className="text-center">
        <div className="text-3xl mb-2">📊</div>
        <p className="text-sm text-gray-300">Real-time Analytics</p>
      </div>
      <div className="text-center">
        <div className="text-3xl mb-2">🤖</div>
        <p className="text-sm text-gray-300">AI Insights</p>
      </div>
      <div className="text-center">
        <div className="text-3xl mb-2">📈</div>
        <p className="text-sm text-gray-300">Performance Tracking</p>
      </div>
    </div>
  </div>
);

const ProfileStep = ({ data, updateData }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Department
      </label>
      <select
        value={data.department}
        onChange={(e) => updateData({ department: e.target.value })}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
      >
        <option value="">Select your department</option>
        <option value="manufacturing">Manufacturing</option>
        <option value="operations">Operations</option>
        <option value="finance">Finance</option>
        <option value="quality">Quality Control</option>
        <option value="supply-chain">Supply Chain</option>
        <option value="it">IT</option>
        <option value="management">Management</option>
      </select>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Primary Role
      </label>
      <select
        value={data.role}
        onChange={(e) => updateData({ role: e.target.value })}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
      >
        <option value="">Select your role</option>
        <option value="executive">Executive</option>
        <option value="manager">Manager</option>
        <option value="analyst">Analyst</option>
        <option value="operator">Operator</option>
        <option value="engineer">Engineer</option>
        <option value="coordinator">Coordinator</option>
      </select>
    </div>
  </div>
);

const PreferencesStep = ({ data, updateData }) => (
  <div className="space-y-6">
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Dashboard Layout
      </label>
      <div className="grid grid-cols-2 gap-4">
        {['default', 'compact', 'detailed', 'executive'].map(layout => (
          <button
            key={layout}
            onClick={() => updateData({
              preferences: { ...data.preferences, dashboardLayout: layout }
            })}
            className={`p-4 rounded-lg border-2 transition-all ${
              data.preferences.dashboardLayout === layout
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <div className="font-medium capitalize">{layout}</div>
            <div className="text-xs mt-1 opacity-70">
              {layout === 'default' && 'Balanced view'}
              {layout === 'compact' && 'More data, less space'}
              {layout === 'detailed' && 'Comprehensive metrics'}
              {layout === 'executive' && 'High-level overview'}
            </div>
          </button>
        ))}
      </div>
    </div>

    <div>
      <label className="flex items-center space-x-3 text-white cursor-pointer">
        <input
          type="checkbox"
          checked={data.preferences.notifications}
          onChange={(e) => updateData({
            preferences: { ...data.preferences, notifications: e.target.checked }
          })}
          className="w-5 h-5 bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-blue-500"
        />
        <span>Enable notifications for important updates</span>
      </label>
    </div>
  </div>
);

const InterestsStep = ({ data, updateData }) => {
  const interests = [
    { id: 'production', label: 'Production Metrics', icon: '⚙️' },
    { id: 'quality', label: 'Quality Control', icon: '✅' },
    { id: 'inventory', label: 'Inventory Management', icon: '📦' },
    { id: 'financial', label: 'Financial Analytics', icon: '💰' },
    { id: 'forecasting', label: 'Demand Forecasting', icon: '📊' },
    { id: 'maintenance', label: 'Equipment Maintenance', icon: '🔧' }
  ];

  const toggleInterest = (id) => {
    const current = data.areasOfInterest || [];
    if (current.includes(id)) {
      updateData({ areasOfInterest: current.filter(i => i !== id) });
    } else {
      updateData({ areasOfInterest: [...current, id] });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-300 mb-4">
        Select the areas you want to focus on (you can change this later)
      </p>
      <div className="grid grid-cols-2 gap-4">
        {interests.map(interest => (
          <button
            key={interest.id}
            onClick={() => toggleInterest(interest.id)}
            className={`p-4 rounded-lg border-2 transition-all flex items-center space-x-3 ${
              (data.areasOfInterest || []).includes(interest.id)
                ? 'border-blue-500 bg-blue-500/20 text-white'
                : 'border-white/20 bg-white/5 text-gray-300 hover:bg-white/10'
            }`}
          >
            <span className="text-2xl">{interest.icon}</span>
            <span className="font-medium">{interest.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const CompleteStep = ({ data }) => (
  <div className="text-center space-y-6">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', duration: 0.5, delay: 0.2 }}
      className="text-6xl mx-auto"
    >
      🚀
    </motion.div>
    <div className="space-y-4">
      <p className="text-xl text-white font-semibold">
        Perfect! Your dashboard is ready.
      </p>
      <p className="text-gray-300">
        Based on your preferences, we've customized your dashboard with:
      </p>
      <div className="bg-white/10 rounded-lg p-4 space-y-2 text-left max-w-md mx-auto">
        <div className="flex items-center space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
          <span className="text-white">Personalized layout</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
          <span className="text-white">Role-based access</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
          <span className="text-white">Relevant widgets & metrics</span>
        </div>
        <div className="flex items-center space-x-2">
          <CheckCircleIcon className="h-5 w-5 text-green-400" />
          <span className="text-white">Custom notifications</span>
        </div>
      </div>
    </div>
  </div>
);

export default UserOnboarding;