/**
 * Production Job Board Component
 *
 * Kanban-style production job management with drag-and-drop:
 * - 5 columns: Pending, In Progress, Quality Check, Complete, On Hold
 * - Drag jobs between status columns
 * - Real-time SSE updates
 * - Job details modal
 * - Priority indicators and time tracking
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  MoreVertical,
  Calendar,
  User,
  Package,
  TrendingUp,
  X,
} from 'lucide-react';
import { useSSE } from '../../hooks/useSSE';

// Job statuses
const JOB_STATUSES = {
  PENDING: { id: 'pending', label: 'Pending', color: 'gray', icon: Clock },
  IN_PROGRESS: { id: 'in_progress', label: 'In Progress', color: 'blue', icon: Play },
  QUALITY_CHECK: { id: 'quality_check', label: 'Quality Check', color: 'yellow', icon: AlertCircle },
  COMPLETE: { id: 'complete', label: 'Complete', color: 'green', icon: CheckCircle2 },
  ON_HOLD: { id: 'on_hold', label: 'On Hold', color: 'red', icon: Pause },
};

// Priority levels
const PRIORITY_LEVELS = {
  LOW: { label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  MEDIUM: { label: 'Medium', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  HIGH: { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  URGENT: { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-300' },
};

/**
 * Sortable Job Card
 */
function SortableJobCard({ job, onClick }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move"
    >
      <JobCard job={job} onClick={onClick} />
    </div>
  );
}

/**
 * Job Card Component
 */
