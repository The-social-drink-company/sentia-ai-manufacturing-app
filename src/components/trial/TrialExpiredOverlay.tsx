/**
 * Trial Expired Overlay Component
 *
 * Full-screen overlay shown when trial has expired but account is in grace period.
 * Displays days remaining, upgrade CTA, and read-only mode indicator.
 *
 * @epic BMAD-TRIAL-001 (Automated Free Trial Journey)
 * @story Story 5 (Trial Expiration & Grace Period)
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Lock, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TrialExpiredOverlayProps {
  daysRemaining: number;
  gracePeriodEnds: Date;
  currentTier?: string;
  onUpgradeClick?: () => void;
}

const TrialExpiredOverlay: React.FC<TrialExpiredOverlayProps> = ({
  daysRemaining,
  gracePeriodEnds,
  currentTier = 'professional',
  onUpgradeClick,
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  const handleUpgrade = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      navigate('/billing/trial-upgrade');
    }
  };

  const handleViewData = () => {
    setIsVisible(false);
    // Show toast or notification that user is in read-only mode
  };

  // Urgency level based on days remaining
  const urgency = daysRemaining <= 1 ? 'critical' : daysRemaining <= 2 ? 'high' : 'medium';

  const colors = {
    critical: {
      bg: 'bg-red-600',
      bgLight: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      button: 'bg-red-600 hover:bg-red-700',
      icon: 'text-red-500',
    },
    high: {
      bg: 'bg-orange-600',
      bgLight: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-900',
      button: 'bg-orange-600 hover:bg-orange-700',
      icon: 'text-orange-500',
    },
    medium: {
      bg: 'bg-yellow-600',
      bgLight: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      icon: 'text-yellow-500',
    },
  };

  const color = colors[urgency];

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="max-w-2xl w-full mx-4">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`${color.bg} px-8 py-6`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 bg-white bg-opacity-20 rounded-full p-3">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 text-white">
                <h2 className="text-2xl font-bold mb-2">Your Trial Has Ended</h2>
                <p className="text-white text-opacity-90">
                  Your 14-day free trial of CapLiquify {currentTier} expired. You have{' '}
                  <span className="font-semibold">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span>{' '}
                  to upgrade before your account is suspended.
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            {/* Grace Period Info */}
            <div className={`${color.bgLight} ${color.border} border rounded-lg p-4 mb-6`}>
              <div className="flex items-start gap-3">
                <Clock className={`w-5 h-5 ${color.icon} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <h3 className={`font-semibold ${color.text} mb-1`}>Grace Period Active</h3>
                  <p className="text-sm text-gray-700">
                    You currently have <strong>read-only access</strong> to your data. You can view everything but cannot make changes. This grace period ends on{' '}
                    <strong>{gracePeriodEnds.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* What You Can Do */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">What you can access:</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">View all your dashboards and reports</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Export your data and forecasts</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Review working capital analysis</span>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500">Create or modify data (requires upgrade)</span>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-500">Add team members (requires upgrade)</span>
                </div>
              </div>
            </div>

            {/* Pricing Reminder */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Continue with {currentTier}</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  ${currentTier === 'starter' ? '149' : currentTier === 'professional' ? '295' : '595'}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              <p className="text-sm text-gray-600">
                Or save 17% with annual billing (${currentTier === 'starter' ? '1,490' : currentTier === 'professional' ? '2,950' : '5,950'}/year)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                className={`w-full ${color.button} text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors`}
              >
                <CreditCard className="w-5 h-5" />
                Upgrade Now - Restore Full Access
              </button>

              <button
                onClick={handleViewData}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                View My Data (Read-Only Mode)
              </button>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-gray-500 mt-4">
              Questions? <a href="/support" className="text-blue-600 hover:underline">Contact our support team</a>
            </p>
          </div>
        </div>

        {/* Read-Only Indicator Badge (shows after dismissing overlay) */}
        {!isVisible && (
          <div className={`${color.bg} text-white px-4 py-2 rounded-lg mt-4 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Read-Only Mode ({daysRemaining} days left)</span>
            </div>
            <button
              onClick={handleUpgrade}
              className="text-sm underline hover:no-underline"
            >
              Upgrade
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialExpiredOverlay;
