import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const DataImport = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">DataImport</h1>
        <p className="text-slate-600 dark:text-slate-400">Enterprise dataimport functionality</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>DataImport Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-400">
            Advanced dataimport capabilities coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default DataImport

