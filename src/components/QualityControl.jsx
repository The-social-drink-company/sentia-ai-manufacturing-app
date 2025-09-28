<<<<<<< HEAD
﻿import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

const metricCards = [
  {
    title: 'Defect Rate',
    value: '2.3%',
    description: 'Target 2.0%',
    variant: 'destructive'
  },
  {
    title: 'First Pass Yield',
    value: '94.5%',
    description: 'Target 95%',
    variant: 'secondary'
  },
  {
    title: 'Customer Complaints',
    value: '12',
    description: 'Target under 10',
    variant: 'secondary'
  },
  {
    title: 'Inspection Throughput',
    value: '1,248',
    description: '24h window',
    variant: 'default'
  }
]

const inspectionStages = [
  { label: 'Incoming Materials', progress: 82 },
  { label: 'In-Process Quality', progress: 76 },
  { label: 'Final Inspection', progress: 91 },
  { label: 'Post-Shipment Audits', progress: 63 }
]
=======
import { useState } from 'react';
import {
  BeakerIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  FunnelIcon,
  DocumentChartBarIcon,
  CalendarDaysIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
>>>>>>> branch-23-bulletproof

const QualityControl = () => {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Quality Control</h1>
        <p className="text-sm text-muted-foreground">
          Snapshot of critical quality metrics across inspection checkpoints.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardTitle className="text-base font-medium">{metric.title}</CardTitle>
              <Badge variant={metric.variant}>{metric.description}</Badge>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inspection Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {inspectionStages.map((stage) => (
            <div key={stage.label} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{stage.label}</span>
                <span className="tabular-nums text-muted-foreground">{stage.progress}%</span>
              </div>
              <Progress value={stage.progress} aria-label={`${stage.label} completion`} />
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  )
}

export default QualityControl
