import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle , Alert, AlertDescription } from '../../../components/ui'

const generateMockQualityData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return {
    defectRate: days.map(day => ({
      day,
      rate: Math.random() * 5 + 0.5,
      target: 2
    })),
    qualityScore: [
      { name: 'Quality Score', value: 94, fill: '#10b981' }
    ],
    defectTypes: [
      { type: 'Packaging', count: 23, percentage: 35 },
      { type: 'Labeling', count: 18, percentage: 27 },
      { type: 'Fill Level', count: 15, percentage: 23 },
      { type: 'Cap Issues', count: 10, percentage: 15 }
    ],
    batchResults: [
      { batch: 'B-001', passed: 485, failed: 15, passRate: 97 },
      { batch: 'B-002', passed: 492, failed: 8, passRate: 98.4 },
      { batch: 'B-003', passed: 478, failed: 22, passRate: 95.6 },
      { batch: 'B-004', passed: 495, failed: 5, passRate: 99 },
      { batch: 'B-005', passed: 480, failed: 20, passRate: 96 }
    ],
    alerts: [
      {
        id: 1,
        severity: 'warning',
        message: 'Defect rate trending above target on Line 2',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        severity: 'success',
        message: 'Batch B-004 achieved 99% pass rate',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  }
}

export function QualityMetrics({ data, onAlertClick }) {
  const [selectedMetric, setSelectedMetric] = useState('defectRate')
  const qualityData = useMemo(() => data || generateMockQualityData(), [data])

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  const renderDefectRateChart = () => (
    <Card>
      <CardHeader>
        <CardTitle>Defect Rate Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={qualityData.defectRate}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              name="Actual"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="#ef4444"
              name="Target"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const renderQualityScore = () => (
    <Card>
      <CardHeader>
        <CardTitle>Overall Quality Score</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            data={qualityData.qualityScore}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill="#10b981"
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-3xl font-bold"
            >
              {qualityData.qualityScore[0].value}%
            </text>
            <text
              x="50%"
              y="60%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-sm text-gray-600"
            >
              Excellent
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const renderDefectTypes = () => (
    <Card>
      <CardHeader>
        <CardTitle>Defect Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={qualityData.defectTypes}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ type, percentage }) => `${type} (${percentage}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {qualityData.defectTypes.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const renderBatchResults = () => (
    <Card>
      <CardHeader>
        <CardTitle>Batch Quality Results</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={qualityData.batchResults}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="batch" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="passed" stackId="a" fill="#10b981" name="Passed" />
            <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const renderAlerts = () => (
    <Card>
      <CardHeader>
        <CardTitle>Quality Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {qualityData.alerts.map(alert => (
            <Alert
              key={alert.id}
              variant={alert.severity}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onAlertClick && onAlertClick(alert)}
            >
              <AlertDescription className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {alert.severity === 'warning' && <ExclamationTriangleIcon className="h-4 w-4" />}
                  {alert.severity === 'success' && <CheckCircleIcon className="h-4 w-4" />}
                  {alert.severity === 'error' && <XCircleIcon className="h-4 w-4" />}
                  <span>{alert.message}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  const renderSummaryMetrics = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold">96.8%</p>
              <p className="text-xs text-green-600">+2.3% vs last week</p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Defect Rate</p>
              <p className="text-2xl font-bold">3.2%</p>
              <p className="text-xs text-red-600">+0.5% vs target</p>
            </div>
            <XCircleIcon className="h-8 w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inspections</p>
              <p className="text-2xl font-bold">2,450</p>
              <p className="text-xs text-gray-600">Today</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rework Rate</p>
              <p className="text-2xl font-bold">1.8%</p>
              <p className="text-xs text-green-600">-0.3% vs last week</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="space-y-6">
      {renderSummaryMetrics()}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderDefectRateChart()}
        {renderQualityScore()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderDefectTypes()}
        {renderBatchResults()}
      </div>

      {renderAlerts()}
    </div>
  )
}