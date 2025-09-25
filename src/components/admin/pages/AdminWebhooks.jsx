import React from 'react'
import { GlobeAltIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
const AdminWebhooks = () => {
  const { hasPermission } = useAuthRole()

  if (!hasPermission('admin.webhooks.view')) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheckIcon className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to view webhooks.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Webhooks</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage webhook endpoints and event subscriptions
        </p>
      </div>
      
      <div className="text-center py-12">
        <GlobeAltIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Webhook Management</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Webhook configuration interface will be implemented here
        </p>
      </div>
    </div>
  )
}

export default AdminWebhooks