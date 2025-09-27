import {
  UsersIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '../../../components/ui'

export default function ShiftHandover({ shifts, currentShift = 'shift-2' }) {
  // Mock data fallback
  const shiftData = shifts || {
    current: {
      id: 'shift-2',
      name: 'Afternoon Shift (14:00-22:00)',
      supervisor: 'Sarah Johnson',
      startTime: '14:00',
      endTime: '22:00',
      staffCount: 12,
      status: 'active'
    },
    previous: {
      id: 'shift-1',
      name: 'Morning Shift (06:00-14:00)',
      supervisor: 'Mike Chen',
      production: 8500,
      quality: 96.5,
      incidents: 1,
      notes: 'Line 3 had a 30-minute downtime for bearing replacement. Production target met despite delay.',
      handoverItems: [
        'Line 3 bearing replacement completed - monitor vibration levels',
        'Quality inspector reported slight color variation in batch 2024-0926-01',
        'New operator John Smith completed first week training'
      ]
    },
    upcoming: {
      id: 'shift-3',
      name: 'Night Shift (22:00-06:00)',
      supervisor: 'David Williams',
      plannedProduction: 7200,
      criticalTasks: [
        'Complete quality audit on finished goods',
        'Perform preventive maintenance on Line 1',
        'Train replacement operator on Line 4'
      ]
    }
  }

  const getShiftStatus = (shiftId, current) => {
    if (shiftId === current) return { color: 'green', label: 'Active', variant: 'success' }
    return { color: 'gray', label: 'Inactive', variant: 'default' }
  }

  const formatTime = (time) => {
    const [hour, minute] = time.split(':')
    const hourNum = parseInt(hour)
    const ampm = hourNum >= 12 ? 'PM' : 'AM'
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum
    return `${displayHour}:${minute} ${ampm}`
  }

  const ShiftCard = ({ shift, type, title }) => {
    const isActive = shift.id === currentShift
    const status = getShiftStatus(shift.id, currentShift)

    return (
      <Card className={isActive ? 'ring-2 ring-blue-500' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" />
              {title}
            </CardTitle>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Shift</p>
                <p className="font-medium text-gray-900 dark:text-white">{shift.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Supervisor</p>
                <p className="font-medium text-gray-900 dark:text-white">{shift.supervisor}</p>
              </div>
            </div>

            {/* Time Information */}
            {shift.startTime && shift.endTime && (
              <div className="flex items-center space-x-2 text-sm">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">
                  {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                </span>
                {shift.staffCount && (
                  <span className="text-gray-600 dark:text-gray-400">
                    • {shift.staffCount} staff members
                  </span>
                )}
              </div>
            )}

            {/* Previous Shift Summary */}
            {type === 'previous' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">{shift.production?.toLocaleString()}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400">Units Produced</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xl font-bold text-green-600">{shift.quality}%</p>
                    <p className="text-xs text-green-700 dark:text-green-400">Quality Rate</p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    shift.incidents === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'
                  }`}>
                    <p className={`text-xl font-bold ${
                      shift.incidents === 0 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {shift.incidents}
                    </p>
                    <p className={`text-xs ${
                      shift.incidents === 0 ? 'text-green-700 dark:text-green-400' : 'text-yellow-700 dark:text-yellow-400'
                    }`}>
                      Incidents
                    </p>
                  </div>
                </div>

                {/* Shift Notes */}
                {shift.notes && (
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex items-start">
                      <DocumentTextIcon className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
                          Shift Summary
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{shift.notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Handover Items */}
                {shift.handoverItems && shift.handoverItems.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <ArrowRightIcon className="h-4 w-4 mr-1 text-blue-600" />
                      Handover Items
                    </h4>
                    <div className="space-y-2">
                      {shift.handoverItems.map((item, _index) => (
                        <div key={index} className="flex items-start p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <CheckCircleIcon className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm text-blue-800 dark:text-blue-200">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Current Shift Status */}
            {type === 'current' && isActive && (
              <div className="space-y-3">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Shift currently active
                    </span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Started at {formatTime(shift.startTime)} • {shift.staffCount} team members on duty
                  </p>
                </div>

                {/* Real-time Progress */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Shift Progress</p>
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: '65%' }} // Would be calculated based on current time
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">65%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Time Remaining</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">2h 45m</p>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Shift Planning */}
            {type === 'upcoming' && (
              <div className="space-y-3">
                {shift.plannedProduction && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                        Planned Production
                      </span>
                      <span className="text-lg font-bold text-purple-600">
                        {shift.plannedProduction.toLocaleString()} units
                      </span>
                    </div>
                  </div>
                )}

                {shift.criticalTasks && shift.criticalTasks.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-orange-600" />
                      Critical Tasks
                    </h4>
                    <div className="space-y-2">
                      {shift.criticalTasks.map((task, _index) => (
                        <div key={index} className="flex items-start p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                          <ClipboardDocumentListIcon className="h-4 w-4 text-orange-600 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm text-orange-800 dark:text-orange-200">{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UsersIcon className="h-6 w-6 mr-2 text-blue-600" />
          Shift Management & Handover
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Previous Shift */}
          <ShiftCard
            shift={shiftData.previous}
            type="previous"
            title="Previous Shift"
          />

          {/* Current Shift */}
          <ShiftCard
            shift={shiftData.current}
            type="current"
            title="Current Shift"
          />

          {/* Upcoming Shift */}
          <ShiftCard
            shift={shiftData.upcoming}
            type="upcoming"
            title="Upcoming Shift"
          />
        </div>

        {/* Shift Transition Timeline */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            24-Hour Shift Timeline
          </h4>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-600"></div>

            <div className="relative flex justify-between">
              {/* Shift 3 End / Shift 1 Start */}
              <div className="text-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full mb-2"></div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">06:00</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Day Shift</p>
              </div>

              {/* Shift 1 End / Shift 2 Start */}
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mb-2 ${
                  shiftData.current.id === 'shift-2' ? 'bg-green-600' : 'bg-gray-400'
                }`}></div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">14:00</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Afternoon</p>
              </div>

              {/* Shift 2 End / Shift 3 Start */}
              <div className="text-center">
                <div className={`w-3 h-3 rounded-full mb-2 ${
                  shiftData.upcoming.id === 'shift-3' ? 'bg-purple-600' : 'bg-gray-400'
                }`}></div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">22:00</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Night Shift</p>
              </div>

              {/* Shift 3 End */}
              <div className="text-center">
                <div className="w-3 h-3 bg-gray-400 rounded-full mb-2"></div>
                <p className="text-xs font-medium text-gray-900 dark:text-white">06:00</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Next Day</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
            Create Handover Report
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition">
            View Full History
          </button>
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Print Summary
          </button>
        </div>
      </CardContent>
    </Card>
  )
}