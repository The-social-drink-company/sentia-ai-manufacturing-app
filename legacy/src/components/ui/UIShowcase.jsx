import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SatisfyingButton from './SatisfyingButton';
import DelightfulCard from './DelightfulCard';
import SatisfyingInput from './SatisfyingInput';
import { LoadingSpinner, HeartbeatLoader, ProgressSatisfaction, AIThinkingLoader, SuccessCelebration } from './LoadingStates';
import { useNotifications, NotificationProvider } from './NotificationSystem'
import ThemeSelector from './ThemeSelector';
import { useTheme } from './ThemeProvider';
import { 
  SparklesIcon, 
  HeartIcon, 
  RocketLaunchIcon,
  UserIcon,
  EnvelopeIcon,
  CpuChipIcon,
  GiftIcon,
  FaceSmileIcon,
  EyeIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  SwatchIcon,
  AdjustmentsHorizontalIcon,
  BeakerIcon,
  CodeBracketIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const UIShowcaseContent = () => {
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [buttonSuccess, setButtonSuccess] = useState(false);
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [fontSize, setFontSize] = useState(16);
  const [showTypographyDemo, setShowTypographyDemo] = useState(false);
  
  const { theme, setTheme, themes } = useTheme();
  
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
    showMagic('âœ¨ Form Magic!', 'Your form submission was enchanted with sparkles and joy!');
  };

  const showNotificationDemo = () => {
    const notifications = [
      () => showSuccess('Success Story', 'Your manufacturing process completed with exceptional quality!'),
      () => showInfo('Smart Analytics', 'AI has detected optimization opportunities in your production line.'),
      () => showWarning('Friendly Reminder', 'Inventory levels are getting cozy - time to restock!'),
      () => showError('Oops Moment', 'Connection hiccup detected - but we\'re on it!'),
      () => showMagic('Pure Magic âœ¨', 'Something absolutely delightful just happened in your dashboard!')
    ];
    
    notifications.forEach((notify, i) => {
      setTimeout(notify, i * 600);
    });
  };

  return (
    <div className="min-h-screen bg-primary p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-primary mb-4 tracking-tight">
            âœ¨ Enhanced UI Experience Showcase
          </h1>
          <p className="text-lg text-secondary mb-6 leading-relaxed">
            Revolutionary UI components with premium typography, intelligent theming, and deeply satisfying interactions designed for optimal eye comfort
          </p>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-4xl mx-auto">
            <DelightfulCard className="p-4" gradient="premium">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500 text-white">
                  <EyeIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-primary">Eye Comfort</h3>
              </div>
              <p className="text-sm text-secondary">3 optimized themes for different lighting conditions</p>
            </DelightfulCard>
            
            <DelightfulCard className="p-4" gradient="warm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500 text-white">
                  <DocumentTextIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-primary">Premium Typography</h3>
              </div>
              <p className="text-sm text-secondary">Inter & JetBrains Mono with perfect spacing</p>
            </DelightfulCard>
            
            <DelightfulCard className="p-4" gradient="cool">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500 text-white">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-primary">Emotional Design</h3>
              </div>
              <p className="text-sm text-secondary">Micro-interactions that create joy</p>
            </DelightfulCard>
          </div>
          
          {/* Theme Selection */}
          <div className="flex justify-center mb-8">
            <ThemeSelector variant="cards" />
          </div>
        </motion.div>

        {/* Button Showcase */}
        <DelightfulCard className="mb-8" gradient="premium" glow>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
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

        {/* Typography & Theme Showcase */}
        <DelightfulCard className="mb-8" gradient="premium" glow>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6" />
            Premium Typography & Theming
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Typography Demo */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <SwatchIcon className="w-5 h-5" />
                Typography Scale
              </h3>
              <div className="space-y-4 bg-secondary rounded-xl p-6">
                <div className="space-y-3">
                  <h1 className="text-4xl font-bold text-primary tracking-tight leading-tight">Heading 1</h1>
                  <h2 className="text-3xl font-semibold text-primary tracking-tight">Heading 2</h2>
                  <h3 className="text-2xl font-semibold text-primary">Heading 3</h3>
                  <h4 className="text-xl font-medium text-primary">Heading 4</h4>
                  <h5 className="text-lg font-medium text-primary">Heading 5</h5>
                  <p className="text-base text-secondary leading-relaxed">
                    Body text with optimal line height for comfortable reading. 
                    This paragraph demonstrates the perfect balance of character spacing and line height.
                  </p>
                  <p className="text-sm text-tertiary">Small text for secondary information</p>
                  <code className="text-sm font-mono bg-tertiary px-2 py-1 rounded border border-light">
                    const theme = 'premium';
                  </code>
                </div>
              </div>
            </div>
            
            {/* Theme Comparison */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <PaintBrushIcon className="w-5 h-5" />
                Current Theme: {themes[theme]?.name}
              </h3>
              
              <div className="space-y-4">
                {/* Theme Info Card */}
                <div className="bg-elevated border border-light rounded-xl p-4 shadow-theme-base">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {theme === 'bright' && <SunIcon className="w-5 h-5 text-primary" />}
                      {theme === 'medium' && <ComputerDesktopIcon className="w-5 h-5 text-primary" />}
                      {theme === 'dark' && <MoonIcon className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">{themes[theme]?.name} Mode</h4>
                      <p className="text-sm text-secondary">{themes[theme]?.description}</p>
                    </div>
                  </div>
                  <div className="text-xs text-tertiary">
                    <strong>Best for:</strong> {themes[theme]?.ideal}
                  </div>
                </div>
                
                {/* Color Palette */}
                <div className="bg-elevated border border-light rounded-xl p-4 shadow-theme-base">
                  <h4 className="font-medium text-primary mb-3">Color Palette</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-primary border border-light"></div>
                      <span className="text-tertiary">Primary Text</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-secondary border border-light"></div>
                      <span className="text-tertiary">Secondary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-tertiary border border-light"></div>
                      <span className="text-tertiary">Tertiary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-elevated border border-light"></div>
                      <span className="text-tertiary">Elevated</span>
                    </div>
                  </div>
                </div>
                
                {/* Interactive Theme Selector */}
                <div className="flex justify-center">
                  <ThemeSelector variant="compact" size="medium" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Typography Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-secondary rounded-xl">
              <BoltIcon className="w-8 h-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold text-primary mb-1">Optimized Fonts</h4>
              <p className="text-sm text-tertiary">Inter & JetBrains Mono with perfect kerning</p>
            </div>
            
            <div className="text-center p-4 bg-secondary rounded-xl">
              <AdjustmentsHorizontalIcon className="w-8 h-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold text-primary mb-1">Smart Spacing</h4>
              <p className="text-sm text-tertiary">Line heights optimized for readability</p>
            </div>
            
            <div className="text-center p-4 bg-secondary rounded-xl">
              <EyeIcon className="w-8 h-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold text-primary mb-1">Eye Comfort</h4>
              <p className="text-sm text-tertiary">WCAG AA compliant contrast ratios</p>
            </div>
          </div>
        </DelightfulCard>

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
              Send with Magic âœ¨
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

        {/* Accessibility & Performance Showcase */}
        <DelightfulCard className="mb-8" gradient="cool" glow>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <BeakerIcon className="w-6 h-6" />
            Accessibility & Performance Features
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Accessibility Features */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5" />
                Inclusive Design
              </h3>
              
              <div className="space-y-4">
                <div className="bg-elevated border border-light rounded-xl p-4 shadow-theme-base">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">AA</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">WCAG AA Compliant</h4>
                      <p className="text-sm text-secondary">All color combinations meet accessibility standards</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-elevated border border-light rounded-xl p-4 shadow-theme-base">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <EyeIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">Focus Management</h4>
                      <p className="text-sm text-secondary">Keyboard navigation with visible focus indicators</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-elevated border border-light rounded-xl p-4 shadow-theme-base">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BoltIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">Reduced Motion</h4>
                      <p className="text-sm text-secondary">Respects prefers-reduced-motion preferences</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div>
              <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
                <MagnifyingGlassIcon className="w-5 h-5" />
                Performance Optimization
              </h3>
              
              <div className="space-y-4">
                <div className="bg-elevated border border-light rounded-xl p-4 shadow-theme-base">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-primary">Build Size</h4>
                      <p className="text-sm text-secondary">Optimized bundle with code splitting</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600">141KB</span>
                      <div className="text-xs text-tertiary">gzipped</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-elevated border border-light rounded-xl p-4 shadow-theme-base">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-primary">Build Time</h4>
                      <p className="text-sm text-secondary">Fast development iteration</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">12.0s</span>
                      <div className="text-xs text-tertiary">production</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-elevated border border-light rounded-xl p-4 shadow-theme-base">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-primary">Theme Switch</h4>
                      <p className="text-sm text-secondary">Instant theme transitions</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-purple-600">0ms</span>
                      <div className="text-xs text-tertiary">CSS variables</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Technical Features */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <CodeBracketIcon className="w-5 h-5" />
              Technical Implementation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-secondary rounded-xl border border-light">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">âš›ï¸</span>
                </div>
                <h4 className="font-semibold text-primary mb-1">React 18</h4>
                <p className="text-sm text-tertiary">Latest React with Concurrent Features</p>
              </div>
              
              <div className="text-center p-4 bg-secondary rounded-xl border border-light">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">ðŸŽ­</span>
                </div>
                <h4 className="font-semibold text-primary mb-1">Framer Motion</h4>
                <p className="text-sm text-tertiary">Physics-based animations</p>
              </div>
              
              <div className="text-center p-4 bg-secondary rounded-xl border border-light">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">ðŸŽ¨</span>
                </div>
                <h4 className="font-semibold text-primary mb-1">CSS Variables</h4>
                <p className="text-sm text-tertiary">Dynamic theming system</p>
              </div>
              
              <div className="text-center p-4 bg-secondary rounded-xl border border-light">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-white font-bold text-lg">âš¡</span>
                </div>
                <h4 className="font-semibold text-primary mb-1">Vite</h4>
                <p className="text-sm text-tertiary">Lightning fast build tool</p>
              </div>
            </div>
          </div>
          
          {/* Interactive Demo */}
          <div className="mt-8 text-center">
            <p className="text-secondary mb-4">
              Try tabbing through the interface or switching themes to experience the accessibility features
            </p>
            <div className="inline-flex items-center gap-4 bg-secondary rounded-xl p-4 border border-light">
              <span className="text-sm font-medium text-tertiary">Current theme:</span>
              <div className="flex items-center gap-2">
                {theme === 'bright' && <SunIcon className="w-4 h-4 text-primary" />}
                {theme === 'medium' && <ComputerDesktopIcon className="w-4 h-4 text-primary" />}
                {theme === 'dark' && <MoonIcon className="w-4 h-4 text-primary" />}
                <span className="font-semibold text-primary">{themes[theme]?.name}</span>
              </div>
            </div>
          </div>
        </DelightfulCard>

        {/* Notification Showcase */}
        <DelightfulCard>
          <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
            <SparklesIcon className="w-6 h-6" />
            Enhanced Notifications
          </h2>
          <p className="text-secondary mb-4 leading-relaxed">
            Experience the full spectrum of emotionally intelligent notifications with motion-based feedback and satisfying animations
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
