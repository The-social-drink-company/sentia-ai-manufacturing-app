import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/clerk-react';
import {
  ShieldExclamationIcon,
  HomeIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { getRoleDisplayName, getRoleBadgeColor } from '../config/auth.config';

const UnauthorizedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const userRole = user?.publicMetadata?.role || user?.unsafeMetadata?.role || 'viewer';
  const attemptedPath = location.state?.from?.pathname || '/unknown';
  const reason = location.state?.reason || 'insufficient_permissions';

  const reasons = {
    insufficient_role: {
      title: 'Insufficient Permissions',
      message: 'You don\'t have the required role to access this page.',
      icon: ShieldExclamationIcon,
      color: 'from-red-500 to-orange-500'
    },
    insufficient_permissions: {
      title: 'Access Denied',
      message: 'You don\'t have permission to view this content.',
      icon: LockClosedIcon,
      color: 'from-red-600 to-red-500'
    },
    subscription_required: {
      title: 'Subscription Required',
      message: 'This feature requires an active subscription.',
      icon: UserGroupIcon,
      color: 'from-purple-500 to-pink-500'
    }
  };

  const currentReason = reasons[reason] || reasons.insufficient_permissions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className={`bg-gradient-to-r ${currentReason.color} p-6`}>
            <div className="flex items-center justify-center">
              <div className="bg-white/20 rounded-full p-4">
                <currentReason.icon className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              {currentReason.title}
            </h1>

            <p className="text-gray-300 text-center mb-6">
              {currentReason.message}
            </p>

            {/* User Role Display */}
            <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Your current role:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(userRole)}`}>
                  {getRoleDisplayName(userRole)}
                </span>
              </div>

              {attemptedPath !== '/unknown' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Attempted access:</span>
                  <code className="text-xs text-red-400 bg-gray-900 px-2 py-1 rounded">
                    {attemptedPath}
                  </code>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(-1)}
                className="w-full flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Go Back</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/dashboard')}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
              >
                <HomeIcon className="h-5 w-5" />
                <span>Go to Dashboard</span>
              </motion.button>
            </div>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-sm text-gray-400 text-center">
                If you believe you should have access to this page, please contact your administrator.
              </p>

              {user?.emailAddresses?.[0]?.emailAddress && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Logged in as: {user.emailAddresses[0].emailAddress}
                </p>
              )}
            </div>

            {/* Request Access Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                // In a real app, this would open a request form or send an email
                alert('Access request feature coming soon. Please contact your administrator.');
              }}
              className="w-full mt-4 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Request Access →
            </motion.button>
          </div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-gray-500">
            Error Code: 403 • {new Date().toLocaleTimeString()}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;