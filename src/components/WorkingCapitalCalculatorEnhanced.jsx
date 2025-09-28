<<<<<<< HEAD
﻿import WorkingCapitalCalculator from './WorkingCapitalCalculator'
=======
import { useState, useEffect, useRef } from 'react';
import { logError } from '../utils/structuredLogger.js'
>>>>>>> branch-23-bulletproof
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const scenarioSummaries = [
  {
    title: 'Base Case',
    description: 'Current receivable, payable, and inventory balances.',
    highlight: 'Working capital neutral'
  },
  {
    title: 'Accelerated Collections',
    description: 'Reduce receivable days by 5% to release cash.',
    highlight: '+$42k liquidity'
  },
  {
    title: 'Supplier Extension',
    description: 'Extend payable terms by 10 days with strategic partners.',
    highlight: '+$28k liquidity'
  }
]

const WorkingCapitalCalculatorEnhanced = () => {
  return (
    <div className="space-y-6">
      <WorkingCapitalCalculator />

      <Card>
        <CardHeader>
          <CardTitle>Scenario Guide</CardTitle>
          <CardDescription>Quick what-if plays tailored for the Sentia operating model.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {scenarioSummaries.map((scenario) => (
            <div key={scenario.title} className="space-y-2 rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{scenario.title}</h3>
                <Badge variant="secondary">Recommended</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{scenario.description}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">{scenario.highlight}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default WorkingCapitalCalculatorEnhanced