function JobCard({ job, onClick }) {
  const priority = PRIORITY_LEVELS[job.priority] || PRIORITY_LEVELS.MEDIUM;

  // Calculate progress percentage
  const progress = job.completedQuantity && job.targetQuantity
    ? (job.completedQuantity / job.targetQuantity) * 100
    : 0;

  // Calculate time elapsed
  const startTime = job.startTime ? new Date(job.startTime) : null;
  const elapsedHours = startTime
    ? Math.floor((Date.now() - startTime.getTime()) / (1000 * 60 * 60))
    : 0;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900">#{job.jobNumber}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priority.color}`}>
              {priority.label}
            </span>
          </div>
          <p className="text-sm text-gray-600">{job.productName}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Handle menu open
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      {job.targetQuantity && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>{job.completedQuantity || 0} / {job.targetQuantity} units</span>
            <span>{progress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Details */}
      <div className="space-y-2">
        {job.assignedTo && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{job.assignedTo}</span>
          </div>
        )}

        {job.dueDate && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Due: {new Date(job.dueDate).toLocaleDateString()}</span>
          </div>
        )}

        {startTime && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              {elapsedHours > 0 ? `${elapsedHours}h elapsed` : 'Just started'}
            </span>
          </div>
        )}

        {job.machine && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Package className="w-4 h-4" />
            <span>{job.machine}</span>
          </div>
        )}
      </div>

      {/* Alerts */}
      {job.alerts && job.alerts.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {job.alerts.map((alert, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-orange-600">
              <AlertCircle className="w-3 h-3" />
              <span>{alert}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Job Column Component
 */
function JobColumn({ status, jobs }) {
  const StatusIcon = JOB_STATUSES[status].icon;
  const statusConfig = JOB_STATUSES[status];

  const colorClasses = {
    gray: 'bg-gray-50 border-gray-300 text-gray-700',
    blue: 'bg-blue-50 border-blue-300 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-300 text-yellow-700',
    green: 'bg-green-50 border-green-300 text-green-700',
    red: 'bg-red-50 border-red-300 text-red-700',
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-lg p-4">
      {/* Column Header */}
      <div className={`flex items-center gap-2 p-3 rounded-lg border mb-4 ${colorClasses[statusConfig.color]}`}>
        <StatusIcon className="w-5 h-5" />
        <h3 className="font-semibold">{statusConfig.label}</h3>
        <span className="ml-auto text-sm font-medium">
          {jobs.length}
        </span>
      </div>

      {/* Job Cards */}
      <SortableContext
        items={jobs.map(job => job.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex-1 space-y-3 overflow-y-auto">
          {jobs.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-8">
              No jobs in this status
            </div>
          ) : (
            jobs.map(job => (
              <SortableJobCard
                key={job.id}
                job={job}
                onClick={() => {/* Will be handled by parent */}}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/**
 * Job Details Modal
 */
function JobDetailsModal({ job, onClose, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Job #{job.jobNumber}</h2>
            <p className="text-gray-600 mt-1">{job.productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Priority */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={job.status}
                onChange={(e) => onUpdate({ ...job, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(JOB_STATUSES).map(status => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={job.priority}
                onChange={(e) => onUpdate({ ...job, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(PRIORITY_LEVELS).map(priority => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LEVELS[priority].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Production Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Production Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Target Quantity</label>
                <p className="mt-1 text-gray-900">{job.targetQuantity} units</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Completed</label>
                <p className="mt-1 text-gray-900">{job.completedQuantity || 0} units</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Machine</label>
                <p className="mt-1 text-gray-900">{job.machine || 'Not assigned'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <p className="mt-1 text-gray-900">{job.assignedTo || 'Unassigned'}</p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Timeline</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-gray-900">
                  {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Started</label>
                <p className="mt-1 text-gray-900">
                  {job.startTime ? new Date(job.startTime).toLocaleString() : 'Not started'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                <p className="mt-1 text-gray-900">
                  {job.dueDate ? new Date(job.dueDate).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Notes/Comments */}
          {job.notes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                {job.notes}
              </p>
            </div>
          )}

          {/* Activity Log */}
          {job.activityLog && job.activityLog.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Log</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {job.activityLog.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                    <div className="flex-1">
                      <p className="text-gray-900">{activity.action}</p>
                      <p className="text-gray-500 text-xs">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Handle save
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Production Job Board Component
 */
export default function ProductionJobBoard() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch jobs
  const { data, isLoading, error } = useQuery({
    queryKey: ['production', 'jobs'],
    queryFn: async () => {
      const response = await fetch('/api/v1/production/jobs', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const result = await response.json();
      return result.data;
    },
    refetchInterval: 30000, // Fallback polling every 30s
  });

  // Update job status mutation
  const updateJobMutation = useMutation({
    mutationFn: async ({ jobId, updates }) => {
      const response = await fetch(`/api/v1/production/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update job');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['production', 'jobs']);
      queryClient.invalidateQueries(['production', 'overview']);
    },
  });

  // SSE for real-time job updates
  const { connected, lastMessage } = useSSE('production', {
    enabled: true,
    onMessage: (message) => {
      if (message.type === 'job:status' || message.type === 'job:progress') {
        queryClient.invalidateQueries(['production', 'jobs']);
      }
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const jobId = active.id;
    const newStatus = over.id;

    // Find the job
    const job = Object.values(jobsByStatus)
      .flat()
      .find(j => j.id === jobId);

    if (job && job.status !== newStatus) {
      // Update job status
      updateJobMutation.mutate({
        jobId,
        updates: { status: newStatus },
      });
    }

    setActiveId(null);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  // Group jobs by status
  const jobsByStatus = data?.jobs?.reduce((acc, job) => {
    const status = job.status || 'pending';
    if (!acc[status]) acc[status] = [];
    acc[status].push(job);
    return acc;
  }, {}) || {};

  // Ensure all statuses have arrays
  Object.keys(JOB_STATUSES).forEach(status => {
    if (!jobsByStatus[status]) jobsByStatus[status] = [];
  });

  // Apply filters
  const filteredJobsByStatus = Object.keys(jobsByStatus).reduce((acc, status) => {
    acc[status] = jobsByStatus[status].filter(job => {
      const matchesPriority = filterPriority === 'ALL' || job.priority === filterPriority;
      const matchesSearch = !searchQuery ||
        job.jobNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.productName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPriority && matchesSearch;
    });
    return acc;
  }, {});

  // Get active job for drag overlay
  const activeJob = activeId
    ? Object.values(jobsByStatus).flat().find(job => job.id === activeId)
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading jobs: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Job Board</h1>
          <p className="text-gray-600 mt-1">
            Drag and drop jobs to update their status
            {connected && (
              <span className="ml-2 inline-flex items-center gap-1 text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Live
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Priorities</option>
            {Object.keys(PRIORITY_LEVELS).map(priority => (
              <option key={priority} value={priority}>
                {PRIORITY_LEVELS[priority].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Job Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-[600px]">
          {Object.keys(JOB_STATUSES).map(status => (
            <SortableContext
              key={status}
              items={[status]}
              strategy={verticalListSortingStrategy}
            >
              <JobColumn
                status={status}
                jobs={filteredJobsByStatus[status] || []}
              />
            </SortableContext>
          ))}
        </div>

        <DragOverlay>
          {activeJob ? (
            <div className="rotate-3 scale-105">
              <JobCard job={activeJob} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onUpdate={(updatedJob) => {
            updateJobMutation.mutate({
              jobId: updatedJob.id,
              updates: updatedJob,
            });
          }}
        />
      )}
    </div>
  );
}
