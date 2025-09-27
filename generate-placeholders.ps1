# generate-placeholders.ps1
# Creates starter placeholder components and services
# Safe: won't overwrite existing files

function Write-FileIfMissing($path, $content) {
  if (-not (Test-Path $path)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $path) | Out-Null
    $content | Set-Content $path -Encoding UTF8
    Write-Host "Created: $path"
  } else {
    Write-Host "Skipped (already exists): $path"
  }
}

# ------------- Core Components & Pages ----------------
Write-FileIfMissing "src\components\QualityControl.jsx" @'
import React from 'react'
import PropTypes from 'prop-types'

export default function QualityControl({ title = 'Quality Control', children, className = '', style }) {
  return (
    <section className={`p-4 ${className}`} style={style} aria-labelledby="qc-heading">
      <h1 id="qc-heading" className="text-xl font-semibold">{title}</h1>
      <p className="text-sm text-gray-500 mt-1">Placeholder — replace with real QC dashboard.</p>
      <div className="mt-4">
        {children}
      </div>
    </section>
  )
}
QualityControl.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.object,
}
'@

Write-FileIfMissing "src\pages\SupplyChain.jsx" @'
import React from 'react'
export default function SupplyChain() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Supply Chain</h1>
      <p className="text-gray-600">Placeholder — replace with supply planning, lead times, OTIF, ASN views.</p>
    </main>
  )
}
'@

Write-FileIfMissing "src\pages\Dashboard\EnterpriseDashboard.jsx" @'
import React from 'react'
import { ArrowTrendingUpIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export default function EnterpriseDashboard() {
  const cards = [
    { label: 'Revenue', value: '£1.2m', Icon: CurrencyDollarIcon },
    { label: 'Throughput', value: '2,450 u/d', Icon: ChartBarIcon },
    { label: 'Trend', value: '+4.3%', Icon: ArrowTrendingUpIcon },
  ]
  return (
    <div className="p-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ label, value, Icon }) => (
        <div key={label} className="rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" aria-hidden />
            <div className="text-sm text-gray-600">{label}</div>
          </div>
          <div className="mt-2 text-xl font-semibold">{value}</div>
        </div>
      ))}
    </div>
  )
}
'@

# ------------- Inventory / Analytics / Data -----------
Write-FileIfMissing "src\components\inventory\AdvancedInventoryManagement.jsx" @'
import React from 'react'
export default function AdvancedInventoryManagement() {
  return (
    <section className="p-4">
      <h2 className="text-lg font-semibold">Advanced Inventory Management</h2>
      <p className="text-gray-600">Placeholder — analytics and recommendations.</p>
    </section>
  )
}
'@

Write-FileIfMissing "src\components\analytics\AdvancedAnalyticsDashboard.jsx" @'
import React from 'react'
export default function AdvancedAnalyticsDashboard() {
  return (
    <section className="p-4">
      <h2 className="text-lg font-semibold">Advanced Analytics</h2>
      <p className="text-gray-600">Placeholder — replace with real analytics widgets.</p>
    </section>
  )
}
'@

Write-FileIfMissing "src\components\data\DataManagementCenter.jsx" @'
import React from 'react'
export default function DataManagementCenter() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Data Management Center</h2>
      <p className="text-gray-600">Placeholder — import/export pipelines.</p>
    </div>
  )
}
'@

# ------------- Mobile & Reporting --------------------
Write-FileIfMissing "src\components\mobile\MobileFloorDashboard.jsx" @'
import React from 'react'
export default function MobileFloorDashboard() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Mobile Floor Dashboard</h2>
      <p className="text-gray-600">Placeholder — operator KPIs & controls.</p>
    </div>
  )
}
'@

Write-FileIfMissing "src\pages\Mobile.jsx" @'
import React from 'react'
import MobileFloorDashboard from "../components/mobile/MobileFloorDashboard"
export default function Mobile() {
  return <main className="p-4"><MobileFloorDashboard /></main>
}
'@

Write-FileIfMissing "src\pages\MobileFloor.jsx" @'
import React from 'react'
import MobileFloorDashboard from "../components/mobile/MobileFloorDashboard"
export default function MobileFloor() {
  return <main className="p-4"><MobileFloorDashboard /></main>
}
'@

Write-FileIfMissing "src\pages\MissionControl.jsx" @'
import React from 'react'
export default function MissionControl() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Mission Control</h1>
      <p className="text-gray-600">Placeholder — global status & orchestration.</p>
    </main>
  )
}
'@

