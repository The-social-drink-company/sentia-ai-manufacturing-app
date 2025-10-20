/**
 * Audit Log Viewer Component
 *
 * Displays comprehensive audit log table with filtering, pagination, and CSV export.
 * Tracks all administrative actions performed by master admins.
 *
 * @module src/pages/master-admin/components/AuditLogViewer
 * @epic PHASE-5.1-MASTER-ADMIN-DASHBOARD
 * @story ADMIN-008
 */

import { useState } from 'react';
import { FileText, Download, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMasterAdminAuditLogs } from '../hooks/useMasterAdmin';
import { format } from 'date-fns';

export function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const { data, isLoading, error } = useMasterAdminAuditLogs({
    page,
    limit: 50,
    ...(actionFilter && { action: actionFilter }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  });

  const logs = data?.success ? data.data : [];
  const pagination = data?.pagination;

  // Export logs to CSV
  const exportToCSV = () => {
    if (!logs || logs.length === 0) {
      alert('No logs to export');
      return;
    }

    const headers = ['Timestamp', 'Action', 'Resource Type', 'Resource ID', 'Tenant', 'Metadata'];
    const rows = logs.map((log: any) => [
      new Date(log.createdAt).toISOString(),
      log.action,
      log.resourceType,
      log.resourceId,
      log.tenant?.name || 'N/A',
      JSON.stringify(log.metadata || {}),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clear all filters
  const clearFilters = () => {
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Audit Logs</h3>
              <p className="text-sm text-gray-600">
                {pagination ? `${pagination.total} total logs` : 'Loading...'}
              </p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            disabled={!logs || logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Action Type
            </label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Actions</option>
              <option value="tenant.created">Tenant Created</option>
              <option value="tenant.updated">Tenant Updated</option>
              <option value="tenant.suspended">Tenant Suspended</option>
              <option value="tenant.reactivated">Tenant Reactivated</option>
              <option value="tenant.deleted">Tenant Deleted</option>
              <option value="user.impersonated">User Impersonated</option>
              <option value="subscription.updated">Subscription Updated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-t border-red-200 p-8 text-center">
            <p className="text-red-900 text-sm">Failed to load audit logs</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-600">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-1">No audit logs found</p>
            <p className="text-sm">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(log.createdAt), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(new Date(log.createdAt), 'h:mm:ss a')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 capitalize">
                      {log.resourceType}
                    </div>
                    <div className="text-xs text-gray-600 font-mono">
                      {log.resourceId.substring(0, 12)}...
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {log.tenant?.name || 'N/A'}
                    </div>
                    {log.tenant && (
                      <div className="text-xs text-gray-600">
                        {log.tenant.slug}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.metadata && (
                      <details className="cursor-pointer group">
                        <summary className="text-sm text-blue-600 hover:text-blue-700 font-medium list-none">
                          View metadata →
                        </summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-700 max-w-md overflow-x-auto">
                          <pre className="whitespace-pre-wrap break-words">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      </details>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total}{' '}
              total logs)
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-900">
                {page}
              </div>
              <button
                onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                disabled={page === pagination.totalPages}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Action Badge Component
const ActionBadge = ({ action }: { action: string }) => {
  const actionColors: Record<string, { bg: string; text: string }> = {
    'tenant.created': { bg: 'bg-green-100', text: 'text-green-800' },
    'tenant.updated': { bg: 'bg-blue-100', text: 'text-blue-800' },
    'tenant.suspended': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
    'tenant.reactivated': { bg: 'bg-green-100', text: 'text-green-800' },
    'tenant.deleted': { bg: 'bg-red-100', text: 'text-red-800' },
    'user.impersonated': { bg: 'bg-purple-100', text: 'text-purple-800' },
    'subscription.updated': { bg: 'bg-blue-100', text: 'text-blue-800' },
  };

  const color = actionColors[action] || { bg: 'bg-gray-100', text: 'text-gray-800' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text}`}
    >
      {action}
    </span>
  );
};
