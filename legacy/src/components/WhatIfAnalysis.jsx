import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const WhatIfAnalysis = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">What-If Analysis</h1>
        <p className="text-slate-600 dark:text-slate-400">Scenario modeling and growth projections</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Scenario Modeling</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-400">
            Advanced scenario modeling capabilities coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default WhatIfAnalysis

