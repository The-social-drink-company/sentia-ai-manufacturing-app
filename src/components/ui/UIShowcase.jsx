import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SatisfyingButton from './SatisfyingButton';
import DelightfulCard from './DelightfulCard';
import SatisfyingInput from './SatisfyingInput';
import { LoadingSpinner, HeartbeatLoader, ProgressSatisfaction, AIThinkingLoader, SuccessCelebration } from './LoadingStates';
import { useNotifications, NotificationProvider } from './NotificationSystem';
import { 
  SparklesIcon, 
  HeartIcon, 
  RocketLaunchIcon,
  UserIcon,
  EnvelopeIcon,
  CpuChipIcon,
  GiftIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';

const UIShowcaseContent = () => {
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [buttonSuccess, setButtonSuccess] = useState(false);
  
  const { showSuccess: notifySuccess, showInfo, showWarning, showError, showMagic } = useNotifications();

  const handleProgressDemo = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const handleSuccessDemo = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const handleButtonClick = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setButtonSuccess(true);
      notifySuccess('Action Complete!', 'Your request was processed successfully with delightful animations.');
      setTimeout(() => setButtonSuccess(false), 2000);
    }, 2000);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    showMagic('✨ Form Magic!', 'Your form submission was enchanted with sparkles and joy!');
  };

  const showNotificationDemo = () => {
    const notifications = [
      () => showSuccess('Success Story', 'Your manufacturing process completed with exceptional quality!'),
      () => showInfo('Smart Analytics', 'AI has detected optimization opportunities in your production line.'),
      () => showWarning('Friendly Reminder', 'Inventory levels are getting cozy - time to restock!'),
      () => showError('Oops Moment', 'Connection hiccup detected - but we\'re on it!'),
      () => showMagic('Pure Magic ✨', 'Something absolutely delightful just happened in your dashboard!')
    ];
    
    notifications.forEach((notify, i) => {
      setTimeout(notify, i * 600);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ✨ Sentia UI Experience Showcase
          </h1>
          <p className="text-lg text-gray-600">
            Deeply satisfying user interface components designed to create joy and emotional engagement
          </p>
        </motion.div>

        {/* Button Showcase */}
        <DelightfulCard className="mb-8" gradient="premium" glow>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6" />
            Satisfying Buttons
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SatisfyingButton 
              icon={RocketLaunchIcon}
              onClick={handleButtonClick}
              loading={loading}
              success={buttonSuccess}
            >
              Launch Experience
            </SatisfyingButton>
            <SatisfyingButton variant="success" icon={HeartIcon}>
              Show Love
            </SatisfyingButton>
            <SatisfyingButton variant="danger" icon={GiftIcon}>
              Special Action
            </SatisfyingButton>
          </div>
        </DelightfulCard>

        {/* Card Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <DelightfulCard gradient="warm" hover glow>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaceSmileIcon className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Delightful Design</h3>
              <p className="text-sm text-gray-600">
                Every interaction is crafted to bring a smile to your face
              </p>
            </div>
          </DelightfulCard>

          <DelightfulCard gradient="cool" hover glow>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CpuChipIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Smart Interactions</h3>
              <p className="text-sm text-gray-600">
                AI-powered animations that respond to your emotions
              </p>
            </div>
          </DelightfulCard>

          <DelightfulCard gradient="success" hover glow>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Magical Feedback</h3>
              <p className="text-sm text-gray-600">
                Every action feels magical with satisfying visual feedback
              </p>
            </div>
          </DelightfulCard>
        </div>

        {/* Form Showcase */}
        <DelightfulCard className="mb-8" gradient="glass">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Satisfying Forms</h2>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SatisfyingInput
                label="Your Name"
                icon={UserIcon}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                success={formData.name.length > 2}
                required
              />
              <SatisfyingInput
                label="Email Address"
                type="email"
                icon={EnvelopeIcon}
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                success={formData.email.includes('@')}
                required
              />
            </div>
            <SatisfyingInput
              label="Your Message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Tell us about your experience..."
            />
            <SatisfyingButton type="submit" icon={SparklesIcon}>
              Send with Magic ✨
            </SatisfyingButton>
          </form>
        </DelightfulCard>

        {/* Loading States Showcase */}
        <DelightfulCard className="mb-8" gradient="default">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Emotionally Engaging Loading States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Standard Loading</h3>
                <LoadingSpinner message="Creating magic..." />
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Heartbeat Connection</h3>
                <HeartbeatLoader message="Processing with care..." />
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">AI Thinking</h3>
                <AIThinkingLoader message="AI is crafting your experience..." />
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Satisfying Progress</h3>
              <ProgressSatisfaction progress={progress} message="Building amazing things..." />
              <SatisfyingButton onClick={handleProgressDemo} className="mt-4">
                Demo Progress
              </SatisfyingButton>
            </div>
          </div>
        </DelightfulCard>

        {/* Success Celebration Showcase */}
        <DelightfulCard className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Success Celebrations</h2>
          <div className="flex flex-col items-center space-y-4">
            {showSuccess ? (
              <SuccessCelebration message="Absolutely fantastic!" />
            ) : (
              <SatisfyingButton onClick={handleSuccessDemo} icon={SparklesIcon}>
                Trigger Success Celebration
              </SatisfyingButton>
            )}
          </div>
        </DelightfulCard>

        {/* Notification Showcase */}
        <DelightfulCard>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Enhanced Notifications</h2>
          <p className="text-gray-600 mb-4">
            Experience the full spectrum of emotionally intelligent notifications
          </p>
          <SatisfyingButton onClick={showNotificationDemo} icon={SparklesIcon}>
            Show All Notification Types
          </SatisfyingButton>
        </DelightfulCard>
      </div>
    </div>
  );
};

const UIShowcase = () => {
  return (
    <NotificationProvider>
      <UIShowcaseContent />
    </NotificationProvider>
  );
};

export default UIShowcase;