Write-FileIfMissing "src\pages\MCPMonitoringDashboard.jsx" @'
import React from 'react'
export default function MCPMonitoringDashboard() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">MCP Monitoring</h1>
      <p className="text-gray-600">Placeholder — machine connectivity.</p>
    </main>
  )
}
'@

Write-FileIfMissing "src\components\reporting\BoardReadyReportGenerator.jsx" @'
import React from 'react'
export default function BoardReadyReportGenerator() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Board-Ready Reports</h2>
      <p className="text-gray-600">Placeholder — generate executive reports.</p>
    </div>
  )
}
'@

# ------------- Quality & Production ------------------
Write-FileIfMissing "src\components\quality\QualityControlMonitor.jsx" @'
import React from 'react'
export default function QualityControlMonitor() {
  return (
    <section className="p-4">
      <h2 className="text-lg font-semibold">Quality Control Monitor</h2>
      <p className="text-gray-600">Placeholder — SPC charts & defect streams.</p>
    </section>
  )
}
'@

Write-FileIfMissing "src\components\production\RealTimeProductionMonitor.jsx" @'
import React from 'react'
export default function RealTimeProductionMonitor() {
  return (
    <section className="p-4">
      <h2 className="text-lg font-semibold">Real-Time Production Monitor</h2>
      <p className="text-gray-600">Placeholder — replace with live widgets.</p>
    </section>
  )
}
'@

# ------------- Executive & AI ------------------------
Write-FileIfMissing "src\components\Executive\ExecutiveKPIDashboard.jsx" @'
import React from 'react'
import { ArrowTrendingUpIcon, CurrencyDollarIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export default function ExecutiveKPIDashboard() {
  const items = [
    { label: "EBITDA", value: "£320k", Icon: CurrencyDollarIcon },
    { label: "YoY Trend", value: "+3.8%", Icon: ArrowTrendingUpIcon },
    { label: "Throughput", value: "2,450 u/d", Icon: ChartBarIcon },
  ]
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 p-4">
      {items.map(({ label, value, Icon }) => (
        <div key={label} className="rounded-xl border p-4">
          <div className="text-sm text-gray-600">{label}</div>
          <div className="mt-1 flex items-center gap-2">
            <Icon className="h-5 w-5" aria-hidden />
            <span className="text-xl font-semibold">{value}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
'@

Write-FileIfMissing "src\components\AI\AIAnalyticsDashboard.jsx" @'
import React from 'react'
export default function AIAnalyticsDashboard() {
  return (
    <section className="p-4">
      <h2 className="text-lg font-semibold">AI Analytics Dashboard</h2>
      <p className="text-gray-600">Placeholder — AI insights appear here.</p>
    </section>
  )
}
'@

# ------------- Admin / System ------------------------
Write-FileIfMissing "src\components\admin\UserAdminPanel.jsx" @'
import React from 'react'
export default function UserAdminPanel() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">User Administration</h2>
      <p className="text-gray-600">Placeholder — manage users & roles.</p>
    </div>
  )
}
'@

Write-FileIfMissing "src\components\admin\SystemAdminPanel.jsx" @'
import React from 'react'
export default function SystemAdminPanel() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">System Administration</h2>
      <p className="text-gray-600">Placeholder — system configuration.</p>
    </div>
  )
}
'@

Write-FileIfMissing "src\components\admin\PersonnelManagement.jsx" @'
import React from 'react'
export default function PersonnelManagement() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">Personnel Management</h2>
      <p className="text-gray-600">Placeholder — staffing and skills.</p>
    </div>
  )
}
'@

# ------------- Services ------------------------------
Write-FileIfMissing "src\services\ManufacturingAnalyticsService.js" @'
// Auto-generated placeholder service
export const manufacturingAnalyticsService = {
  async getKPIs() { return [{ name: "Throughput", value: 2450, unit: "u/d" }] },
  async getTrends() { return [] },
  async getAnomalies() { return [] },
}
export default manufacturingAnalyticsService
'@

# ------------- Charts --------------------------------
Write-FileIfMissing "src\components\charts\ChartErrorBoundary.jsx" @'
import React from 'react'
export default class ChartErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error, info) { console.error("ChartErrorBoundary", error, info) }
  render() {
    if (this.state.hasError) {
      return <div className="border p-2 text-sm">Chart failed to render.</div>
    }
    return this.props.children
  }
}
'@

# ------------- User & Preferences --------------------
Write-FileIfMissing "src\pages\UserPreferences.jsx" @'
import React, { useState } from "react"
export default function UserPreferences() {
  const [theme, setTheme] = useState("system")
  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold">User Preferences</h1>
      <select value={theme} onChange={(e) => setTheme(e.target.value)} className="mt-2 border p-2">
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </main>
  )
}
'@
