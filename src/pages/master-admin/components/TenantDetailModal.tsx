/**
 * Tenant Detail Modal Component
 *
 * Displays comprehensive tenant information with management actions.
 * Allows viewing users, subscription details, audit logs, and performing
 * administrative actions (suspend, reactivate, edit).
 *
 * @module src/pages/master-admin/components/TenantDetailModal
 * @epic PHASE-5.1-MASTER-ADMIN-DASHBOARD
 * @story ADMIN-005
 */

import { useState, Fragment } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import {
  X,
  Users,
  CreditCard,
  Activity,
  Ban,
  CheckCircle,
  Edit,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  useMasterAdminTenantDetail,
  useSuspendTenant,
  useReactivateTenant,
  useUpdateTenant,
  useDeleteTenant,
} from '../hooks/useMasterAdmin';
import toast from 'react-hot-toast';

interface TenantDetailModalProps {
  tenantId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TenantDetailModal({
  tenantId,
  isOpen,
  onClose,
}: TenantDetailModalProps) {
  const { data, isLoading, error } = useMasterAdminTenantDetail(tenantId);
  const suspendMutation = useSuspendTenant();
  const reactivateMutation = useReactivateTenant();
  const updateMutation = useUpdateTenant();
  const deleteMutation = useDeleteTenant();

  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const tenant = data?.success ? data.data : null;

  // Handle suspend action
  const handleSuspend = async () => {
    if (!tenantId || !suspendReason.trim()) {
      toast.error('Please provide a reason for suspension');
      return;
    }

    try {
      await suspendMutation.mutateAsync({
        tenantId,
        reason: suspendReason,
      });
      toast.success('Tenant suspended successfully');
      setShowSuspendDialog(false);
      setSuspendReason('');
      onClose();
    } catch (error) {
      toast.error('Failed to suspend tenant');
      console.error(error);
    }
  };

  // Handle reactivate action
  const handleReactivate = async () => {
    if (!tenantId) return;

    try {
      await reactivateMutation.mutateAsync(tenantId);
      toast.success('Tenant reactivated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to reactivate tenant');
      console.error(error);
    }
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!tenantId || deleteConfirmation !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        tenantId,
        confirm: 'DELETE',
      });
      toast.success('Tenant deleted successfully');
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
      onClose();
    } catch (error) {
      toast.error('Failed to delete tenant');
      console.error(error);
    }
  };

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Dialog.Title className="text-2xl font-bold">
                          {tenant?.name || 'Loading...'}
                        </Dialog.Title>
                        {tenant && (
                          <p className="text-red-100 text-sm mt-1">
                            {tenant.slug} • Created{' '}
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {isLoading && (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                      </div>
                    )}

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <p className="text-red-900 text-sm">
                          Failed to load tenant details
                        </p>
                      </div>
                    )}

                    {tenant && (
                      <>
                        {/* Quick Actions */}
                        <div className="flex gap-3 mb-6">
                          {tenant.subscriptionStatus === 'suspended' ? (
                            <button
                              onClick={handleReactivate}
                              disabled={reactivateMutation.isPending}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle className="w-4 h-4" />
                              {reactivateMutation.isPending
                                ? 'Reactivating...'
                                : 'Reactivate'}
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowSuspendDialog(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                              Suspend
                            </button>
                          )}

                          <button
                            onClick={() => setShowDeleteDialog(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>

                        {/* Tabs */}
                        <Tab.Group>
                          <Tab.List className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
                            <Tab
                              className={({ selected }) =>
                                `flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                                  selected
                                    ? 'bg-white text-red-600 shadow'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`
                              }
                            >
                              <div className="flex items-center justify-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Subscription
                              </div>
                            </Tab>
                            <Tab
                              className={({ selected }) =>
                                `flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                                  selected
                                    ? 'bg-white text-red-600 shadow'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`
                              }
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Users className="w-4 h-4" />
                                Users ({tenant.users.length})
                              </div>
                            </Tab>
                            <Tab
                              className={({ selected }) =>
                                `flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                                  selected
                                    ? 'bg-white text-red-600 shadow'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`
                              }
                            >
                              <div className="flex items-center justify-center gap-2">
                                <Activity className="w-4 h-4" />
                                Audit Logs ({tenant.auditLogs.length})
                              </div>
                            </Tab>
                          </Tab.List>

                          <Tab.Panels>
                            {/* Subscription Tab */}
                            <Tab.Panel>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">
                                      Tier
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 capitalize">
                                      {tenant.subscriptionTier}
                                    </div>
                                  </div>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-600 mb-1">
                                      Status
                                    </div>
                                    <div className="text-lg font-semibold text-gray-900 capitalize">
                                      {tenant.subscriptionStatus}
                                    </div>
                                  </div>
                                </div>

                                {tenant.subscription && (
                                  <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-900 mb-3">
                                      Billing Information
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <div className="text-gray-600">Amount</div>
                                        <div className="font-medium text-gray-900">
                                          ${tenant.subscription.amountCents / 100}/
                                          {tenant.subscription.billingCycle}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-gray-600">
                                          Current Period
                                        </div>
                                        <div className="font-medium text-gray-900">
                                          {new Date(
                                            tenant.subscription.currentPeriodStart
                                          ).toLocaleDateString()}{' '}
                                          -{' '}
                                          {new Date(
                                            tenant.subscription.currentPeriodEnd
                                          ).toLocaleDateString()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="border border-gray-200 rounded-lg p-4">
                                  <h4 className="font-semibold text-gray-900 mb-3">
                                    Usage Metrics
                                  </h4>
                                  <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <div className="text-gray-600">Products</div>
                                      <div className="text-2xl font-bold text-gray-900">
                                        {tenant.metrics.product_count}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Sales</div>
                                      <div className="text-2xl font-bold text-gray-900">
                                        {tenant.metrics.sales_count}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-gray-600">Forecasts</div>
                                      <div className="text-2xl font-bold text-gray-900">
                                        {tenant.metrics.forecast_count}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </Tab.Panel>

                            {/* Users Tab */}
                            <Tab.Panel>
                              <div className="space-y-2">
                                {tenant.users.map((user) => (
                                  <div
                                    key={user.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <div>
                                      <div className="font-medium text-gray-900">
                                        {user.fullName || user.email}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {user.email}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-medium text-gray-900 capitalize">
                                        {user.role}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {user.lastLoginAt
                                          ? `Last login: ${new Date(
                                              user.lastLoginAt
                                            ).toLocaleDateString()}`
                                          : 'Never logged in'}
                                      </div>
                                    </div>
                                  </div>
                                ))}

                                {tenant.users.length === 0 && (
                                  <div className="text-center py-8 text-gray-600">
                                    No users found
                                  </div>
                                )}
                              </div>
                            </Tab.Panel>

                            {/* Audit Logs Tab */}
                            <Tab.Panel>
                              <div className="space-y-2">
                                {tenant.auditLogs.map((log) => (
                                  <div
                                    key={log.id}
                                    className="p-4 bg-gray-50 rounded-lg text-sm"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="font-medium text-gray-900">
                                        {log.action}
                                      </div>
                                      <div className="text-xs text-gray-600">
                                        {new Date(log.createdAt).toLocaleString()}
                                      </div>
                                    </div>
                                    <div className="text-gray-600">
                                      Resource: {log.resourceType} (
                                      {log.resourceId.substring(0, 8)})
                                    </div>
                                    {log.metadata && (
                                      <div className="mt-2 p-2 bg-white rounded text-xs font-mono text-gray-700">
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </div>
                                    )}
                                  </div>
                                ))}

                                {tenant.auditLogs.length === 0 && (
                                  <div className="text-center py-8 text-gray-600">
                                    No audit logs found
                                  </div>
                                )}
                              </div>
                            </Tab.Panel>
                          </Tab.Panels>
                        </Tab.Group>
                      </>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Suspend Confirmation Dialog */}
      <Transition appear show={showSuspendDialog} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowSuspendDialog(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Ban className="w-6 h-6 text-yellow-600" />
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Suspend Tenant
                    </Dialog.Title>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    This will suspend the tenant's access. They won't be able to
                    log in until reactivated.
                  </p>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for suspension *
                    </label>
                    <textarea
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Enter reason..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSuspendDialog(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSuspend}
                      disabled={
                        !suspendReason.trim() || suspendMutation.isPending
                      }
                      className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    >
                      {suspendMutation.isPending ? 'Suspending...' : 'Suspend'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Dialog */}
      <Transition appear show={showDeleteDialog} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setShowDeleteDialog(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Delete Tenant
                    </Dialog.Title>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-900 font-medium mb-2">
                      ⚠️ This action cannot be undone!
                    </p>
                    <p className="text-sm text-red-800">
                      This will permanently delete the tenant and all associated
                      data.
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type <span className="font-mono font-bold">DELETE</span> to
                      confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteDialog(false);
                        setDeleteConfirmation('');
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={
                        deleteConfirmation !== 'DELETE' ||
                        deleteMutation.isPending
                      }
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
